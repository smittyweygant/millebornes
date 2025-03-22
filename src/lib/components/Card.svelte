<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Card, CardEffect, CardType } from '../types/cardTypes';
    
    export let card: Card | null = null;
    export let mini: boolean = false;
    
    const dispatch = createEventDispatcher();
    
    $: cardClasses = `
      card
      ${mini ? 'mini' : ''}
      ${card?.type || ''}
    `;
    
    // Helper function to get the card icon based on effect
    function getCardIcon(type: CardType, effect: CardEffect | undefined): string {
      if (type === "distance") {
        return `${card?.value || 0}`;
      }
      
      switch(effect) {
        // Hazards
        case "accident": return '🚧';
        case "outOfGas": return '⛽';
        case "flatTire": return '🛞';
        case "speedLimit": return '🐢';
        case "stop": return '🛑';
        
        // Remedies
        case "repairs": return '🔧';
        case "gasoline": return '⛽';
        case "spareTire": return '🛞';
        case "endOfLimit": return '🚀';
        case "go": return '🟢';
        
        // Safety
        case "drivingAce": return '🏁';
        case "fuelTruck": return '🔋';
        case "punctureProof": return '🛡️';
        case "rightOfWay": return '⭐';
        
        default: return '❓';
      }
    }
    
    function getCardColor(type: CardType): string {
      switch(type) {
        case "hazard": return '#ff6b6b';
        case "remedy": return '#51cf66';
        case "safety": return '#339af0';
        case "distance": return '#fcc419';
        default: return '#adb5bd';
      }
    }

    function getCardName(type: CardType, effect: CardEffect | undefined): string {
      if (type === "distance") {
        return `${card?.value || 0} Miles`;
      }
      
      switch(effect) {
        // Hazards
        case "accident": return "Accident";
        case "outOfGas": return "Out of Gas";
        case "flatTire": return "Flat Tire";
        case "speedLimit": return "Speed Limit";
        case "stop": return "Stop";
        
        // Remedies
        case "repairs": return "Repairs";
        case "gasoline": return "Gasoline";
        case "spareTire": return "Spare Tire";
        case "endOfLimit": return "End of Limit";
        case "go": return "Roll";
        
        // Safety
        case "drivingAce": return "Driving Ace";
        case "fuelTruck": return "Extra Tank";
        case "punctureProof": return "Puncture-Proof";
        case "rightOfWay": return "Right of Way";
        
        default: return "Unknown";
      }
    }
  </script>
  
  <div 
    class={cardClasses}
    style={card ? `--card-color: ${getCardColor(card.type)};` : ''}
  >
    {#if card}
      <div class="card-inner">
        <div class="card-header">
          <span class="card-type">{getCardName(card.type, card.effect)}</span>
          <span class="card-icon">{getCardIcon(card.type, card.effect)}</span>
        </div>
        <div class="card-body">
          {#if card.type === "distance"}
            <div class="card-distance">{card.value}</div>
          {:else}
            <div class="card-description">{getCardName(card.type, card.effect)}</div>
          {/if}
        </div>
        <div class="card-footer">
          <span class="card-category">{card.type}</span>
        </div>
      </div>
    {:else}
      <div class="card-empty">
        <span>Empty</span>
      </div>
    {/if}
  </div>
  
  <style>
    .card {
      width: 140px;
      height: 200px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      background: white;
      position: relative;
      cursor: default;
      overflow: hidden;
      transition: all 0.2s ease;
      user-select: none;
    }
    
    .mini {
      width: 100px;
      height: 140px;
      font-size: 0.8em;
    }
    
    .card-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 10px;
      box-sizing: border-box;
      background: linear-gradient(to bottom right, white, #f1f3f5);
      border-top: 5px solid var(--card-color, #adb5bd);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .card-type {
      font-weight: bold;
      font-size: 1em;
    }
    
    .card-icon {
      font-size: 1.5em;
    }
    
    .card-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5px;
    }
    
    .card-distance {
      font-size: 3em;
      font-weight: bold;
      color: #495057;
    }
    
    .card-description {
      font-size: 0.9em;
      color: #495057;
    }
    
    .card-footer {
      display: flex;
      justify-content: flex-end;
      font-size: 0.8em;
      color: #868e96;
      margin-top: 10px;
    }
    
    .card-empty {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #adb5bd;
      font-style: italic;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
    }
    
    /* Card type colors */
    .hazard {
      --card-color: #ff6b6b;
    }
    
    .remedy {
      --card-color: #51cf66;
    }
    
    .safety {
      --card-color: #339af0;
    }
    
    .distance {
      --card-color: #fcc419;
    }
  </style>