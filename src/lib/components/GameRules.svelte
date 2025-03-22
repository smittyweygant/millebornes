<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let isOpen = false;
    
    const closeRules = () => {
      dispatch('close');
    };
  </script>
  
  {#if isOpen}
    <div class="rules-overlay">
      <div class="rules-modal">
        <div class="rules-header">
          <h2>Mille Bornes Rules</h2>
          <button class="close-btn" on:click={closeRules}>×</button>
        </div>
        
        <div class="rules-content">
          <h3>Overview</h3>
          <p>Mille Bornes is a French card game about automobile racing. The goal is to be the first player to complete 1000 miles (1000 bornes).</p>
          
          <h3>Cards</h3>
          <ul>
            <li><strong>Distance Cards:</strong> 25, 50, 75, 100, and 200 miles</li>
            <li><strong>Hazard Cards:</strong> Out of Gas, Flat Tire, Accident, Speed Limit, Stop</li>
            <li><strong>Remedy Cards:</strong> Gasoline, Spare Tire, Repairs, End of Limit, Roll</li>
            <li><strong>Safety Cards:</strong> Extra Tank, Puncture-proof, Driving Ace, Right of Way</li>
          </ul>
          
          <h3>Setup</h3>
          <p>Each player starts with 6 cards. The remaining cards form the draw pile.</p>
          
          <h3>Gameplay</h3>
          <ol>
            <li>On your turn, draw a card from the draw pile.</li>
            <li>Then, you may play one card from your hand or discard a card.</li>
            <li>End your turn.</li>
          </ol>
          
          <h3>Playing Cards</h3>
          <ul>
            <li>Distance cards are played in front of you to advance toward 1000 miles.</li>
            <li>You can only play distance cards when you have no hazards affecting you.</li>
            <li>Hazard cards are played on opponents to slow them down.</li>
            <li>Remedy cards are played to cancel your own hazards.</li>
            <li>Safety cards protect you from specific hazards for the rest of the game.</li>
          </ul>
          
          <h3>Winning</h3>
          <p>The first player to reach exactly 1000 miles wins the game.</p>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    .rules-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    .rules-modal {
      background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  
    .rules-header {
      padding: 1rem;
      background-color: #f0f0f0;
      border-bottom: 1px solid #d9d9d9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  
    .rules-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
  
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }
  
    .rules-content {
      padding: 1rem;
      overflow-y: auto;
    }
  
    h3 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #1890ff;
    }
  
    p, ul, ol {
      margin-bottom: 1rem;
    }
  
    ul, ol {
      padding-left: 1.5rem;
    }
  
    li {
      margin-bottom: 0.5rem;
    }
  </style>