import { writable } from "svelte/store";

// Mille Bornes card class definitions
export type Card = {
    type: "distance" | "hazard" | "remedy" | "safety";
    value?: number; // Only used for distance cards
    image?: string;
    effect?: string; // Describes what the card does
    count?: number; // Number of cards of this type
    points?: number // For safety cards - value when played
  };

const cardTypes = [
    { type: "distance", value: 25, image: "MB-25.svg", count: 10 },
    { type: "distance", value: 50, image: "MB-50.svg", count: 10 },
    { type: "distance", value: 75, image: "MB-75.svg", count: 10 },
    { type: "distance", value: 100, image: "MB-100.svg", count: 12 },
    { type: "distance", value: 200, image: "MB-200.svg", count: 4 },
    { type: "hazard", effect: "Accident", count: 3, image: "" },
    { type: "hazard", effect: "Out of Gas", count: 3, image: "" },
    { type: "hazard", effect: "Flat Tire", count: 3, image: "" },
    { type: "hazard", effect: "Stop", count: 5, image: "" },
    { type: "hazard", effect: "Speed Limit", count: 4, image: "" }, 
    { type: "remedy", effect: "Repairs", count: 14, image: "" }, 
    { type: "remedy", effect: "Gasoline", count: 14, image: "" }, 
    { type: "remedy", effect: "Spare Tire", count: 14, image: "" }, 
    { type: "remedy", effect: "Go", count: 14, image: "" }, 
    { type: "remedy", effect: "End of Limit", count: 14, image: "" }, 
  ];

export const hazardRemedyPairs: Record<string, string> = {
"Stop": "Go",
"Speed Limit": "End of Limit",
"Out of Gas": "Gasoline",
"Flat Tire": "Spare Tire",
"Accident": "Repairs"
};

export const safetyProtections: Record<string, string> = {
    "Accident": "Driving Ace",
    "Speed Limit": "Emergency Vehicle",
    "Stop": "Emergency Vehicle", // Now protects against Stop too
    "Out of Gas": "Extra Tank",
    "Flat Tire": "Puncture-Proof Tires"
  };  

// abbreviated card deck for testing
const testDeck = [{ type: "distance", value: 25 }, { type: "distance", value: 25 }, { type: "distance", value: 25 }, { type: "distance", value: 25 },
    { type: "distance", value: 50 }, { type: "distance", value: 50 }, { type: "distance", value: 50 }, { type: "distance", value: 50 },
    { type: "distance", value: 75 }, { type: "distance", value: 75 }, { type: "distance", value: 75 }, { type: "distance", value: 75 },
    { type: "distance", value: 100 }, { type: "distance", value: 100 }, { type: "distance", value: 100 }, { type: "distance", value: 100 },
    { type: "distance", value: 200 }, { type: "distance", value: 200 }, { type: "distance", value: 200 }, { type: "distance", value: 200 },
    { type: "hazard", value: 0, effect: "Stop" }, { type: "hazard", value: 0, effect: "Stop" }, { type: "hazard", value: 0, effect: "Stop" }, { type: "hazard", value: 0, effect: "Stop" },
    { type: "remedy", value: 0, effect: "Go" }, { type: "remedy", value: 0, effect: "Go" }, { type: "remedy", value: 0, effect: "Go" }, { type: "remedy", value: 0, effect: "Go" }
  ];

  // Function to create a shuffled deck
  export function createShuffledDeck() {
    console.log("Shuffling deck...");
    if (!testDeck) {
        console.error("testDeck is undefined at shuffle!");
        return [];
    }
    const shuffledDeck = [...testDeck]; // Copy `fullDeck` safely
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    console.debug("Shuffled Deck:", shuffledDeck);
    return shuffledDeck;
  }

export const playerHand = writable([] as { type: string; value: number }[]);
export const playerDistances = writable({ 1: 0, 2: 0 }); // Track distance for each player
export const playerStatus = writable({ 1: "OK", 2: "OK" }); // "OK" or "Stopped" by a hazard
export const gameOver = writable(false);
export const winner = writable<number | null>(null);
export const currentPlayer = writable("");  // Default empty, updates from Firestore
export const playArea = writable([]);
export const discardPile = writable([]);
export const playerHands = writable({});
export const deck = writable(createShuffledDeck());