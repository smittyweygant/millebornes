<script lang="ts">
    import { getContext } from 'svelte';
    import { gameStore } from '$lib/stores/gameStore';
    
    export let playerId: string;
    
    const gameService = getContext('gameService');
    
    $: game = $gameStore;
    $: isCurrentPlayer = game?.currentPlayerId === playerId;
    $: gameStatus = game?.status || 'waiting';
    $: playerCount = game?.players?.length || 0;
    $: canStartGame = gameStatus === 'waiting' && playerCount >= 2 && playerCount <= 4;
    $: winner = game?.winner;
    
    const startGame = () => {
      gameService.startGame();
    };
    
    const endTurn = () => {
      if (isCurrentPlayer) {
        gameService.endTurn(playerId);
      }
    };
    
    const resetGame = () => {
      gameService.resetGame();
    };
  </script>
  
  <div class="game-controls">
    {#if gameStatus === 'waiting'}
      <div class="waiting-message">
        <h3>Waiting for players ({playerCount}/4)</h3>
        <p>Share game ID with friends to join: <strong>{game?.id}</strong></p>
        
        {#if canStartGame}
          <button class="start-btn" on:click={startGame}>Start Game</button>
        {:else}
          <p class="info">Need at least 2 players to start</p>
        {/if}
      </div>
    {:else if gameStatus === 'finished'}
      <div class="game-over">
        <h3>Game Over!</h3>
        {#if winner}
          <p class="winner">{winner.name} won the game!</p>
        {/if}
        <button class="reset-btn" on:click={resetGame}>Play Again</button>
      </div>
    {:else if gameStatus === 'active'}
      <div class="turn-controls">
        <button 
          class="end-turn-btn" 
          on:click={endTurn}
          disabled={!isCurrentPlayer}
        >
          End Turn
        </button>
        
        {#if isCurrentPlayer}
          <p class="your-turn">Your turn</p>
        {:else}
          <p class="waiting-turn">Waiting for {game?.players.find(p => p.id === game?.currentPlayerId)?.name || 'opponent'}</p>
        {/if}
      </div>
    {/if}
  </div>
  
  <style>
    .game-controls {
      margin: 1rem 0;
      padding: 1rem;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
  
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
  
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  
    .start-btn {
      background-color: #52c41a;
      color: white;
    }
  
    .start-btn:hover:not(:disabled) {
      background-color: #389e0d;
    }
  
    .end-turn-btn {
      background-color: #1890ff;
      color: white;
    }
  
    .end-turn-btn:hover:not(:disabled) {
      background-color: #096dd9;
    }
  
    .reset-btn {
      background-color: #faad14;
      color: white;
    }
  
    .reset-btn:hover:not(:disabled) {
      background-color: #d48806;
    }
  
    .waiting-message, .game-over, .turn-controls {
      text-align: center;
    }
  
    .info {
      color: #8c8c8c;
    }
  
    .winner {
      font-size: 1.2rem;
      font-weight: bold;
      color: #52c41a;
      margin-bottom: 1rem;
    }
  
    .your-turn {
      color: #1890ff;
      font-weight: 500;
      margin-top: 0.5rem;
    }
  
    .waiting-turn {
      color: #8c8c8c;
      margin-top: 0.5rem;
    }
  </style>