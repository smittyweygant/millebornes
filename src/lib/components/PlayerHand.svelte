<script lang="ts">
    import type { Card as CardType } from '../types/cardTypes';
    import CardComponent from './Card.svelte';
    
    export let cards: CardType[] = [];
    export let onPlayCard: (card: CardType) => void;
    export let getDropZone: (card: CardType) => string | null;
    
    function playCard(index: number) {
      const card = cards[index];
      if (card) {
        onPlayCard(card);
      }
    }
  </script>
  
  <section class="player-hand">
    <h2>Your Hand</h2>
    
    {#if cards.length === 0}
      <p class="empty-hand">No cards in hand. Draw a card on your turn.</p>
    {:else}
      <div class="hand-container">
        {#each cards as card, i}
          <div class="card-container">
            <CardComponent {card} />
            <div class="card-actions">
              {#if getDropZone(card) !== null}
                <button 
                  class="action-button play-button" 
                  on:click={() => playCard(i)}
                >
                  Play
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
  
  <style>
    .player-hand {
      margin: 20px 0;
    }
    
    .hand-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 10px;
    }
    
    .card-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .card-actions {
      display: flex;
      gap: 5px;
      margin-top: 5px;
    }
    
    .action-button {
      padding: 3px 8px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid #333;
    }
    
    .play-button {
      background-color: #4caf50;
      color: white;
    }
    
    .empty-hand {
      font-style: italic;
      color: #666;
    }
  </style>