<script lang="ts">
    import { db } from "$lib/firebase";
    import { collection, addDoc, doc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
    import { deck, playerHand, playerHands, discardPile, playArea, playerDistances, playerStatus, currentPlayer, gameOver, winner } from "$lib/gameStore";
    import Card from "$lib/Card.svelte";
  
    let gameId = "";
    let joinGameId = "";
    let gameData = null;
    let isHost = false;
    let playerId = "";
  
    async function createGame() {
        const gameRef = await addDoc(collection(db, "games"), {
            players: ["player1"],  
            deck: $deck,
            playArea: { player1: [] },
            discardPile: $discardPile,
            playerHands: { player1: [] },  
            currentPlayer: "player1",
            createdAt: new Date(),
        });

        gameId = gameRef.id;
        isHost = true;
        playerId = "player1";

        await updateDoc(doc(db, "games", gameId), {
            [`playerHands.player1`]: [],
            [`playArea.player1`]: []
        });

        console.log("Game created with ID:", gameId, "with game creator as player1");

        onSnapshot(doc(db, "games", gameId), (snapshot) => {
            const updatedGame = snapshot.data();

            deck.set(updatedGame.deck);
            discardPile.set(updatedGame.discardPile);
            playerHands.set(updatedGame.playerHands);
            playArea.set(updatedGame.playArea);
            currentPlayer.set(updatedGame.currentPlayer || "");

            console.log("Synced game state (Creator View):", updatedGame);
        });
    }

  
    async function joinGame() {
      const gameRef = doc(db, "games", joinGameId);
      const gameSnap = await getDoc(gameRef);
  
      if (gameSnap.exists()) {
        gameId = joinGameId;
        gameData = gameSnap.data();
  
        if (gameData.players.length < 4) {
          playerId = `player${gameData.players.length + 1}`;

          await updateDoc(gameRef, {
            players: arrayUnion(playerId),
            [`playerHands.${playerId}`]: [],
            [`playArea.${playerId}`]: []
          });

          console.log(`Joined game as ${playerId}`);
        } else {
          console.error("Game is full!");
        }
  
        onSnapshot(doc(db, "games", gameId), (snapshot) => {
            const updatedGame = snapshot.data();
            
            deck.set(updatedGame.deck);
            playArea.set(updatedGame.playArea);
            discardPile.set(updatedGame.discardPile);
            playerHands.set(updatedGame.playerHands);
            currentPlayer.set(updatedGame.currentPlayer || "");
            console.log("Synced updatedGame state (joined player):", updatedGame.currentPlayer);
        });
      } else {
        console.error("Game not found!");
      }
    }
  
    async function drawCard() {
        console.log("Drawing a card... validate:", "Game Over?:", gameOver);
        if ($gameOver) return;
        console.log("Drawing a card... validate:", "Can this player draw?:", "Id:", playerId, "Current Player Id:", $currentPlayer)
        if (!playerId || $currentPlayer !== playerId) return;

        let newDeck = [];
        let drawnCard = null;

        deck.update(d => {
            if (d.length > 0) {
                [drawnCard, ...newDeck] = d;
                return newDeck;
            }
            return d;
        });

        if (drawnCard) {
            playerHand.update(hand => [...hand, drawnCard]);
            const gameRef = doc(db, "games", gameId);
            await updateDoc(gameRef, {
                deck: newDeck,
                [`playerHands.${playerId}`]: $playerHand
            });
        }
    }
  
    async function playCard(index: number) {
        if ($gameOver || !playerId || $currentPlayer !== playerId) return; // Only active player can play

        playerHand.update(hand => {
            const card = hand[index];

            // 🔹 Ensure `playArea[playerId]` exists before updating it
            const updatedPlayArea = { ...$playArea };
            if (!updatedPlayArea[playerId]) {
                updatedPlayArea[playerId] = [];
            }
            updatedPlayArea[playerId] = [...updatedPlayArea[playerId], card];

            // 🔹 Update Firestore with the new play area and player's hand
            const gameRef = doc(db, "games", gameId);
            updateDoc(gameRef, {
                [`playArea.${playerId}`]: updatedPlayArea[playerId], // 🔹 Store in per-player play area
                [`playerHands.${playerId}`]: hand.filter((_, i) => i !== index) // Remove from hand
            });

            return hand.filter((_, i) => i !== index);
        });

        endTurn();  // 🔹 Switch turn after playing a card
    }


    async function discardCard(index: number) {
        if ($gameOver || !playerId || $currentPlayer !== playerId) return; // Only active player can discard

        playerHand.update(hand => {
            const card = hand[index];

            // 🔹 Ensure discard pile is always an array
            const updatedDiscardPile = [...$discardPile, card];

            // 🔹 Update Firestore
            const gameRef = doc(db, "games", gameId);
            updateDoc(gameRef, {
                discardPile: updatedDiscardPile,  // Store updated discard pile
                [`playerHands.${playerId}`]: hand.filter((_, i) => i !== index) // Remove from hand
            });

            return hand.filter((_, i) => i !== index);
        });

        endTurn();  // 🔹 Switch turn after discarding
    }


  
    async function endTurn() {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data();
      const playerIndex = gameData.players.indexOf($currentPlayer);
      const nextPlayer = gameData.players[(playerIndex + 1) % gameData.players.length];
  
      await updateDoc(gameRef, {
        currentPlayer: nextPlayer
      });
  
      console.log(`Turn switched to: ${nextPlayer}`);
    }
  </script>
  
  <main>
    <h1>Mille Bornes</h1>
  
    {#if !gameId}
      <button on:click={createGame}>Create Game</button>
      <p>Game ID: {gameId}</p>
      <input type="text" bind:value={joinGameId} placeholder="Enter Game ID" />
      <button on:click={joinGame}>Join Game</button>
    {/if}
  
    {#if gameId}
      <h2>Game ID: {gameId}</h2>
      <h2>Current Player: Player {$currentPlayer}</h2>
      <h2 class="turn-indicator">
        Current Turn: 
        <span class="active-player">{$currentPlayer.replace("player", "Player ")}</span>
      </h2>      
  
      <section>
        <h2>Draw Pile ({$deck.length} cards remaining)</h2>
        <button on:click={drawCard}>Draw a Card</button>
      </section>
  
      <section>
        <h2>Player Hand</h2>
        <div class="hand">
          {#each $playerHand as card, i}
            <div class="card-container">
              <Card card={card} />
              {#if $currentPlayer === playerId} <!-- 🔹 Only show buttons for the active player -->
                <button on:click={() => playCard(i)}>Play</button>
                <button on:click={() => discardCard(i)}>Discard</button> <!-- 🔹 Ensure discard is here -->
              {/if}
            </div>
          {/each}
        </div>
      </section>
      
  
      <section>
        <h2>Play Area</h2>
        <div class="players">
          {#each Object.keys($playerHands) as player}
            <div class="player-section {player === $currentPlayer ? 'active' : ''}">
              <h3>{player.replace("player", "Player ")}</h3>
              <div class="play-area">
                {#each $playArea[player] || [] as card}
                  <Card card={card} />
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>      
      
      <section>
        <h2>Discard Pile</h2>
        <div class="discard">
          {#if Array.isArray($discardPile) && $discardPile.length > 0}
            {console.log("Discard Pile:", $discardPile)}
            <div> 
              <Card card={$discardPile[$discardPile.length - 1]} />
            </div>
          {:else}
            <p>Empty</p>
          {/if}
        </div>
      </section>
      
      
    {/if}
  </main>

    <style lang="css">
        .hand, .play-area, .discard {
        display: flex;
        gap: 10px;
        }

        .card-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        }

        .turn-indicator {
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
        }
        
        .active-player {
        color: #ff5722; /* Highlight the active player's name */
        }
    
        .player-section {
        border: 2px solid transparent;
        padding: 10px;
        transition: border 0.3s ease;
        }
    
        .active {
        border: 2px solid #ff5722; /* Highlight active player's section */
        background-color: rgba(255, 87, 34, 0.1);
        }
    </style>