import { type Card, CardEffect, CardType } from '../types/cardTypes';
import type { PlayerStatus } from '../types/gameTypes';

export const WINNING_DISTANCE = 1000;

// Define card counts for initialization
export const CARD_COUNTS = {
  // Distance cards
  distance_25: 10,
  distance_50: 10,
  distance_75: 10,
  distance_100: 12,
  distance_200: 4,
  
  // Hazard cards
  accident: 3,
  out_of_gas: 3,
  flat_tire: 3,
  speed_limit: 4,
  stop: 5,
  
  // Remedy cards  
  repairs: 6,
  gasoline: 6,
  spare_tire: 6,
  end_of_limit: 6,
  roll: 14,
  
  // Safety cards
  driving_ace: 1,
  fuel_tank: 1,
  puncture_proof: 1,
  right_of_way: 1
};

export const hazardRemedyPairs: Record<CardType, CardEffect> = {
  "accident": CardEffect.REPAIRS,
  "out_of_gas": CardEffect.GASOLINE,
  "flat_tire": CardEffect.SPARE_TIRE,
  "speed_limit": CardEffect.END_OF_LIMIT,
  "stop": CardEffect.ROLL
};

export const safetyProtections: Record<CardType, CardEffect> = {
  "accident": CardEffect.DRIVING_ACE,
  "out_of_gas": CardEffect.FUEL_TANK,
  "flat_tire": CardEffect.PUNCTURE_PROOF,
  "speed_limit": CardEffect.RIGHT_OF_WAY,
  "stop": CardEffect.RIGHT_OF_WAY
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
    .filter(card => card.category === "distance")
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
