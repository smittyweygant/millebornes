import { writable, derived } from 'svelte/store';
import type { Card } from '../utils/deckUtility';
import { CardType, CardCategory, createDeck, shuffleDeck, drawCard } from '../utils/deckUtility';

// Define player state interface
export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  battlePile: Card[]; // Current status cards (roll, stop, etc.)
  speedPile: Card[]; // Speed limit cards
  distancePile: Card[]; // Distance cards
  safetyPile: Card[]; // Safety cards
  score: number;
  isActive: boolean;
  mileage: number;
}

// Define game state interface
export interface GameState {
  gameId: string;
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  gameStatus: 'waiting' | 'setup' | 'playing' | 'ended';
  winner: string | null;
  messages: GameMessage[];
  turnStartTime: number;
  turnTimeLimit: number; // in seconds
}

// Define game message interface
export interface GameMessage {
  id: string;
  text: string;
  type: 'info' | 'action' | 'error' | 'system';
  timestamp: number;
}

// Create the game state store
export const gameState = writable<GameState>({
  gameId: '',
  players: [],
  drawPile: [],
  discardPile: [],
  currentPlayerIndex: 0,
  gameStatus: 'waiting',
  winner: null,
  messages: [],
  turnStartTime: 0,
  turnTimeLimit: 30
});

// Create derived stores for convenience
export const currentPlayer = derived(gameState, $gameState => {
  return $gameState.players[$gameState.currentPlayerIndex] || null;
});

export const gameStatus = derived(gameState, $gameState => $gameState.gameStatus);

export const gameMessages = derived(gameState, $gameState => $gameState.messages);

