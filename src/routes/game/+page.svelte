<script lang="ts">
    import { db } from "$lib/firebase";
    import { collection, addDoc, doc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
    import { deck, discardPile, gameOver, winner } from "$lib/gameStore"; 
    import { playerHand, playerHands, playArea, playerDistances, playerState, currentPlayer } from "$lib/gameStore"; 
    import { hazardRemedyPairs, safetyProtections, activeHazards, activeSafeties } from "$lib/gameStore";
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
            discardPile: [],  
            playerHands: { player1: [] },
            playArea: { player1: [] },
            playerState: { player1: "moving" },
            activeHazards: { player1: [] },
            activeSafeties: { player1: [] },
            currentPlayer: "player1",
            createdAt: new Date(),
        });

        gameId = gameRef.id;
        isHost = true;
        playerId = "player1";

        console.debug("Deck:", $deck)

        await updateDoc(doc(db, "games", gameId), {
            [`playerHands.player1`]: [],
            [`playArea.player1`]: [],
            [`playerState.player1`]: "moving",
            [`activeHazards.player1`]: [],
            [`activeSafeties.player1`]: []
        });

        onSnapshot(doc(db, "games", gameId), (snapshot) => {
            const updatedGame = snapshot.data();
            deck.set(updatedGame.deck);
            discardPile.set(updatedGame.discardPile);
            playerHands.set(updatedGame.playerHands);
            playArea.set(updatedGame.playArea);
            playerState.set(updatedGame.playerState || {});
            activeHazards.set(updatedGame.activeHazards || {});
            activeSafeties.set(updatedGame.activeSafeties || {});
            currentPlayer.set(updatedGame.currentPlayer || "");
        });
    }

    async function joinGame() {
        const gameRef = doc(db, "games", joinGameId);
        const gameSnap = await getDoc(gameRef);

        if (gameSnap.exists()) {
            gameId = joinGameId;
            gameData = gameSnap.data();

            if (gameData.players.length < 4) { // 🔹 Max 4 players
                playerId = `player${gameData.players.length + 1}`;

            await updateDoc(gameRef, {
                players: arrayUnion(playerId),
                [`playerHands.${playerId}`]: [],
                [`playArea.${playerId}`]: [],
                [`playerState.${playerId}`]: "moving",  // 🔹 Ensure new players have a status
                [`activeHazards.${playerId}`]: [],
                [`activeSafeties.${playerId}`]: []
            });

            console.log(`Joined game as ${playerId}`);
            } else {
            console.error("Game is full!");
            }

            // 🔹 Start Firestore listener
            onSnapshot(gameRef, (snapshot) => {
                const updatedGame = snapshot.data();
                deck.set(updatedGame.deck);
                discardPile.set(updatedGame.discardPile);
                playerHands.set(updatedGame.playerHands);
                playArea.set(updatedGame.playArea);
                playerState.set(updatedGame.playerState || {});
                activeHazards.set(updatedGame.activeHazards || {});
                activeSafeties.set(updatedGame.activeSafeties || {});
                currentPlayer.set(updatedGame.currentPlayer || "");
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
        console.log("Attempting to play card:", index);
        if ($gameOver || !playerId || $currentPlayer !== playerId) return;
        let turnShouldEnd = true;

        playerHand.update(hand => {
            const card = hand[index];
            console.log(`Card played: ${card.type}, Card value: ${card.value}, Card Effect: ${card.effect}`);

            // Identify targetPlayer for hazard cards
            const allPlayers = Object.keys($playerHands);
            const targetPlayer = allPlayers.find(p => p !== playerId) || null;

            // Handle Distance Cards
            if (card.type === "distance") {
                if ($playerState[playerId] !== "moving" ) {
                    console.error("Cannot play Distance card while blocked!");
                    turnShouldEnd = false;
                    return hand;
                }
                const updatedPlayArea = { ...$playArea };
                updatedPlayArea[playerId] = [...(updatedPlayArea[playerId] || []), card];
                updateDoc(doc(db, "games", gameId), {
                    [`playArea.${playerId}`]: updatedPlayArea[playerId],
                    [`playerHands.${playerId}`]: hand.filter((_, i) => i !== index)
                });
                return hand.filter((_, i) => i !== index);
            }

            // Handle Hazard Cards
            if (card.type === "hazard" && targetPlayer) {
                const protection = safetyProtections[card.effect];
                console.log("Target Player:", targetPlayer);
                if ($activeSafeties[targetPlayer]?.includes(protection)) {
                    console.error(`${targetPlayer} is protected from ${card.effect} by ${protection}`);
                    turnShouldEnd = false;
                    return hand;
                }
                activeHazards.update(hazards => {
                    hazards[targetPlayer] = [...(hazards[targetPlayer] || []), card.effect];
                    updateDoc(doc(db, "games", gameId), {
                        [`activeHazards.${targetPlayer}`]: hazards[targetPlayer],
                        [`playerState.${targetPlayer}`]: "blocked!" 
                    });
                    console.log(`${targetPlayer} has been blocked by ${card.effect}`);
                    return hazards;
                });
            }

            // Handle Remedy Cards
            if (card.type === "remedy" ) {
                console.log(`${card.type} card played:`, "Effect:", card.effect );
                const hazardToRemove = Object.keys(hazardRemedyPairs).find(hazard => hazardRemedyPairs[hazard] === card.effect);
                console.log("Hazard Matched to Remove:", hazardToRemove )
                if ($activeHazards[playerId]?.includes(hazardToRemove)) {
                    activeHazards.update(hazards => {
                        hazards[playerId] = hazards[playerId].filter(h => h !== hazardToRemove);
                        playerState.update(state => ({ ...state, [playerId]: "moving" }));
                        updateDoc(doc(db, "games", gameId), {
                            [`activeHazards.${playerId}`]: hazards[playerId],
                            [`playerState.${playerId}`]: "moving" 
                        });
                        console.log(`${playerId} applied remedy: ${card.effect}`);
                        return hazards;
                    });

                } else {
                    console.log("This remedy does not match the current hazard.");
                    turnShouldEnd = false;
                    return hand;
                }
            }

            // Handle Safety Cards
            if (card.type === "safety") {
                console.log(`Safety card played: ${card.type} : ${card.effect}`);
                activeSafeties.update(safeties => {
                    safeties[playerId] = [...(safeties[playerId] || []), card.effect];
                    updateDoc(doc(db, "games", gameId), {
                        [`activeSafeties.${playerId}`]: safeties[playerId]
                    });
                    return safeties;    
                });
                // Check if a matching hazard exists, and remove it
                const protections = $activeSafeties[playerId];
                console.log("Current Safeties after playing card:", protections)
                // Enumerate hazards, check if the new safety protects against it
                // check the array of active hazards, if != <>
                // check hazard mapping to protection 
                // const hazardToRemove = Object.keys(hazardRemedyPairs).find(hazard => hazardRemedyPairs[hazard] === card.effect);
                //     if ($activeHazards[targetPlayer]?.includes(protection)) {
                //         console.error(`${targetPlayer} is now protected from ${card.effect} by ${protection}`);
                //         turnShouldEnd = false;
                //         return hand;
                //     }
                    
            }
            return hand.filter((_, i) => i !== index);
        });

        if (turnShouldEnd) {
            endTurn();
        }
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
      console.log(`Turn switched to:, ${nextPlayer}`);
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
        Current Turn: <span class="active-player">{$currentPlayer.replace("player", "Player ")}</span>
      </h2>
      
      <!-- 🔹 Player Status Section -->
      <section class="player-status">
        <h2>Player Status</h2>
        {#each Object.keys($playerState) as player}
          <div class="player-section">
            <h3>{player.replace("player", "Player ")}</h3>
            <p>Status: <span class="status-badge {$playerState[player]}">{$playerState[player]}</span></p>
          </div>
        {/each}
      </section>
      
      <section>
        <h2>Play Area</h2>
        <div class="players">
            {#each Object.keys($playerHands) as player}
                <div class="player-section {player === $currentPlayer ? 'active' : ''}">
                    <h3>{player.replace("player", "Player ")}</h3>

                    <!-- 🔹 New Safety Protections Section -->
                    {#if $activeSafeties[player] && $activeSafeties[player].length > 0}
                        <section class="safety-protections">
                            <h4>Safety Protections</h4>
                            <div class="safety-cards">
                                {#each $activeSafeties[player] as safety}
                                    <Card card={{ type: "safety", effect: safety }} />
                                {/each}
                            </div>
                        </section>
                    {/if}
                    {#if $activeHazards[player] && $activeHazards[player].length > 0}
                    <section class="hazards">
                        <h4>Hazards!</h4>
                        <div class="hazard-cards">
                            {#each $activeHazards[player] as hazard}
                                <Card card={{ effect: hazard }} />
                            {/each}
                        </div>
                    </section>
                    {/if}
                    {#if $playArea[player] && $playArea[player].length > 0}
                        <section class="play-area">
                            <h4>Distance</h4>
                            <div class="play-area">
                                {#each $playArea[player] || [] as card}
                                    <Card card={card} />
                                {/each}
                            </div>
                        </section>
                    {/if}
                </div>
            {/each}
        </div>
        </section>
    
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
        .hand, .play-area, .safety-protections, .hazards, .discard {
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

        .status-badge {
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 5px;
        }
        .status-badge.moving { color: green; }
        .status-badge.stopped { color: red; }
        .status-badge.protected { color: blue; }
    
    </style>