import type { Card, CardEffect } from '../types/cardTypes';
import type { PlayerStatus } from '../types/gameTypes';

export const WINNING_DISTANCE = 1000;

// Define card counts for initialization
export const CARD_COUNTS = {
  // Distance cards
  distance25: 10,
  distance50: 10,
  distance75: 10,
  distance100: 12,
  distance200: 4,
  
  // Hazard cards
  accident: 3,
  outOfGas: 3,
  flatTire: 3,
  speedLimit: 4,
  stop: 5,
  
  // Remedy cards  
  repairs: 6,
  gasoline: 6,
  spareTire: 6,
  endOfLimit: 6,
  go: 14,
  
  // Safety cards
  drivingAce: 1,
  fuelTruck: 1,
  punctureProof: 1,
  rightOfWay: 1
};

export const hazardRemedyPairs: Record<CardEffect, CardEffect> = {
  "accident": "repairs",
  "outOfGas": "gasoline",
  "flatTire": "spareTire",
  "speedLimit": "endOfLimit",
  "stop": "go"
};

export const safetyProtections: Record<CardEffect, CardEffect> = {
  "accident": "drivingAce",
  "outOfGas": "fuelTruck",
  "flatTire": "punctureProof",
  "speedLimit": "rightOfWay",
  "stop": "rightOfWay"
};

export function canPlayDistanceCard(
  playerStatus: PlayerStatus, 
  distanceCard: Card, 
  currentDistance: number
): boolean {
  // Cannot play distance while blocked
  if (playerStatus !== "moving") return false;
  
  // Cannot exceed 1000 miles
  if (currentDistance + (distanceCard.value || 0) > WINNING_DISTANCE) return false;
  
  // Cannot play 200 mile card as first card
  if (distanceCard.value === 200 && currentDistance === 0) return false;
  
  return true;
}

export function canPlayHazardCard(
  targetPlayer: string,
  hazardEffect: CardEffect,
  activeSafeties: Record<string, CardEffect[]>
): boolean {
  const protection = safetyProtections[hazardEffect];
  return !activeSafeties[targetPlayer]?.includes(protection);
}

export function canPlayRemedyCard(
  playerId: string,
  remedyEffect: CardEffect,
  activeHazards: Record<string, CardEffect[]>
): boolean {
  const hazardToRemove = Object.keys(hazardRemedyPairs).find(
    hazard => hazardRemedyPairs[hazard as CardEffect] === remedyEffect
  ) as CardEffect | undefined;
  
  return !!hazardToRemove && activeHazards[playerId]?.includes(hazardToRemove);
}

export function calculateDistance(playedCards: Card[]): number {
  return playedCards
    .filter(card => card.type === "distance")
    .reduce((total, card) => total + (card.value || 0), 0);
}

export function checkWinCondition(playerDistances: Record<string, number>): string | null {
  for (const [player, distance] of Object.entries(playerDistances)) {
    if (distance >= WINNING_DISTANCE) {
      return player;
    }
  }
  return null;
}

export function createInitialDeck(): Card[] {
  const deck: Card[] = [];
  
  // Add distance cards
  for (let i = 0; i < CARD_COUNTS.distance25; i++) {
    deck.push({ type: "distance", value: 25 });
  }
  for (let i = 0; i < CARD_COUNTS.distance50; i++) {
    deck.push({ type: "distance", value: 50 });
  }
  for (let i = 0; i < CARD_COUNTS.distance75; i++) {
    deck.push({ type: "distance", value: 75 });
  }
  for (let i = 0; i < CARD_COUNTS.distance100; i++) {
    deck.push({ type: "distance", value: 100 });
  }
  for (let i = 0; i < CARD_COUNTS.distance200; i++) {
    deck.push({ type: "distance", value: 200 });
  }
  
  // Add hazard cards
  for (let i = 0; i < CARD_COUNTS.accident; i++) {
    deck.push({ type: "hazard", effect: "accident" });
  }
  for (let i = 0; i < CARD_COUNTS.outOfGas; i++) {
    deck.push({ type: "hazard", effect: "outOfGas" });
  }
  for (let i = 0; i < CARD_COUNTS.flatTire; i++) {
    deck.push({ type: "hazard", effect: "flatTire" });
  }
  for (let i = 0; i < CARD_COUNTS.speedLimit; i++) {
    deck.push({ type: "hazard", effect: "speedLimit" });
  }
  for (let i = 0; i < CARD_COUNTS.stop; i++) {
    deck.push({ type: "hazard", effect: "stop" });
  }
  
  // Add remedy cards
  for (let i = 0; i < CARD_COUNTS.repairs; i++) {
    deck.push({ type: "remedy", effect: "repairs" });
  }
  for (let i = 0; i < CARD_COUNTS.gasoline; i++) {
    deck.push({ type: "remedy", effect: "gasoline" });
  }
  for (let i = 0; i < CARD_COUNTS.spareTire; i++) {
    deck.push({ type: "remedy", effect: "spareTire" });
  }
  for (let i = 0; i < CARD_COUNTS.endOfLimit; i++) {
    deck.push({ type: "remedy", effect: "endOfLimit" });
  }
  for (let i = 0; i < CARD_COUNTS.go; i++) {
    deck.push({ type: "remedy", effect: "go" });
  }
  
  // Add safety cards
  deck.push({ type: "safety", effect: "drivingAce" });
  deck.push({ type: "safety", effect: "fuelTruck" });
  deck.push({ type: "safety", effect: "punctureProof" });
  deck.push({ type: "safety", effect: "rightOfWay" });
  
  // Shuffle deck
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}