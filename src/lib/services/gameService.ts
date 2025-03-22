import { get } from 'svelte/store';
import { firebaseService } from './firebaseService';
import { 
  deck, 
  discardPile, 
  playerHands, 
  playArea, 
  playerState, 
  activeHazards, 
  activeSafeties, 
  currentPlayer,
  playerHand,
  gameOver,
  winner
} from '../stores/gameStore';
import { checkWinCondition } from '../utils/gameRules';
import { CardType, CardCategory } from '../types/cardTypes';

// Central game service to handle all game actions
export class GameService {
  private gameId: string = '';
  private playerId: string = '';
  private isHost: boolean = false;

  async createGame(): Promise<string> {
    this.gameId = await firebaseService.createNewGame();
    this.playerId = 'player1';
    this.isHost = true;
    return this.gameId;
  }

  async joinGame(gameId: string): Promise<boolean> {
    const playerId = await firebaseService.joinExistingGame(gameId);
    if (playerId) {
      this.gameId = gameId;
      this.playerId = playerId;
      this.isHost = false;
      return true;
    }
    return false;
  }

  async drawCard(): Promise<boolean> {
    if (!this.canPerformAction()) return false;
    return await firebaseService.drawCard(this.gameId, this.playerId);
  }

  async playCard(cardIndex: number): Promise<boolean> {
    if (!this.canPerformAction()) return false;
    return await firebaseService.playCard(this.gameId, this.playerId, cardIndex);
  }

  async discardCard(cardIndex: number): Promise<boolean> {
    if (!this.canPerformAction()) return false;
    return await firebaseService.discardCard(this.gameId, this.playerId, cardIndex);
  }

  async endTurn(): Promise<boolean> {
    if (!this.canPerformAction()) return false;
    return await firebaseService.endTurn(this.gameId);
  }

  private canPerformAction(): boolean {
    const currentPlayerValue = get(currentPlayer);
    const gameOverValue = get(gameOver);
    
    if (!this.gameId || !this.playerId) {
      console.error("Game not initialized");
      return false;
    }
    
    if (gameOverValue) {
      console.error("Game is over");
      return false;
    }
    
    if (currentPlayerValue !== this.playerId) {
      console.error("Not your turn");
      return false;
    }
    
    return true;
  }

  getGameId(): string {
    return this.gameId;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  isGameHost(): boolean {
    return this.isHost;
  }

  isCurrentPlayer(): boolean {
    return get(currentPlayer) === this.playerId;
  }

  isMyTurn(): boolean {
    return this.isCurrentPlayer() && !get(gameOver);
  }

  calculateTotalDistance(player: string): number {
    const playerPlayArea = get(playArea)[player] || [];
    return playerPlayArea
      .filter(card => card.category === CardCategory.DISTANCE)
      .reduce((total, card) => total + (card.value || 0), 0);
  }

  checkForWinner(): string | null {
    const players = Object.keys(get(playArea));
    
    for (const player of players) {
      const distance = this.calculateTotalDistance(player);
      if (distance >= 1000) {
        return player;
      }
    }
    
    return null;
  }
}

// Export a singleton instance
export const gameService = new GameService();