import { writable } from "svelte/store";

// Mille Bornes card class definitions
export type Card = {
    type: "distance" | "hazard" | "remedy" | "safety";
    value?: number; // Only used for distance cards
    effect?: string; // Describes what the card does
  };
  
  export const hazardRemedyPairs: Record<string, string> = {
    "Stop": "Go",
    "Speed Limit": "End of Limit",
    "Out of Gas": "Gasoline",
    "Flat Tire": "Spare Tire",
    "Accident": "Repairs"
  };
  
  export const safetyProtections: Record<string, string> = {
    "Driving Ace": "Accident",
    "Emergency Vehicle": "Speed Limit",
    "Extra Tank": "Out of Gas",
    "Puncture-Proof Tires": "Flat Tire"
  };
  

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
    { type: "distance", value: 25 }, { type: "distance", value: 25 }, { type: "distance", value: 25 }, { type: "distance", value: 25 },
    { type: "distance", value: 50 }, { type: "distance", value: 50 }, { type: "distance", value: 50 }, { type: "distance", value: 50 },
    { type: "distance", value: 75 }, { type: "distance", value: 75 }, { type: "distance", value: 75 }, { type: "distance", value: 75 },
    { type: "distance", value: 100 }, { type: "distance", value: 100 }, { type: "distance", value: 100 }, { type: "distance", value: 100 },
    { type: "distance", value: 200 }, { type: "distance", value: 200 }, { type: "distance", value: 200 }, { type: "distance", value: 200 },
    { type: "hazard", value: 0 }, { type: "hazard", value: 0 }, { type: "hazard", value: 0 }, { type: "hazard", value: 0 },
    { type: "remedy", value: 0 }, { type: "remedy", value: 0 }, { type: "remedy", value: 0 }, { type: "remedy", value: 0 }
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
