import { CardType, CardCategory } from '../types/cardTypes';
import type { Card } from '../types/cardTypes';

// Define the complete deck of Mille Bornes cards
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 1;
  
  // Hazard cards
  const addHazards = (type: CardType, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.HAZARD,
        name,
        description
      });
    }
  };
  
  // Remedy cards
  const addRemedies = (type: CardType, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.REMEDY,
        name,
        description
      });
    }
  };
  
  // Safety cards
  const addSafeties = (type: CardType, name: string, description: string, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${id++}`,
        type,
        category: CardCategory.SAFETY,
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
  addHazards(CardType.ACCIDENT, "Accident", "Forces opponent to draw Repairs", 3);
  addHazards(CardType.OUT_OF_GAS, "Out of Gas", "Forces opponent to draw Gasoline", 3);
  addHazards(CardType.FLAT_TIRE, "Flat Tire", "Forces opponent to draw Spare Tire", 3);
  addHazards(CardType.SPEED_LIMIT, "Speed Limit", "Limits opponent to 50 miles per hour", 4);
  addHazards(CardType.STOP, "Stop", "Forces opponent to draw Roll", 5);
  
  // Remedies
  addRemedies(CardType.REPAIRS, "Repairs", "Remedy for Accident", 6);
  addRemedies(CardType.GASOLINE, "Gasoline", "Remedy for Out of Gas", 6);
  addRemedies(CardType.SPARE_TIRE, "Spare Tire", "Remedy for Flat Tire", 6);
  addRemedies(CardType.END_OF_LIMIT, "End of Limit", "Removes Speed Limit", 6);
  addRemedies(CardType.ROLL, "Roll", "Remedy for Stop", 14);
  
  // Safety cards
  addSafeties(CardType.DRIVING_ACE, "Driving Ace", "Protection from Accidents", 1);
  addSafeties(CardType.FUEL_TANK, "Fuel Tank", "Protection from Out of Gas", 1);
  addSafeties(CardType.PUNCTURE_PROOF, "Puncture Proof", "Protection from Flat Tires", 1);
  addSafeties(CardType.RIGHT_OF_WAY, "Right of Way", "Protection from Stop and Speed Limit", 1);
  
  // Distance cards
  addDistance(CardType.DISTANCE_25, "25 Miles", "Advance 25 miles", 25, 10);
  addDistance(CardType.DISTANCE_50, "50 Miles", "Advance 50 miles", 50, 10);
  addDistance(CardType.DISTANCE_75, "75 Miles", "Advance 75 miles", 75, 10);
  addDistance(CardType.DISTANCE_100, "100 Miles", "Advance 100 miles", 100, 12);
  addDistance(CardType.DISTANCE_200, "200 Miles", "Advance 200 miles", 200, 4);
  
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