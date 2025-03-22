<script lang="ts">
    import { getContext, onMount, setContext } from 'svelte';
    import { gameStore } from '$lib/stores/gameStore';
    import type { GameState } from '$lib/types/gameTypes';
    import PlayerArea from './PlayerArea.svelte';
    import Card from './Card.svelte';
    import { GameService } from '$lib/services/gameService';
    import { FirebaseService } from '$lib/services/firebaseService';
  
    export let gameId: string;
    export let playerId: string;
  
    let isLoading = true;
    let error: string | null = null;
    
    // Initialize services
    const firebaseService = new FirebaseService();
    const gameService = new GameService(firebaseService, gameId, playerId);
    
    // Make game service available to child components
    setContext('gameService', gameService);
  
    onMount(async () => {
      try {
        // Initialize game state
        await gameService.initGame();
        isLoading = false;
      } catch (err) {
        error = `Failed to load game: ${err.message}`;
        isLoading = false;
      }
    });
  
    $: game = $gameStore;
    $: currentPlayerId = game?.currentPlayerId;
    $: isCurrentPlayer = playerId === currentPlayerId;
    $: opponents = game?.players.filter(p => p.id !== playerId) || [];
    $: discardPile = game?.discardPile || [];
    $: drawPileCount = game?.drawPile?.length || 0;
    
    const drawCard = () => {
      if (isCurrentPlayer) {
        gameService.drawCard(playerId);
      }
    };
    
    const discardCard = (cardIndex: number) => {
      if (isCurrentPlayer) {
        gameService.discardCard(playerId, cardIndex);
      }
    };
  </script>
  
  {#if isLoading}
    <div class="loading">Loading game...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="game-board">
      <div class="game-info">
        <h2>Mille Bornes</h2>
        <div class="game-status">
          <span>Game ID: {gameId}</span>
          <span>Current Player: {game?.players.find(p => p.id === currentPlayerId)?.name || 'Unknown'}</span>
        </div>
      </div>
      
      <div class="opponents">
        {#each opponents as opponent}
          <PlayerArea 
            playerId={opponent.id}
            isOpponent={true}
            isCurrentPlayer={opponent.id === currentPlayerId}
          />
        {/each}
      </div>
      
      <div class="central-area">
        <div class="pile draw-pile" on:click={drawCard}>
          <h3>Draw Pile</h3>
          {#if drawPileCount > 0}
            <div class="card-back">
              <span>{drawPileCount}</span>
            </div>
          {:else}
            <div class="empty-pile">Empty</div>
          {/if}
        </div>
        
        <div class="pile discard-pile">
          <h3>Discard Pile</h3>
          {#if discardPile.length > 0}
            <Card card={discardPile[discardPile.length - 1]} />
          {:else}
            <div class="empty-pile">Empty</div>
          {/if}
        </div>
      </div>
      
      <div class="player-section">
        <PlayerArea 
          playerId={playerId}
          isCurrentPlayer={isCurrentPlayer}
        />
      </div>
    </div>
  {/if}
  
  <style>
    .game-board {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
  
    .loading, .error {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
    }
  
    .error {
      color: #ff4d4f;
    }
  
    .game-info {
      margin-bottom: 1.5rem;
      text-align: center;
    }
  
    .game-status {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #666;
    }
  
    .opponents {
      margin-bottom: 1.5rem;
    }
  
    .central-area {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }
  
    .pile {
      width: 180px;
      text-align: center;
    }
  
    .pile h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
  
    .card-back {
      background-color: #1890ff;
      color: white;
      height: 160px;
      width: 120px;
      margin: 0 auto;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    }
  
    .card-back:hover {
      transform: scale(1.05);
    }
  
    .empty-pile {
      height: 160px;
      width: 120px;
      margin: 0 auto;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  
    .player-section {
      margin-top: 2rem;
    }
  </style>