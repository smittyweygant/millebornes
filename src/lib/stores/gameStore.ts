import { writable, derived } from 'svelte/store';
import type { Card, CardEffect, CardType } from '../types/cardTypes';
import type { GameState, PlayerStatus } from '../types/gameTypes';

// Game state interface
export interface GameStoreState {
  players: string[];
  deck: Card[];
  discardPile: Card[];
  playerHands: Record<string, Card[]>;
  playArea: Record<string, Card[]>;
  playerState: Record<string, PlayerStatus>;
  activeHazards: Record<string, CardEffect[]>;
  activeSafeties: Record<string, CardEffect[]>;
  currentPlayer: string;
  gameOver: boolean;
  winner: string | null;
}

// Create the main game store with a consistent initial state
const createInitialState = (): GameStoreState => ({
  players: [],
  deck: [],
  discardPile: [],
  playerHands: {},
  playArea: {},
  playerState: {},
  activeHazards: {},
  activeSafeties: {},
  currentPlayer: '',
  gameOver: false,
  winner: null
});

// Create the main game store
const createStore = () => {
  const store = writable<GameStoreState>(createInitialState());
  
  const updateState = (fn: (state: GameStoreState) => GameStoreState) => {
    store.update(fn);
  };

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: updateState,
    updateDeck: (newDeck: Card[]) => {
      updateState(state => ({ ...state, deck: newDeck }));
    },
    updatePlayerHand: (playerId: string, hand: Card[]) => {
      updateState(state => ({
        ...state,
        playerHands: { ...state.playerHands, [playerId]: hand }
      }));
    },
    addToDiscardPile: (card: Card) => {
      updateState(state => ({
        ...state,
        discardPile: [...state.discardPile, card]
      }));
    },
    addHazard: (playerId: string, hazard: CardEffect) => {
      updateState(state => ({
        ...state,
        activeHazards: {
          ...state.activeHazards,
          [playerId]: [...(state.activeHazards[playerId] || []), hazard]
        }
      }));
    },
    removeHazard: (playerId: string, hazard: CardEffect) => {
      updateState(state => ({
        ...state,
        activeHazards: {
          ...state.activeHazards,
          [playerId]: (state.activeHazards[playerId] || []).filter(h => h !== hazard)
        }
      }));
    },
    addSafety: (playerId: string, safety: CardEffect) => {
      updateState(state => ({
        ...state,
        activeSafeties: {
          ...state.activeSafeties,
          [playerId]: [...(state.activeSafeties[playerId] || []), safety]
        }
      }));
    },
    updatePlayerState: (playerId: string, status: PlayerStatus) => {
      updateState(state => ({
        ...state,
        playerState: { ...state.playerState, [playerId]: status }
      }));
    }
  };
};

export const gameStore = createStore();

// Derived stores
export const deck = derived(gameStore, $store => $store.deck);
export const discardPile = derived(gameStore, $store => $store.discardPile);
export const playerHands = derived(gameStore, $store => $store.playerHands);
export const playArea = derived(gameStore, $store => $store.playArea);
export const playerState = derived(gameStore, $store => $store.playerState);
export const activeHazards = derived(gameStore, $store => $store.activeHazards);
export const activeSafeties = derived(gameStore, $store => $store.activeSafeties);
export const currentPlayer = derived(gameStore, $store => $store.currentPlayer);
export const gameOver = derived(gameStore, $store => $store.gameOver);
export const winner = derived(gameStore, $store => $store.winner);

// Individual player's hand
export const playerHand = derived(
  [playerHands, currentPlayer],
  ([$playerHands, $currentPlayer]) => $playerHands[$currentPlayer] || []
);

// Calculate player distances
export const playerDistances = derived(
  playArea,
  ($playArea) => {
    const distances: Record<string, number> = {};
    for (const [player, cards] of Object.entries($playArea)) {
      distances[player] = calculateDistance(cards);
    }
    return distances;
  }
);

// Helper functions
function calculateDistance(cards: Card[]): number {
  return cards
    .filter(card => card.type === "distance")
    .reduce((total, card) => total + (card.value || 0), 0);
}

export function resetGameState() {
  gameStore.set(createInitialState());
}

export function initializeGameState(gameData: GameState) {
  if (!gameData) return;
  
  const state: GameStoreState = {
    players: gameData.players,
    deck: gameData.deck,
    discardPile: gameData.discardPile,
    playerHands: gameData.playerHands,
    playArea: gameData.playArea,
    playerState: gameData.playerState,
    activeHazards: gameData.activeHazards,
    activeSafeties: gameData.activeSafeties,
    currentPlayer: gameData.currentPlayer,
    gameOver: gameData.gameOver,
    winner: gameData.winner
  };
  
  gameStore.set(state);
}