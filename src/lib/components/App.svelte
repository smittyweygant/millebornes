<script lang="ts">
    import { onMount } from 'svelte';
    import { db } from "$lib/firebase";
    import { collection, addDoc, doc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
    import { FirebaseService } from '$lib/services/firebaseService';
    import GameBoard from '$lib/components/GameBoard.svelte';
    import CardComponent from '$lib/components/Card.svelte';
    import { gameStore } from "$lib/stores/gameStore";
    import { hazardRemedyPairs, safetyProtections } from "$lib/utils/gameRules";
    import type { Card, CardEffect } from "$lib/types/cardTypes";
    import type { PlayerStatus, GameState } from "$lib/types/gameTypes";

    let gameId: string | null = null;
    let playerId: string | null = null;
    let joinGameId = "";
    let gameData: GameState | null = null;
    let isHost = false;
    
    const fbService = new FirebaseService();
    
    // Helper function to safely access record with string key
    function updateRecord<T>(record: Record<string, T>, key: string | null, value: T): Record<string, T> {
      if (!key) return record;
      return { ...record, [key]: value };
    }
    
    onMount(() => {
      const savedGameId = localStorage.getItem('millebornes_gameId');
      const savedPlayerId = localStorage.getItem('millebornes_playerId');
      
      if (savedGameId && savedPlayerId) {
        gameId = savedGameId;
        playerId = savedPlayerId;
        checkGameExists(savedGameId);
      }
    });
    
    const checkGameExists = async (id: string) => {
      try {
        const exists = await fbService.checkGameExists(id);
        if (!exists) {
          resetGameState();
        }
      } catch (err) {
        console.error('Error checking game:', err);
        resetGameState();
      }
    };

    async function createGame() {
      try {
        const newGameId = await fbService.createNewGame();
        gameId = newGameId;
        playerId = "player1";
        isHost = true;
        localStorage.setItem('millebornes_gameId', newGameId);
        localStorage.setItem('millebornes_playerId', "player1");
      } catch (err) {
        console.error('Error creating game:', err);
      }
    }

    async function joinGame() {
      try {
        if (!joinGameId) return;
        const newPlayerId = await fbService.joinExistingGame(joinGameId);
        if (newPlayerId) {
          gameId = joinGameId;
          playerId = newPlayerId;
          localStorage.setItem('millebornes_gameId', joinGameId);
          localStorage.setItem('millebornes_playerId', newPlayerId);
        }
      } catch (err) {
        console.error('Error joining game:', err);
      }
    }
    
    const resetGameState = () => {
      localStorage.removeItem('millebornes_gameId');
      localStorage.removeItem('millebornes_playerId');
      gameId = null;
      playerId = null;
      gameStore.set({
        players: [],
        deck: [],
        discardPile: [],
        playerHands: {},
        playArea: {},
        playerState: {},
        activeHazards: {},
        activeSafeties: {},
        currentPlayer: '',
        gameOver: false,
        winner: null
      });
    };
    
    const exitGame = () => {
      resetGameState();
    };

    async function drawCard() {
      if (!gameId || !playerId || $gameStore.gameOver || $gameStore.currentPlayer !== playerId) return;

      const deck = $gameStore.deck;
      if (deck.length === 0) return;

      const [drawnCard, ...remainingDeck] = deck;
      const playerHand = [...($gameStore.playerHands[playerId] || []), drawnCard];

      gameStore.updateDeck(remainingDeck);
      gameStore.updatePlayerHand(playerId, playerHand);

      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        deck: remainingDeck,
        [`playerHands.${playerId}`]: playerHand
      });
    }

    async function playCard(index: number) {
      if (!gameId || !playerId || $gameStore.gameOver || $gameStore.currentPlayer !== playerId) return;

      const hand = $gameStore.playerHands[playerId] || [];
      if (index < 0 || index >= hand.length) return;

      const card = hand[index];
      const remainingHand = hand.filter((_, i) => i !== index);
      let turnShouldEnd = true;

      if (!gameId) return;
      const gameRef = doc(db, "games", gameId);

      switch (card.type) {
        case "distance": {
          if ($gameStore.playerState[playerId] !== "moving") {
            turnShouldEnd = false;
            break;
          }
          const playArea = { ...$gameStore.playArea };
          const playerCards = [...(playArea[playerId] || []), card];
          await updateDoc(gameRef, {
            [`playArea.${playerId}`]: playerCards,
            [`playerHands.${playerId}`]: remainingHand
          });
          gameStore.update(state => ({
            ...state,
            playArea: updateRecord(state.playArea, playerId, playerCards),
            playerHands: updateRecord(state.playerHands, playerId, remainingHand)
          }));
          break;
        }

        case "hazard": {
          const allPlayers = Object.keys($gameStore.playerHands);
          const targetPlayer = allPlayers.find(p => p !== playerId);
          if (!targetPlayer || !card.effect) {
            turnShouldEnd = false;
            break;
          }

          const protection = safetyProtections[card.effect];
          if (protection && $gameStore.activeSafeties[targetPlayer]?.includes(protection)) {
            turnShouldEnd = false;
            break;
          }

          const hazards = [...($gameStore.activeHazards[targetPlayer] || []), card.effect];
          await updateDoc(gameRef, {
            [`activeHazards.${targetPlayer}`]: hazards,
            [`playerState.${targetPlayer}`]: "blocked!" as PlayerStatus,
            [`playerHands.${playerId}`]: remainingHand
          });
          gameStore.update(state => ({
            ...state,
            activeHazards: updateRecord(state.activeHazards, targetPlayer, hazards),
            playerState: updateRecord(state.playerState, targetPlayer, "blocked!"),
            playerHands: updateRecord(state.playerHands, playerId, remainingHand)
          }));
          break;
        }

        case "remedy": {
          if (!card.effect) {
            turnShouldEnd = false;
            break;
          }

          const hazardToRemove = Object.entries(hazardRemedyPairs)
            .find(([_, remedy]) => remedy === card.effect)?.[0] as CardEffect;

          if (!hazardToRemove || !$gameStore.activeHazards[playerId]?.includes(hazardToRemove)) {
            turnShouldEnd = false;
            break;
          }

          const hazards = $gameStore.activeHazards[playerId]
            .filter(h => h !== hazardToRemove);

          const newPlayerState: PlayerStatus = hazards.length === 0 ? "moving" : "blocked!";
          
          await updateDoc(gameRef, {
            [`activeHazards.${playerId}`]: hazards,
            [`playerState.${playerId}`]: newPlayerState,
            [`playerHands.${playerId}`]: remainingHand
          });

          gameStore.update(state => ({
            ...state,
            activeHazards: updateRecord(state.activeHazards, playerId, hazards),
            playerState: updateRecord(state.playerState, playerId, newPlayerState),
            playerHands: updateRecord(state.playerHands, playerId, remainingHand)
          }));
          break;
        }

        case "safety": {
          if (!card.effect) {
            turnShouldEnd = false;
            break;
          }

          const safeties = [...($gameStore.activeSafeties[playerId] || []), card.effect];
          await updateDoc(gameRef, {
            [`activeSafeties.${playerId}`]: safeties,
            [`playerHands.${playerId}`]: remainingHand
          });

          gameStore.update(state => ({
            ...state,
            activeSafeties: updateRecord(state.activeSafeties, playerId, safeties),
            playerHands: updateRecord(state.playerHands, playerId, remainingHand)
          }));
          turnShouldEnd = false;
          break;
        }
      }

      if (turnShouldEnd) {
        await endTurn();
      }
    }

    async function discardCard(index: number) {
      if (!gameId || !playerId || $gameStore.gameOver || $gameStore.currentPlayer !== playerId) return;

      const hand = $gameStore.playerHands[playerId] || [];
      if (index < 0 || index >= hand.length) return;

      const card = hand[index];
      const remainingHand = hand.filter((_, i) => i !== index);
      const updatedDiscardPile = [...$gameStore.discardPile, card];

      if (!gameId) return;
      const gameRef = doc(db, "games", gameId);
      
      await updateDoc(gameRef, {
        discardPile: updatedDiscardPile,
        [`playerHands.${playerId}`]: remainingHand
      });

      gameStore.update(state => ({
        ...state,
        discardPile: updatedDiscardPile,
        playerHands: updateRecord(state.playerHands, playerId, remainingHand)
      }));

      await endTurn();
    }

    async function endTurn() {
      if (!gameId) return;
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data();
      if (!gameData) return;

      const currentPlayerIndex = gameData.players.indexOf($gameStore.currentPlayer);
      const nextPlayer = gameData.players[(currentPlayerIndex + 1) % gameData.players.length];

      await updateDoc(gameRef, {
        currentPlayer: nextPlayer
      });

      gameStore.update(state => ({
        ...state,
        currentPlayer: nextPlayer
      }));
    }
  </script>
  
  <main>
    {#if !gameId}
      <div class="setup-container">
        <div class="create-game">
          <h2>Create New Game</h2>
          <button on:click={createGame}>Create Game</button>
        </div>

        <div class="join-game">
          <h2>Join Existing Game</h2>
          <input type="text" bind:value={joinGameId} placeholder="Enter Game ID" />
          <button on:click={joinGame}>Join Game</button>
        </div>
      </div>
    {:else}
      <div class="game-container">
        <button class="exit-btn" on:click={exitGame}>Exit Game</button>
        
        <div class="game-header">
          <h2>Game ID: {gameId}</h2>
          <h2 class="turn-indicator">
            Current Turn: <span class="active-player">{$gameStore.currentPlayer.replace("player", "Player ")}</span>
          </h2>
        </div>

        <section class="player-status">
          <h2>Player Status</h2>
          {#each Object.keys($gameStore.playerState) as player}
            <div class="player-section">
              <h3>{player.replace("player", "Player ")}</h3>
              <p>Status: <span class="status-badge {$gameStore.playerState[player]}">{$gameStore.playerState[player]}</span></p>
            </div>
          {/each}
        </section>

        <section class="play-area">
          <h2>Play Area</h2>
          <div class="players">
            {#each Object.keys($gameStore.playerHands) as player}
              <div class="player-section {player === $gameStore.currentPlayer ? 'active' : ''}">
                <h3>{player.replace("player", "Player ")}</h3>

                {#if $gameStore.activeSafeties[player]?.length > 0}
                  <section class="safety-protections">
                    <h4>Safety Protections</h4>
                    <div class="safety-cards">
                      {#each $gameStore.activeSafeties[player] as safety}
                        <CardComponent card={{ type: "safety", effect: safety }} />
                      {/each}
                    </div>
                  </section>
                {/if}

                {#if $gameStore.activeHazards[player]?.length > 0}
                  <section class="hazards">
                    <h4>Hazards!</h4>
                    <div class="hazard-cards">
                      {#each $gameStore.activeHazards[player] as hazard}
                        <CardComponent card={{ type: "hazard", effect: hazard }} />
                      {/each}
                    </div>
                  </section>
                {/if}

                {#if $gameStore.playArea[player]?.length > 0}
                  <section class="distance-area">
                    <h4>Distance</h4>
                    <div class="distance-cards">
                      {#each $gameStore.playArea[player] as card}
                        <CardComponent {card} />
                      {/each}
                    </div>
                  </section>
                {/if}
              </div>
            {/each}
          </div>
        </section>

        <section class="game-controls">
          <div class="draw-pile">
            <h2>Draw Pile ({$gameStore.deck.length} cards)</h2>
            <button on:click={drawCard} disabled={$gameStore.currentPlayer !== playerId}>Draw a Card</button>
          </div>

          <div class="player-hand">
            <h2>Your Hand</h2>
            <div class="hand">
              {#each ($gameStore.playerHands[playerId ?? ''] || []) as card, i}
                <div class="card-container">
                  <CardComponent {card} />
                  {#if $gameStore.currentPlayer === playerId}
                    <div class="card-actions">
                      <button on:click={() => playCard(i)}>Play</button>
                      <button on:click={() => discardCard(i)}>Discard</button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <div class="discard-pile">
            <h2>Discard Pile</h2>
            {#if $gameStore.discardPile.length > 0}
              <CardComponent card={$gameStore.discardPile[$gameStore.discardPile.length - 1]} />
            {:else}
              <p>Empty</p>
            {/if}
          </div>
        </section>
      </div>
    {/if}
  </main>
  
  <style>
    main {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .setup-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: center;
      margin-top: 2rem;
    }

    .create-game, .join-game {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .game-container {
      position: relative;
      padding: 1rem;
    }

    .game-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .turn-indicator {
      font-size: 1.5rem;
      margin: 1rem 0;
    }

    .active-player {
      color: #ff5722;
    }

    .player-status {
      margin-bottom: 2rem;
    }

    .player-section {
      border: 2px solid transparent;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
    }

    .active {
      border-color: #ff5722;
      background-color: rgba(255, 87, 34, 0.1);
    }

    .game-controls {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    .hand, .play-area, .safety-protections, .hazards {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .card-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .exit-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background-color: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .exit-btn:hover {
      background-color: #cf1322;
    }

    .status-badge {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 5px;
    }

    .status-badge.moving { color: green; }
    .status-badge.blocked { color: red; }
    .status-badge.protected { color: blue; }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #1890ff;
      color: white;
      font-size: 0.9rem;
    }

    button:hover {
      background-color: #096dd9;
    }

    button:disabled {
      background-color: #d9d9d9;
      cursor: not-allowed;
    }

    input {
      padding: 0.5rem;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  </style>