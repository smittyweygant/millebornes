import { db, auth } from "$lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import type { Card } from "../types/cardTypes";
import { gameStore } from "../stores/gameStore";
import { createDeck, shuffleDeck } from "../utils/deckUtility";
import type { GameStoreState } from "../stores/gameStore";

// Create a class for Firebase service
export class FirebaseService {
  async createNewGame(): Promise<string> {
    const initialDeck = shuffleDeck(createDeck());
    
    const initialGameState: GameStoreState = {
      players: ["player1"],
      deck: initialDeck,
      discardPile: [],
      playerHands: { player1: [] },
      playArea: { player1: [] },
      playerState: { player1: "moving" },
      activeHazards: { player1: [] },
      activeSafeties: { player1: [] },
      currentPlayer: "player1",
      gameOver: false,
      winner: null
    };
    
    const gameRef = await addDoc(collection(db, "games"), initialGameState);
    const gameId = gameRef.id;
    
    this.setupGameListener(gameId);  
    return gameId;
  }

  async joinExistingGame(gameId: string): Promise<string | null> {
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) {
        console.error("Game not found!");
        return null;
      }
      const gameData = gameSnap.data() as GameStoreState;
      if (gameData.players.length >= 4) {
        console.error("Game is full!");
        return null;
      }
      const playerId = `player${gameData.players.length + 1}`;

      // Create player's initial state
      const playerUpdate = {
        players: arrayUnion(playerId),
        [`playerHands.${playerId}`]: [],
        [`playArea.${playerId}`]: [],
        [`playerState.${playerId}`]: "moving",
        [`activeHazards.${playerId}`]: [],
        [`activeSafeties.${playerId}`]: []
      };

      await updateDoc(gameRef, playerUpdate);
      this.setupGameListener(gameId);
      return playerId;
    } catch (error) {
      console.error("Error joining game:", error);
      return null;
    }
  }

  setupGameListener(gameId: string) {
    onSnapshot(doc(db, "games", gameId), (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data() as GameStoreState;
        gameStore.set(gameData);
      }
    });
  }

  async checkGameExists(gameId: string): Promise<boolean> {
    try {
      const gameDoc = await getDoc(doc(db, "games", gameId));
      return gameDoc.exists();
    } catch (error) {
      console.error("Error checking game existence:", error);
      return false;
    }
  }

  initAuth(callback: (user: any) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async drawCard(gameId: string, playerId: string): Promise<boolean> {
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return false;
      
      const gameData = gameSnap.data() as GameStoreState;
      if (gameData.deck.length === 0) return false;
      
      const card = gameData.deck[0];
      const newDeck = gameData.deck.slice(1);
      const playerHand = gameData.playerHands[playerId] || [];
      
      await updateDoc(gameRef, {
        deck: newDeck,
        [`playerHands.${playerId}`]: [...playerHand, card]
      });
      
      return true;
    } catch (error) {
      console.error("Error drawing card:", error);
      return false;
    }
  }

  async playCard(gameId: string, playerId: string, cardIndex: number): Promise<boolean> {
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return false;
      
      const gameData = gameSnap.data() as GameStoreState;
      const playerHand = gameData.playerHands[playerId] || [];
      if (cardIndex < 0 || cardIndex >= playerHand.length) return false;
      
      const card = playerHand[cardIndex];
      const newHand = [...playerHand];
      newHand.splice(cardIndex, 1);
      
      const playArea = gameData.playArea[playerId] || [];
      
      await updateDoc(gameRef, {
        [`playerHands.${playerId}`]: newHand,
        [`playArea.${playerId}`]: [...playArea, card]
      });
      
      return true;
    } catch (error) {
      console.error("Error playing card:", error);
      return false;
    }
  }

  async discardCard(gameId: string, playerId: string, cardIndex: number): Promise<boolean> {
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return false;
      
      const gameData = gameSnap.data() as GameStoreState;
      const playerHand = gameData.playerHands[playerId] || [];
      if (cardIndex < 0 || cardIndex >= playerHand.length) return false;
      
      const card = playerHand[cardIndex];
      const newHand = [...playerHand];
      newHand.splice(cardIndex, 1);
      
      await updateDoc(gameRef, {
        [`playerHands.${playerId}`]: newHand,
        discardPile: [...gameData.discardPile, card]
      });
      
      return true;
    } catch (error) {
      console.error("Error discarding card:", error);
      return false;
    }
  }

  async endTurn(gameId: string): Promise<boolean> {
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return false;
      
      const gameData = gameSnap.data() as GameStoreState;
      const currentPlayerIndex = gameData.players.indexOf(gameData.currentPlayer);
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.length;
      
      await updateDoc(gameRef, {
        currentPlayer: gameData.players[nextPlayerIndex]
      });
      
      return true;
    } catch (error) {
      console.error("Error ending turn:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const firebaseService = new FirebaseService();