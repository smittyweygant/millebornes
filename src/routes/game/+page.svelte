<script lang="ts">
    import Card from "$lib/Card.svelte";
    import { deck, playerHand, discardPile, playArea, currentPlayer, playerDistances, playerStatus, gameOver, winner, shuffle, createShuffledDeck } from "$lib/gameStore";
  import { decl } from "postcss";
  
    function drawCard() {
        if ($gameOver) return;

        // Debugging: Check deck and discard pile before reshuffling
        console.log("Before draw - Deck:", $deck.length, "Discard:", $discardPile.length);

        if ($deck.length === 0 && $discardPile.length > 0) {
                console.log("Deck is empty, reshuffling from discard pile...");
                const newDeck = shuffle($discardPile);
                deck.set(newDeck);
                discardPile.set([]);
                console.log("After reshuffle - newDeck:", newDeck.length, "deck:", $deck.length, "Discard:", $discardPile.length);
        }

        deck.update(d => {
            if (d.length > 0) {
                const [drawnCard, ...remainingDeck] = d;
                playerHand.update(hand => [...hand, drawnCard]);
                console.log("Card drawn:", drawnCard, "New deck size:", remainingDeck.length);
                return remainingDeck;
            }

            return d;
        });
        console.log("Final deck size after draw:", $deck.length);
    }
  
    function discardCard(index: number) {
      if ($gameOver) return; // Stop actions if game is over
  
      playerHand.update(hand => {
        const card = hand[index];
        discardPile.update(pile => [...pile, card]);
        return hand.filter((_, i) => i !== index);
      });
    }
  
    function playCard(index: number) {
      if ($gameOver) return;
  
      playerHand.update(hand => {
        const card = hand[index];
        let legalMove = false;
  
        playerDistances.update(distances => {
          if (card.type === "Distance" && distances[$currentPlayer] < 1000 && $playerStatus[$currentPlayer] === "OK") {
            distances[$currentPlayer] += card.value;
            legalMove = true;
            if (distances[$currentPlayer] >= 1000) {
              gameOver.set(true);
              winner.set($currentPlayer);
            }
          }
          return distances;
        });
  
        playerStatus.update(status => {
          if (card.type === "Hazard") {
            status[$currentPlayer === 1 ? 2 : 1] = "Stopped";
            legalMove = true;
          }
          if (card.type === "Remedy" && $playerStatus[$currentPlayer] === "Stopped") {
            status[$currentPlayer] = "OK";
            legalMove = true;
          }
          return status;
        });
  
        if (legalMove) {
          playArea.update(area => [...area, card]);
          return hand.filter((_, i) => i !== index);
        }
  
        return hand;
      });
  
      if (!$gameOver) {
        endTurn();
      }
    }
  
    function endTurn() {
      currentPlayer.update(player => (player === 1 ? 2 : 1));
    }
  
    function resetGame() {
      gameOver.set(false);
      winner.set(null);
      playerDistances.set({ 1: 0, 2: 0 });
      playerStatus.set({ 1: "OK", 2: "OK" });
      deck.set(createShuffledDeck());
      playerHand.set([]);
      discardPile.set([]);
      playArea.set([]);
      currentPlayer.set(1);
    }
  </script>

<script lang="ts">
    import { db } from "$lib/firebase";
    import { collection, addDoc } from "firebase/firestore";
  
    let gameId = "";
  
    async function createGame() {
      const gameRef = await addDoc(collection(db, "games"), {
        players: [],
        deck: [],
        playArea: [],
        discardPile: [],
        currentPlayer: 1,
        createdAt: new Date(),
      });
  
      gameId = gameRef.id;
      console.log("Game created with ID:", gameId);
    }
  </script>
  
  <button on:click={createGame}>Create Game</button>
  <p>Game ID: {gameId}</p>
  
  <script lang="ts">
    import { doc, getDoc } from "firebase/firestore";
  
    let joinGameId = "";
    let gameData = null;
  
    async function joinGame() {
      const gameRef = doc(db, "games", joinGameId);
      const gameSnap = await getDoc(gameRef);
  
      if (gameSnap.exists()) {
        gameData = gameSnap.data();
        console.log("Joined game:", gameData);
      } else {
        console.error("Game not found!");
      }
    }
  </script>
  
  <input type="text" bind:value={joinGameId} placeholder="Enter Game ID" />
  <button on:click={joinGame}>Join Game</button>
  
  
  <main>
    <h1>Mille Bornes</h1>
  
    {#if $gameOver}
      <h2>🎉 Player {$winner} Wins! 🎉</h2>
      <button on:click={resetGame}>Restart Game</button>
    {:else}
      <h2>Current Player: Player {$currentPlayer} (Status: {$playerStatus[$currentPlayer]})</h2>
      <h3>Distance: {$playerDistances[1]} km | {$playerDistances[2]} km</h3>
  
      <section>
        <h2>Draw Pile ({$deck.length} cards remaining)</h2>
        <button on:click={drawCard}>Draw a Card</button>
      </section>
  
      <section>
        <h2>Player Hand</h2>
        <div class="hand">
          {#each $playerHand as card, i}
            <div class="card-container">
              <Card {card} />
              <button on:click={() => playCard(i)}>Play</button>
              <button on:click={() => discardCard(i)}>Discard</button>
            </div>
          {/each}
        </div>
      </section>
  
      <section>
        <h2>Play Area</h2>
        <div class="play-area">
          {#each $playArea as card}
            <Card {card} />
          {/each}
        </div>
      </section>
  
      <section>
        <h2>Discard Pile</h2>
        <div class="discard">
          {#each $discardPile as card}
            <Card {card} />
          {/each}
        </div>
      </section>
    {/if}
  </main>
  
  <style>
    .hand, .play-area, .discard {
      display: flex;
      gap: 10px;
    }
    .card-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  </style>
  