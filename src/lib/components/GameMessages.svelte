<script lang="ts">
    import { gameStore } from '$lib/stores/gameStore';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
  
    export let maxMessages = 5;
    
    let messages: {text: string, timestamp: number}[] = [];
    
    // Subscribe to game messages
    onMount(() => {
      const unsubscribe = gameStore.subscribe(game => {
        if (game && game.messages && game.messages.length > 0) {
          // Get new messages
          const newMessages = [...game.messages].reverse().slice(0, maxMessages);
          
          // Update messages
          messages = newMessages;
        }
      });
      
      return unsubscribe;
    });
    
    // Format timestamp
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
  </script>
  
  <div class="messages-container">
    <h3>Game Messages</h3>
    
    <div class="messages-list">
      {#if messages.length === 0}
        <div class="empty-message">No messages yet</div>
      {:else}
        {#each messages as message, i (message.timestamp)}
          <div class="message" transition:fade={{ duration: 200 }}>
            <span class="time">{formatTime(message.timestamp)}</span>
            <span class="text">{message.text}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
  
  <style>
    .messages-container {
      margin-top: 1rem;
      padding: 1rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
  
    h3 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 1rem;
      color: #333;
    }
  
    .messages-list {
      max-height: 200px;
      overflow-y: auto;
    }
  
    .message {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }
  
    .message:last-child {
      border-bottom: none;
    }
  
    .time {
      font-size: 0.8rem;
      color: #8c8c8c;
      margin-right: 0.5rem;
    }
  
    .text {
      font-size: 0.9rem;
    }
  
    .empty-message {
      color: #8c8c8c;
      font-style: italic;
      padding: 1rem 0;
      text-align: center;
    }
  </style>