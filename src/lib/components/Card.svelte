<script lang="ts">
    import { CardType, CardCategory, type Card, type CardEffect } from '../types/cardTypes';
    
    export let card: Card | null = null;
    export let mini: boolean = false;
    
    $: cardClasses = `
      card
      ${mini ? 'mini' : ''}
      ${card?.type || ''}
    `;
    
    // Helper function to get the card icon based on effect
    function getCardIcon(category: CardCategory, type: CardType): string {
      if (category === "distance") {
        return `${card?.value || 0}`;
      }
      
      switch(type) {
        // Hazards
        case CardType.ACCIDENT: return '🚧';
        case CardType.OUT_OF_GAS: return '⛽';
        case CardType.FLAT_TIRE: return '🛞';
        case CardType.SPEED_LIMIT: return '🐢';
        case CardType.STOP: return '🛑';
        
        // Remedies
        case CardType.REPAIRS: return '🔧';
        case CardType.GASOLINE: return '⛽';
        case CardType.SPARE_TIRE: return '🛞';
        case CardType.END_OF_LIMIT: return '🚀';
        case CardType.ROLL: return '🟢';
        
        // Safety
        case CardType.DRIVING_ACE: return '🏁';
        case CardType.FUEL_TANK: return '🔋';
        case CardType.PUNCTURE_PROOF: return '🛡️';
        case CardType.RIGHT_OF_WAY: return '⭐';
        
        default: return '❓';
      }
    }
    
    function getCardColor(category: CardCategory, type: CardType): string {
      switch(category) {
        case CardCategory.HAZARD: return '#ff6b6b';
        case CardCategory.REMEDY: return '#51cf66';
        case CardCategory.SAFETY: return '#339af0';
        case CardCategory.DISTANCE: return '#fcc419';
        default: return '#adb5bd';
      }
    }

    function getCardName(category: CardCategory, cardType: CardType): string {
      if (category === "distance") {
        return `${card?.value || 0} Miles`;
      }
      
      switch(cardType) {
        // Hazards
        case CardType.ACCIDENT: return "Accident";
        case CardType.OUT_OF_GAS: return "Out of Gas";
        case CardType.FLAT_TIRE: return "Flat Tire";
        case CardType.SPEED_LIMIT: return "Speed Limit";
        case CardType.STOP: return "Stop";
        
        // Remedies
        case CardType.REPAIRS: return "Repairs";
        case CardType.GASOLINE: return "Gasoline";
        case CardType.SPARE_TIRE: return "Spare Tire";
        case CardType.END_OF_LIMIT: return "End of Limit";
        case CardType.ROLL: return "Roll";
        
        // Safety
        case CardType.DRIVING_ACE: return "Driving Ace";
        case CardType.FUEL_TANK: return "Extra Tank";
        case CardType.PUNCTURE_PROOF: return "Puncture-Proof";
        case CardType.RIGHT_OF_WAY: return "Right of Way";
        
        default: return "Unknown";
      }
    }
  </script>
  
  <div 
    class={cardClasses}
    style={card ? `--card-color: ${getCardColor(card.category, card.type)};` : ''}
  >
    {#if card}
      <div class="card-inner">
        <div class="card-header">
          <span class="card-type">{card.category}</span>
          <span class="card-icon">{getCardIcon(card.category, card.type)}</span>
        </div>
        <div class="card-body">
          {#if card.category === "distance"}
            <div class="card-distance">{card.value}</div>
          {:else}
            <div class="card-description">{getCardName(card.category, card.type)}</div>
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