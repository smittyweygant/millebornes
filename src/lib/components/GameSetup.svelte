<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import FirebaseService from '$lib/services/firebaseService';
    import GameService from '$lib/services/gameService';
    
    const dispatch = createEventDispatcher();
    
    let playerName = '';
    let gameId = '';
    let isCreatingGame = false;
    let isJoiningGame = false;
    let error: string | null = null;
    
    const firebaseService = new FirebaseService();
    
    const createNewGame = async () => {
      if (!playerName) {
        error = 'Please enter your name';
        return;
      }
      
      isCreatingGame = true;
      error = null;
      
      try {
        // Create a new game
        const newGameId = await firebaseService.createGame(playerName);
        
        // Notify parent component
        dispatch('gameSetup', {
          gameId: newGameId,
          playerId: firebaseService.getCurrentUserId(),
          playerName
        });
      } catch (err) {
        error = `Failed to create game: ${err.message}`;
        isCreatingGame = false;
      }
    };
    
    const joinGame = async () => {
      if (!playerName || !gameId) {
        error = 'Please enter your name and game ID';
        return;
      }
      
      isJoiningGame = true;
      error = null;
      
      try {
        // Join existing game
        await firebaseService.joinGame(gameId, playerName);
        
        // Notify parent component
        dispatch('gameSetup', {
          gameId,
          playerId: firebaseService.getCurrentUserId(),
          playerName
        });
      } catch (err) {
        error = `Failed to join game: ${err.message}`;
        isJoiningGame = false;
      }
    };
  </script>
  
  <div class="setup-container">
    <h1>Mille Bornes</h1>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}
    
    <div class="form-group">
      <label for="playerName">Your Name</label>
      <input 
        type="text" 
        id="playerName" 
        bind:value={playerName} 
        placeholder="Enter your name"
        disabled={isCreatingGame || isJoiningGame}
      />
    </div>
    
    <div class="buttons">
      <button 
        on:click={createNewGame} 
        disabled={isCreatingGame || isJoiningGame || !playerName}
        class="create-btn"
      >
        {isCreatingGame ? 'Creating...' : 'Create New Game'}
      </button>
      
      <div class="divider">or</div>
    </div>
    
    <div class="join-section">
      <div class="form-group">
        <label for="gameId">Game ID</label>
        <input 
          type="text" 
          id="gameId" 
          bind:value={gameId} 
          placeholder="Enter game ID"
          disabled={isCreatingGame || isJoiningGame}
        />
      </div>
      
      <button 
        on:click={joinGame} 
        disabled={isCreatingGame || isJoiningGame || !playerName || !gameId}
        class="join-btn"
      >
        {isJoiningGame ? 'Joining...' : 'Join Game'}
      </button>
    </div>
  </div>
  
  <style>
    .setup-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #1890ff;
    }
  
    .error {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      padding: 0.75rem;
      border-radius: 4px;
      color: #ff4d4f;
      margin-bottom: 1.5rem;
    }
  
    .form-group {
      margin-bottom: 1.5rem;
    }
  
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
  
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 1rem;
    }
  
    input:focus {
      border-color: #1890ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  
    .buttons {
      margin-bottom: 1.5rem;
    }
  
    button {
      width: 100%;
      padding: 0.75rem;
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
  
    .create-btn {
      background-color: #1890ff;
      color: #fff;
    }
  
    .create-btn:hover:not(:disabled) {
      background-color: #096dd9;
    }
  
    .join-btn {
      background-color: #52c41a;
      color: #fff;
    }
  
    .join-btn:hover:not(:disabled) {
      background-color: #389e0d;
    }
  
    .divider {
      text-align: center;
      margin: 1rem 0;
      position: relative;
    }
  
    .divider::before, .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 45%;
      height: 1px;
      background-color: #d9d9d9;
    }
  
    .divider::before {
      left: 0;
    }
  
    .divider::after {
      right: 0;
    }
  </style>