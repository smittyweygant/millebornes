<script lang="ts">
    import { getContext } from 'svelte';
    import type { GameState } from '$lib/types/gameTypes';
    import type { Card as CardType } from '$lib/types/cardTypes';
    import PlayerHand from './PlayerHand.svelte';
    import Card from './Card.svelte';
    import { gameStore } from '$lib/stores/gameStore';
  
    export let playerId: string;
    export let isCurrentPlayer: boolean = false;
    export let isOpponent: boolean = false;
  
    // Get the game service from context
    const gameService: any = getContext('gameService');
  
    // Derived state from consolidated gameStore
    $: playerHand = $gameStore.playerHands[playerId] || [];
    $: battlePile = $gameStore.activeHazards[playerId] || [];
    $: speedPile = $gameStore.playArea[playerId]?.filter(card => card.type === 'hazard' && card.effect === 'speedLimit') || [];
    $: distancePile = $gameStore.playArea[playerId]?.filter(card => card.type === 'distance') || [];
    $: safetyPile = $gameStore.activeSafeties[playerId] || [];
    $: distance = distancePile.reduce((total, card) => total + (card.value || 0), 0);

    $: hasOutOfGas = battlePile.includes('outOfGas');
    $: hasFlatTire = battlePile.includes('flatTire');
    $: hasAccident = battlePile.includes('accident');
    $: hasSpeedLimit = speedPile.length > 0;
    $: hasStopSign = battlePile.includes('stop');
    $: canMove = !hasOutOfGas && !hasFlatTire && !hasAccident && !hasStopSign;
    $: maxSpeed = hasSpeedLimit ? 50 : 200;
  
    // Play a card from hand
    const playCard = (card: CardType) => {
      if (isCurrentPlayer && gameService) {
        gameService.playCard(playerId, card);
      }
    };
  
    // Area to display when cards can be played
    const getDropZone = (card: CardType) => {
      if (card.type === 'remedy') {
        return 'battle';
      } else if (card.type === 'hazard') {
        return isOpponent ? 'battle' : null;
      } else if (card.type === 'distance') {
        return canMove ? 'distance' : null;
      } else if (card.type === 'safety') {
        return 'safety';
      }
      return null;
    };
  </script>
  
  <div class="player-area" class:current-player={isCurrentPlayer} class:opponent={isOpponent}>
    <div class="player-info">
      <h3>Player {playerId}</h3>
      <div class="distance-counter">
        <span>{distance} / 1000 miles</span>
        <div class="progress-bar">
          <div class="progress" style="width: {(distance / 1000) * 100}%"></div>
        </div>
      </div>
    </div>
  
    <div class="play-area">
      <div class="pile battle-pile">
        <h4>Battle Pile</h4>
        {#if battlePile.length > 0}
          {#each battlePile as hazard}
            <Card card={{ type: 'hazard', effect: hazard }} />
          {/each}
        {:else}
          <div class="empty-pile">No hazards</div>
        {/if}
      </div>
  
      <div class="pile speed-pile">
        <h4>Speed Pile</h4>
        {#if speedPile.length > 0}
          <Card card={speedPile[speedPile.length - 1]} />
        {:else}
          <div class="empty-pile">No speed cards</div>
        {/if}
        {#if canMove}
          <div class="speed-indicator">
            <span>Max Speed: {maxSpeed}</span>
          </div>
        {/if}
      </div>
  
      <div class="pile distance-pile">
        <h4>Distance ({distance} miles)</h4>
        {#if distancePile.length > 0}
          <div class="distance-cards">
            {#each distancePile as card}
              <Card {card} mini={true} />
            {/each}
          </div>
        {:else}
          <div class="empty-pile">No distance cards</div>
        {/if}
      </div>
  
      <div class="pile safety-pile">
        <h4>Safety</h4>
        {#if safetyPile.length > 0}
          <div class="safety-cards">
            {#each safetyPile as safety}
              <Card card={{ type: 'safety', effect: safety }} mini={true} />
            {/each}
          </div>
        {:else}
          <div class="empty-pile">No safety cards</div>
        {/if}
      </div>
    </div>
  
    {#if isCurrentPlayer}
      <PlayerHand cards={playerHand} onPlayCard={playCard} getDropZone={getDropZone} />
    {/if}
  </div>
  
  <style>
    .player-area {
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      background-color: #f5f5f5;
    }
  
    .current-player {
      background-color: #e6f7ff;
      border: 2px solid #1890ff;
    }
  
    .opponent {
      background-color: #fff0f6;
      border: 2px solid #ff4d4f;
    }
  
    .player-info {
      margin-bottom: 1rem;
    }
  
    .distance-counter {
      margin-top: 0.5rem;
    }
  
    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e9e9e9;
      border-radius: 4px;
      overflow: hidden;
    }
  
    .progress {
      height: 100%;
      background-color: #52c41a;
    }
  
    .play-area {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
  
    .pile {
      flex: 1;
      min-width: 120px;
      padding: 0.5rem;
      border-radius: 4px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .pile h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
  
    .empty-pile {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ccc;
      border-radius: 4px;
      color: #999;
    }
  
    .distance-cards, .safety-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  
    .speed-indicator {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #52c41a;
    }
  </style>