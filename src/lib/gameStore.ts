import { writable } from "svelte/store";

// Function to shuffle an array using Fisher-Yates algorithm
export function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }

  return array;
}

const fullDeck = [
    { type: "Distance", value: 25 }, { type: "Distance", value: 25 }, { type: "Distance", value: 25 }, { type: "Distance", value: 25 },
    { type: "Distance", value: 50 }, { type: "Distance", value: 50 }, { type: "Distance", value: 50 }, { type: "Distance", value: 50 },
    { type: "Distance", value: 75 }, { type: "Distance", value: 75 }, { type: "Distance", value: 75 }, { type: "Distance", value: 75 },
    { type: "Distance", value: 100 }, { type: "Distance", value: 100 }, { type: "Distance", value: 100 }, { type: "Distance", value: 100 },
    { type: "Distance", value: 200 }, { type: "Distance", value: 200 }, { type: "Distance", value: 200 }, { type: "Distance", value: 200 },
    { type: "Hazard", value: 0 }, { type: "Hazard", value: 0 }, { type: "Hazard", value: 0 }, { type: "Hazard", value: 0 },
    { type: "Remedy", value: 0 }, { type: "Remedy", value: 0 }, { type: "Remedy", value: 0 }, { type: "Remedy", value: 0 }
  ];

export function createShuffledDeck() {
    return shuffle(fullDeck);
}

export const deck = writable(createShuffledDeck()); 
export const playerHand = writable([] as { type: string; value: number }[]);
// export const discardPile = writable([] as { type: string; value: number }[]);
// export const playArea = writable([] as { type: string; value: number }[]);
export const playerDistances = writable({ 1: 0, 2: 0 }); // Track distance for each player
export const playerStatus = writable({ 1: "OK", 2: "OK" }); // "OK" or "Stopped" by a hazard
export const gameOver = writable(false);
export const winner = writable<number | null>(null);

export const currentPlayer = writable("");  // Default empty, updates from Firestore
export const playArea = writable([]);
export const discardPile = writable([]);
export const playerHands = writable({});