// Game action functions
export const gameActions = {
  // Initialize a new game
  initializeGame: (playerNames: string[], gameId: string) => {
    const deck = shuffleDeck(createDeck());
    const players: PlayerState[] = [];
    
    let remainingDeck = [...deck];
    
    // Create players and deal 6 cards to each
    for (let i = 0; i < playerNames.length; i++) {
      const playerHand: Card[] = [];
      
      // Deal 6 cards to each player
      for (let j = 0; j < 6; j++) {
        if (remainingDeck.length > 0) {
          const { card, remainingDeck: newDeck } = drawCard(remainingDeck);
          playerHand.push(card);
          remainingDeck = newDeck;
        }
      }
      
      players.push({
        id: `player-${i}`,
        name: playerNames[i],
        hand: playerHand,
        battlePile: [],
        speedPile: [],
        distancePile: [],
        safetyPile: [],
        score: 0,
        isActive: i === 0, // First player is active
        mileage: 0
      });
    }
    
    gameState.update(state => ({
      ...state,
      gameId,
      players,
      drawPile: remainingDeck,
      discardPile: [],
      currentPlayerIndex: 0,
      gameStatus: 'playing',
      winner: null,
      messages: [
        {
          id: `msg-${Date.now()}`,
          text: 'Game has started!',
          type: 'system',
          timestamp: Date.now()
        }
      ],
      turnStartTime: Date.now(),
      turnTimeLimit: 30
    }));
  },
  
  // Draw a card from the draw pile
  drawCardFromPile: () => {
    gameState.update(state => {
      if (state.drawPile.length === 0) {
        // If draw pile is empty, shuffle discard pile and create new draw pile
        if (state.discardPile.length === 0) {
          // If both piles are empty, can't draw
          return {
            ...state,
            messages: [...state.messages, {
              id: `msg-${Date.now()}`,
              text: 'No cards left to draw!',
              type: 'error',
              timestamp: Date.now()
            }]
          };
        }
        
        const newDrawPile = shuffleDeck([...state.discardPile]);
        
        return {
          ...state,
          drawPile: newDrawPile.slice(1),
          discardPile: [],
          players: state.players.map((player, index) => {
            if (index === state.currentPlayerIndex) {
              return {
                ...player,
                hand: [...player.hand, newDrawPile[0]]
              };
            }
            return player;
          }),
          messages: [...state.messages, {
            id: `msg-${Date.now()}`,
            text: 'Discard pile shuffled into draw pile.',
            type: 'system',
            timestamp: Date.now()
          }]
        };
      }
      
      const { card, remainingDeck } = drawCard(state.drawPile);
      
      return {
        ...state,
        drawPile: remainingDeck,
        players: state.players.map((player, index) => {
          if (index === state.currentPlayerIndex) {
            return {
              ...player,
              hand: [...player.hand, card]
            };
          }
          return player;
        }),
        messages: [...state.messages, {
          id: `msg-${Date.now()}`,
          text: `${state.players[state.currentPlayerIndex].name} drew a card.`,
          type: 'action',
          timestamp: Date.now()
        }]
      };
    });
  },
  
  // Play a card from hand
  playCard: (cardIndex: number, targetPlayerIndex?: number) => {
    gameState.update(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const card = currentPlayer.hand[cardIndex];
      
      if (!card) {
        return state;
      }
      
      const targetPlayer = typeof targetPlayerIndex === 'number' 
        ? state.players[targetPlayerIndex] 
        : currentPlayer;
      
      // Remove card from hand
      const newHand = [...currentPlayer.hand];
      newHand.splice(cardIndex, 1);
      
      // Define the message for this action
      let message: GameMessage = {
        id: `msg-${Date.now()}`,
        text: `${currentPlayer.name} played ${card.name}`,
        type: 'action',
        timestamp: Date.now()
      };
      
      // Process the card based on its category
      switch (card.category) {
        case CardCategory.HAZARD:
          // Hazards are played on opponents
          if (targetPlayer.id === currentPlayer.id) {
            return {
              ...state,
              messages: [...state.messages, {
                id: `msg-${Date.now()}`,
                text: 'Cannot play hazard on yourself!',
                type: 'error',
                timestamp: Date.now()
              }]
            };
          }
          
          // Check if the target player has safety against this hazard
          const hasImmunity = targetPlayer.safetyPile.some(safetyCard => {
            switch (card.type) {
              case CardType.ACCIDENT:
                return safetyCard.type === CardType.DRIVING_ACE;
              case CardType.OUT_OF_GAS:
                return safetyCard.type === CardType.FUEL_TANK;
              case CardType.FLAT_TIRE:
                return safetyCard.type === CardType.PUNCTURE_PROOF;
              case CardType.STOP:
              case CardType.SPEED_LIMIT:
                return safetyCard.type === CardType.RIGHT_OF_WAY;
              default:
                return false;
            }
          });
          
          if (hasImmunity) {
            message = {
              id: `msg-${Date.now()}`,
              text: `${currentPlayer.name} played ${card.name} on ${targetPlayer.name}, but they have immunity!`,
              type: 'info',
              timestamp: Date.now()
            };
            
            return {
              ...state,
              discardPile: [...state.discardPile, card],
              players: state.players.map((player, index) => {
                if (index === state.currentPlayerIndex) {
                  return { ...player, hand: newHand };
                }
                return player;
              }),
              messages: [...state.messages, message]
            };
          }
          
          // Apply the hazard to the target player
          message = {
            id: `msg-${Date.now()}`,
            text: `${currentPlayer.name} played ${card.name} on ${targetPlayer.name}!`,
            type: 'action',
            timestamp: Date.now()
          };
          
          return {
            ...state,
            players: state.players.map((player, index) => {
              if (index === state.currentPlayerIndex) {
                return { ...player, hand: newHand };
              }
              if (player.id === targetPlayer.id) {
                if (card.type === CardType.SPEED_LIMIT) {
                  return {
                    ...player,
                    speedPile: [...player.speedPile, card]
                  };
                } else {
                  return {
                    ...player,
                    battlePile: [...player.battlePile.filter(c => 
                      !(c.type === CardType.ROLL)
                    ), card]
                  };
                }
              }
              return player;
            }),
            messages: [...state.messages, message]
          };
          
        case CardCategory.REMEDY:
          // Remedies are played on self
          if (targetPlayer.id !== currentPlayer.id) {
            return {
              ...state,
              messages: [...state.messages, {
                id: `msg-${Date.now()}`,
                text: 'Cannot play remedy on other players!',
                type: 'error',
                timestamp: Date.now()
              }]
            };
          }
          
          // Check if the remedy is applicable
          const remedyApplicable = (() => {
            switch (card.type) {
              case CardType.REPAIRS:
                return currentPlayer.battlePile.some(c => c.type === CardType.ACCIDENT);
              case CardType.GASOLINE:
                return currentPlayer.battlePile.some(c => c.type === CardType.OUT_OF_GAS);
              case CardType.SPARE_TIRE:
                return currentPlayer.battlePile.some(c => c.type === CardType.FLAT_TIRE);
              case CardType.END_OF_LIMIT:
                return currentPlayer.speedPile.some(c => c.type === CardType.SPEED_LIMIT);
              case CardType.ROLL:
                return currentPlayer.battlePile.some(c => c.type === CardType.STOP) ||
                       currentPlayer.battlePile.length === 0;
              default:
                return false;
            }
          })();
          
          if (!remedyApplicable) {
            return {
              ...state,
              messages: [...state.messages, {
                id: `msg-${Date.now()}`,
                text: 'This remedy is not applicable!',
                type: 'error',
                timestamp: Date.now()
              }]
            };
          }
          
          // Apply the remedy
          message = {
            id: `msg-${Date.now()}`,
            text: `${currentPlayer.name} played ${card.name}!`,
            type: 'action',
            timestamp: Date.now()
          };
          
          return {
            ...state,
            discardPile: [...state.discardPile, card],
            players: state.players.map((player, index) => {
              if (index === state.currentPlayerIndex) {
                if (card.type === CardType.END_OF_LIMIT) {
                  return {
                    ...player,
                    hand: newHand,
                    speedPile: player.speedPile.filter(c => c.type !== CardType.SPEED_LIMIT)
                  };
                } else if (card.type === CardType.ROLL) {
                  return {
                    ...player,
                    hand: newHand,
                    battlePile: player.battlePile.filter(c => c.type !== CardType.STOP).concat(card)
                  };
                } else {
                  // Other remedies remove their respective hazards
                  let hazardType;
                  switch (card.type) {
                    case CardType.REPAIRS:
                      hazardType = CardType.ACCIDENT;
                      break;
                    case CardType.GASOLINE:
                      hazardType = CardType.OUT_OF_GAS;
                      break;
                    case CardType.SPARE_TIRE:
                      hazardType = CardType.FLAT_TIRE;
                      break;
                    default:
                      hazardType = null;
                  }
                  
                  return {
                    ...player,
                    hand: newHand,
                    battlePile: player.battlePile.filter(c => c.type !== hazardType)
                  };
                }
              }
              return player;
            }),
            messages: [...state.messages, message]
          };
          
        case CardCategory.SAFETY:
          // Safety cards are played on self
          if (targetPlayer.id !== currentPlayer.id) {
            return {
              ...state,
              messages: [...state.messages, {
                id: `msg-${Date.now()}`,
                text: 'Cannot play safety card on other players!',
                type: 'error',
                timestamp: Date.now()
              }]
            };
          }
          
          message = {
            id: `msg-${Date.now()}`,
            text: `${currentPlayer.name} played ${card.name}!`,
            type: 'action',
            timestamp: Date.now()
          };
          
          return {
            ...state,
            players: state.players.map((player, index) => {
              if (index === state.currentPlayerIndex) {
                let updatedBattlePile = [...player.battlePile];
                let updatedSpeedPile = [...player.speedPile];
                
                // Remove any hazards that this safety protects against
                switch (card.type) {
                  case CardType.DRIVING_ACE:
                    updatedBattlePile = updatedBattlePile.filter(c => c.type !== CardType.ACCIDENT);
                    break;
                  case CardType.FUEL_TANK:
                    updatedBattlePile = updatedBattlePile.filter(c => c.type !== CardType.OUT_OF_GAS);
                    break;
                  case CardType.PUNCTURE_PROOF:
                    updatedBattlePile = updatedBattlePile.filter(c => c.type !== CardType.FLAT_TIRE);
                    break;
                  case CardType.RIGHT_OF_WAY:
                    updatedBattlePile = updatedBattlePile.filter(c => c.type !== CardType.STOP);
                    updatedSpeedPile = [];
                    break;
                }

                return {
                    ...player,
                    hand: newHand,
                    safetyPile: [...player.safetyPile, card],
                    battlePile: updatedBattlePile,
                    speedPile: updatedSpeedPile
                  };
                }
                return player;
              }),
              messages: [...state.messages, message]
            };
            
          case CardCategory.DISTANCE:
            // Distance cards are played on self
            if (targetPlayer.id !== currentPlayer.id) {
              return {
                ...state,
                messages: [...state.messages, {
                  id: `msg-${Date.now()}`,
                  text: 'Cannot play distance cards on other players!',
                  type: 'error',
                  timestamp: Date.now()
                }]
              };
            }
            
            // Check if player can play distance cards (must have a Roll card and no hazards)
            const canPlayDistance = currentPlayer.battlePile.some(c => c.type === CardType.ROLL) &&
              !currentPlayer.battlePile.some(c => 
                c.type === CardType.ACCIDENT || 
                c.type === CardType.OUT_OF_GAS || 
                c.type === CardType.FLAT_TIRE || 
                c.type === CardType.STOP
              );
              
            if (!canPlayDistance) {
              return {
                ...state,
                messages: [...state.messages, {
                  id: `msg-${Date.now()}`,
                  text: 'Cannot play distance card without a Roll card or with active hazards!',
                  type: 'error',
                  timestamp: Date.now()
                }]
              };
            }
            
            // Check if the distance card exceeds speed limit
            const hasSpeedLimit = currentPlayer.speedPile.some(c => c.type === CardType.SPEED_LIMIT);
            const distanceValue = parseInt(card.value || '0');
            
            if (hasSpeedLimit && distanceValue > 50) {
              return {
                ...state,
                messages: [...state.messages, {
                  id: `msg-${Date.now()}`,
                  text: 'Cannot play distance card that exceeds the speed limit of 50!',
                  type: 'error',
                  timestamp: Date.now()
                }]
              };
            }
            
            // Check if this would push the player over 1000 miles
            const newMileage = currentPlayer.mileage + distanceValue;
            const exceedsMileageLimit = newMileage > 1000;
            
            if (exceedsMileageLimit) {
              return {
                ...state,
                messages: [...state.messages, {
                  id: `msg-${Date.now()}`,
                  text: 'This distance card would exceed the 1000-mile limit!',
                  type: 'error',
                  timestamp: Date.now()
                }]
              };
            }
            
            // Apply the distance card
            message = {
              id: `msg-${Date.now()}`,
              text: `${currentPlayer.name} played ${card.name} and moved ${distanceValue} miles!`,
              type: 'action',
              timestamp: Date.now()
            };
            
            const updatedPlayers = state.players.map((player, index) => {
              if (index === state.currentPlayerIndex) {
                return {
                  ...player,
                  hand: newHand,
                  distancePile: [...player.distancePile, card],
                  mileage: player.mileage + distanceValue
                };
              }
              return player;
            });
            
            // Check if player has reached 1000 miles (winner)
            const winningPlayer = updatedPlayers.find(p => p.mileage >= 1000);
            
            if (winningPlayer) {
              return {
                ...state,
                players: updatedPlayers,
                gameStatus: 'ended',
                winner: winningPlayer.id,
                messages: [...state.messages, message, {
                  id: `msg-${Date.now()}`,
                  text: `${winningPlayer.name} has reached 1000 miles and won the game!`,
                  type: 'system',
                  timestamp: Date.now()
                }]
              };
            }
            
            return {
              ...state,
              players: updatedPlayers,
              messages: [...state.messages, message]
            };
            
          default:
            return state;
        }
      });
    },
    
    // Discard a card without playing it
    discardCard: (cardIndex: number) => {
      gameState.update(state => {
        const currentPlayer = state.players[state.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];
        
        if (!card) {
          return state;
        }
        
        // Remove card from hand
        const newHand = [...currentPlayer.hand];
        newHand.splice(cardIndex, 1);
        
        const message: GameMessage = {
          id: `msg-${Date.now()}`,
          text: `${currentPlayer.name} discarded a card.`,
          type: 'action',
          timestamp: Date.now()
        };
        
        return {
          ...state,
          discardPile: [...state.discardPile, card],
          players: state.players.map((player, index) => {
            if (index === state.currentPlayerIndex) {
              return { ...player, hand: newHand };
            }
            return player;
          }),
          messages: [...state.messages, message]
        };
      });
    },
    
    // End current player's turn and move to next player
    endTurn: () => {
      gameState.update(state => {
        // Find next player index
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        
        const message: GameMessage = {
          id: `msg-${Date.now()}`,
          text: `${state.players[state.currentPlayerIndex].name}'s turn ended. It's now ${state.players[nextPlayerIndex].name}'s turn.`,
          type: 'system',
          timestamp: Date.now()
        };
        
        return {
          ...state,
          currentPlayerIndex: nextPlayerIndex,
          turnStartTime: Date.now(),
          players: state.players.map((player, index) => ({
            ...player,
            isActive: index === nextPlayerIndex
          })),
          messages: [...state.messages, message]
        };
      });
    },
    
    // Check if turn time limit has been exceeded
    checkTimeLimit: () => {
      gameState.update(state => {
        const currentTime = Date.now();
        const timePassed = (currentTime - state.turnStartTime) / 1000;
        
        if (timePassed > state.turnTimeLimit) {
          // Time's up, force end turn
          const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
          
          const message: GameMessage = {
            id: `msg-${Date.now()}`,
            text: `Time's up for ${state.players[state.currentPlayerIndex].name}! Turn automatically ended.`,
            type: 'system',
            timestamp: Date.now()
          };
          
          return {
            ...state,
            currentPlayerIndex: nextPlayerIndex,
            turnStartTime: currentTime,
            players: state.players.map((player, index) => ({
              ...player,
              isActive: index === nextPlayerIndex
            })),
            messages: [...state.messages, message]
          };
        }
        
        return state;
      });
    },
    
    // Calculate scores at the end of the game
    calculateFinalScores: () => {
      gameState.update(state => {
        const playersWithScores = state.players.map(player => {
          // Base points: 1 point per mile
          let score = player.mileage;
          
          // Bonus for completing the trip (1000 miles)
          if (player.mileage >= 1000) {
            score += 400;
          }
          
          // Bonus for each safety card: 100 points
          score += player.safetyPile.length * 100;
          
          // Bonus for all 4 safety cards: 300 additional points
          const hasDrivingAce = player.safetyPile.some(c => c.type === CardType.DRIVING_ACE);
          const hasFuelTank = player.safetyPile.some(c => c.type === CardType.FUEL_TANK);
          const hasPunctureProof = player.safetyPile.some(c => c.type === CardType.PUNCTURE_PROOF);
          const hasRightOfWay = player.safetyPile.some(c => c.type === CardType.RIGHT_OF_WAY);
          
          if (hasDrivingAce && hasFuelTank && hasPunctureProof && hasRightOfWay) {
            score += 300;
          }
          
          // Delayed action (coup fourré) bonus - would be implemented if we tracked this event
          
          return {
            ...player,
            score
          };
        });
        
        const messages = [
          ...state.messages,
          {
            id: `msg-${Date.now()}`,
            text: 'Final scores calculated!',
            type: 'system',
            timestamp: Date.now()
          },
          ...playersWithScores.map(player => ({
            id: `msg-${Date.now()}-${player.id}`,
            text: `${player.name}: ${player.score} points`,
            type: 'info' as const,
            timestamp: Date.now()
          }))
        ];
        
        return {
          ...state,
          players: playersWithScores,
          messages
        };
      });
    },
    
    // Reset the game
    resetGame: () => {
      gameState.set({
        gameId: '',
        players: [],
        drawPile: [],
        discardPile: [],
        currentPlayerIndex: 0,
        gameStatus: 'waiting',
        winner: null,
        messages: [],
        turnStartTime: 0,
        turnTimeLimit: 30
      });
    }
  };
  
  // Additional utility functions for checking game state
  export const gameUtils = {
    // Check if a player can play distance cards
    canPlayDistance: (player: PlayerState): boolean => {
      return player.battlePile.some(c => c.type === CardType.ROLL) &&
        !player.battlePile.some(c => 
          c.type === CardType.ACCIDENT || 
          c.type === CardType.OUT_OF_GAS || 
          c.type === CardType.FLAT_TIRE || 
          c.type === CardType.STOP
        );
    },
    
    // Check if a player is affected by speed limit
    hasSpeedLimit: (player: PlayerState): boolean => {
      return player.speedPile.some(c => c.type === CardType.SPEED_LIMIT) &&
        !player.safetyPile.some(c => c.type === CardType.RIGHT_OF_WAY);
    },
    
    // Check distance card is valid to play (considering speed limit)
    isValidDistanceCard: (player: PlayerState, card: Card): boolean => {
      const hasSpeedLimit = gameUtils.hasSpeedLimit(player);
      const distanceValue = parseInt(card.value || '0');
      
      if (hasSpeedLimit && distanceValue > 50) {
        return false;
      }
      
      const newMileage = player.mileage + distanceValue;
      return newMileage <= 1000;
    },
    
    // Get max distance card a player can play
    getMaxPlayableDistance: (player: PlayerState): number => {
      const hasSpeedLimit = gameUtils.hasSpeedLimit(player);
      const remainingMiles = 1000 - player.mileage;
      
      return hasSpeedLimit ? Math.min(50, remainingMiles) : remainingMiles;
    },
    
    // Check if a remedy can be applied
    canApplyRemedy: (player: PlayerState, remedyType: CardType): boolean => {
      switch (remedyType) {
        case CardType.REPAIRS:
          return player.battlePile.some(c => c.type === CardType.ACCIDENT);
        case CardType.GASOLINE:
          return player.battlePile.some(c => c.type === CardType.OUT_OF_GAS);
        case CardType.SPARE_TIRE:
          return player.battlePile.some(c => c.type === CardType.FLAT_TIRE);
        case CardType.END_OF_LIMIT:
          return player.speedPile.some(c => c.type === CardType.SPEED_LIMIT);
        case CardType.ROLL:
          return player.battlePile.some(c => c.type === CardType.STOP) ||
                 player.battlePile.length === 0;
        default:
          return false;
      }
    },
    
    // Check for immunity against hazards
    hasImmunityAgainst: (player: PlayerState, hazardType: CardType): boolean => {
      switch (hazardType) {
        case CardType.ACCIDENT:
          return player.safetyPile.some(c => c.type === CardType.DRIVING_ACE);
        case CardType.OUT_OF_GAS:
          return player.safetyPile.some(c => c.type === CardType.FUEL_TANK);
        case CardType.FLAT_TIRE:
          return player.safetyPile.some(c => c.type === CardType.PUNCTURE_PROOF);
        case CardType.STOP:
        case CardType.SPEED_LIMIT:
          return player.safetyPile.some(c => c.type === CardType.RIGHT_OF_WAY);
        default:
          return false;
      }
    },
    
    // Get all possible moves for a player
    getPossibleMoves: (player: PlayerState, opponents: PlayerState[]): string[] => {
      const moves: string[] = [];
      
      // Always can discard a card
      moves.push('discard');
      
      if (gameUtils.canPlayDistance(player)) {
        moves.push('playDistance');
      }
      
      player.hand.forEach(card => {
        switch (card.category) {
          case CardCategory.REMEDY:
            if (gameUtils.canApplyRemedy(player, card.type)) {
              moves.push(`playRemedy:${card.type}`);
            }
            break;
          case CardCategory.SAFETY:
            moves.push(`playSafety:${card.type}`);
            break;
          case CardCategory.HAZARD:
            opponents.forEach(opponent => {
              if (!gameUtils.hasImmunityAgainst(opponent, card.type)) {
                moves.push(`playHazard:${card.type}:${opponent.id}`);
              }
            });
            break;
        }
      });
      
      return moves;
    },
    
    // Get turn time remaining in seconds
    getTurnTimeRemaining: (turnStartTime: number, turnTimeLimit: number): number => {
      const elapsed = (Date.now() - turnStartTime) / 1000;
      return Math.max(0, turnTimeLimit - elapsed);
    }
  };