<script lang="ts">
    import { onMount } from 'svelte';
    import App from '$lib/components/App.svelte';
    import GameRules from '$lib/components/GameRules.svelte';
    
    let showRules = false;
    
    const toggleRules = () => {
      showRules = !showRules;
    };
    
    const closeRules = () => {
      showRules = false;
    };
  </script>
  
  <svelte:head>
    <title>Mille Bornes Card Game</title>
    <meta name="description" content="Play the classic French card game Mille Bornes online with friends." />
  </svelte:head>
  
  <div class="page-container">
    <header>
      <h1>Mille Bornes</h1>
      <button class="rules-btn" on:click={toggleRules}>Game Rules</button>
    </header>
    
    <main>
      <App />
    </main>
    
    <footer>
      <p>&copy; {new Date().getFullYear()} Mille Bornes Online. All rights reserved.</p>
    </footer>
    
    <GameRules isOpen={showRules} on:close={closeRules} />
  </div>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f0f2f5;
      color: #333;
    }
  
    .page-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: #1890ff;
      color: white;
    }
  
    header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
  
    .rules-btn {
      background-color: white;
      color: #1890ff;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
  
    .rules-btn:hover {
      background-color: #f0f0f0;
    }
  
    main {
      flex: 1;
      padding: 2rem;
    }
  
    footer {
      padding: 1rem;
      text-align: center;
      color: #8c8c8c;
      background-color: white;
      border-top: 1px solid #f0f0f0;
    }
  </style>