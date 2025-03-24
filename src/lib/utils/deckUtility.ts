import { CardType, CardEffect,CardCategory } from '../types/cardTypes';
import { CARD_COUNTS } from './gameRulesEngine';
import type { Card } from '../types/cardTypes';

// Define the complete deck of Mille Bornes cards
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 1;
  
  // Hazard cards
  const addHazards = (type: CardType, effect: CardEffect, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.HAZARD,
        effect,
        name,
        description
      });
    }
  };
  
  // Remedy cards
  const addRemedies = (type: CardType, effect: CardEffect, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.REMEDY,
        effect,
        name,
        description
      });
    }
  };
  
  // Safety cards
  const addSafeties = (type: CardType, effect: CardEffect, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.SAFETY,
        effect,
        name,
        description
      });
    }
  };
  
  // Distance cards
  const addDistance = (type: CardType, name: string, description: string, value: number, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.DISTANCE,
        name,
        description,
        value
      });
    }
  };
  
  // Add all card types according to official game quantities
  
  // Hazards
  addHazards(CardType.ACCIDENT, CardEffect.ACCIDENT, "Accident", "Forces opponent to draw Repairs", CARD_COUNTS.accident);
  addHazards(CardType.OUT_OF_GAS, CardEffect.OUT_OF_GAS, "Out of Gas", "Forces opponent to draw Gasoline", CARD_COUNTS.out_of_gas);
  addHazards(CardType.FLAT_TIRE, CardEffect.FLAT_TIRE, "Flat Tire", "Forces opponent to draw Spare Tire", CARD_COUNTS.flat_tire);
  addHazards(CardType.SPEED_LIMIT, CardEffect.SPEED_LIMIT, "Speed Limit", "Limits opponent to 50 miles per hour", CARD_COUNTS.speed_limit);
  addHazards(CardType.STOP, CardEffect.STOP, "Stop", "Forces opponent to draw Roll", CARD_COUNTS.stop);
  
  // Remedies
  addRemedies(CardType.REPAIRS, CardEffect.REPAIRS, "Repairs", "Remedy for Accident", CARD_COUNTS.repairs);
  addRemedies(CardType.GASOLINE, CardEffect.GASOLINE, "Gasoline", "Remedy for Out of Gas", CARD_COUNTS.gasoline);
  addRemedies(CardType.SPARE_TIRE, CardEffect.SPARE_TIRE, "Spare Tire", "Remedy for Flat Tire", CARD_COUNTS.spare_tire);
  addRemedies(CardType.END_OF_LIMIT, CardEffect.END_OF_LIMIT, "End of Limit", "Removes Speed Limit", CARD_COUNTS.end_of_limit);
  addRemedies(CardType.ROLL, CardEffect.ROLL, "Roll", "Remedy for Stop", CARD_COUNTS.roll);
  
  // Safety cards
  addSafeties(CardType.DRIVING_ACE, CardEffect.DRIVING_ACE, "Driving Ace", "Protection from Accidents", CARD_COUNTS.driving_ace);
  addSafeties(CardType.FUEL_TANK, CardEffect.FUEL_TANK, "Fuel Truck", "Protection from Out of Gas", CARD_COUNTS.fuel_tank);
  addSafeties(CardType.PUNCTURE_PROOF, CardEffect.PUNCTURE_PROOF, "Puncture Proof", "Protection from Flat Tires", CARD_COUNTS.puncture_proof);
  addSafeties(CardType.RIGHT_OF_WAY, CardEffect.RIGHT_OF_WAY, "Right of Way", "Protection from Stop and Speed Limit", CARD_COUNTS.right_of_way);
  
  // Distance cards
  addDistance(CardType.DISTANCE_25, "25 Miles", "Advance 25 miles", 25, CARD_COUNTS.distance_25);
  addDistance(CardType.DISTANCE_50, "50 Miles", "Advance 50 miles", 50, CARD_COUNTS.distance_50);
  addDistance(CardType.DISTANCE_75, "75 Miles", "Advance 75 miles", 75, CARD_COUNTS.distance_75);
  addDistance(CardType.DISTANCE_100, "100 Miles", "Advance 100 miles", 100, CARD_COUNTS.distance_100);
  addDistance(CardType.DISTANCE_200, "200 Miles", "Advance 200 miles", 200, CARD_COUNTS.distance_200);
  
  return deck;
};

// Shuffle the deck
export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Draw a card from the deck
export const drawCard = (deck: Card[]): { card: Card, remainingDeck: Card[] } => {
  if (deck.length === 0) {
    throw new Error("Deck is empty");
  }
  const card = deck[0];
  const remainingDeck = deck.slice(1);
  return { card, remainingDeck };
};

// Check if a card can be played
export const canPlayCard = (card: Card, playerState: any): boolean => {
  // Implementation depends on your game state structure
  // This is a simplified version that will need to be expanded
  
  switch (card.category) {
    case CardCategory.DISTANCE:
      // Can only play distance cards if player has a "Roll" card and no "Speed Limit"
      return playerState.battlePile.some((c: Card) => c.type === CardType.ROLL) && 
        !playerState.battlePile.some((c: Card) => c.type === CardType.SPEED_LIMIT);
    
    case CardCategory.HAZARD:
      // Hazards are played on opponents
      return true;
    
    case CardCategory.REMEDY:
      // Remedies depend on the current hazards affecting the player
      if (card.type === CardType.REPAIRS) {
        return playerState.battlePile.some((c: Card) => c.type === CardType.ACCIDENT);
      } else if (card.type === CardType.GASOLINE) {
        return playerState.battlePile.some((c: Card) => c.type === CardType.OUT_OF_GAS);
      } else if (card.type === CardType.SPARE_TIRE) {
        return playerState.battlePile.some((c: Card) => c.type === CardType.FLAT_TIRE);
      } else if (card.type === CardType.END_OF_LIMIT) {
        return playerState.battlePile.some((c: Card) => c.type === CardType.SPEED_LIMIT);
      } else if (card.type === CardType.ROLL) {
        return playerState.battlePile.some((c: Card) => c.type === CardType.STOP) || 
          playerState.battlePile.length === 0;
      }
      return false;
    
    case CardCategory.SAFETY:
      // Safety cards can always be played
      return true;
    
    default:
      return false;
  }
};