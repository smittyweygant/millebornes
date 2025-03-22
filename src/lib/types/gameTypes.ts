import type { Card, CardEffect } from './cardTypes';

export type PlayerStatus = "moving" | "blocked!";

export interface GameState {
  players: string[];
  deck: Card[];
  discardPile: Card[];
  playerHands: Record<string, Card[]>;
  playArea: Record<string, Card[]>;
  playerState: Record<string, PlayerStatus>;
  activeHazards: Record<string, CardEffect[]>;
  activeSafeties: Record<string, CardEffect[]>;
  playerDistances: Record<string, number>;
  currentPlayer: string;
  createdAt: Date;
  gameOver: boolean;
  winner: string | null;
}

export interface PlayerState {
  hand: Card[];
  playArea: Card[];
  distance: number;
  status: PlayerStatus;
  activeHazards: CardEffect[];
  activeSafeties: CardEffect[];
}