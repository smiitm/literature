# Literature Game Server

A Socket.IO-based backend for the Literature card game.

## Tech Stack

- **Node.js** with TypeScript
- **Socket.IO** for real-time communication

## Project Structure

```
server/
├── src/
│   ├── index.ts          # Entry point - Express & Socket.IO setup
│   ├── socketHandlers.ts # All socket event handlers
│   ├── types.ts          # TypeScript interfaces
│   └── utils.ts          # Utility functions
├── package.json
└── tsconfig.json
```

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create_game` | `{ playerName, playerId }` | Create a new game room |
| `join_game` | `{ roomCode, playerName, playerId }` | Join existing room or reconnect |
| `start_game` | `{ roomId }` | Start the game (owner only) |
| `ask_card` | `{ roomId, targetId, card }` | Ask opponent for a card |
| `declare_set` | `{ roomId, declaration }` | Declare a set |
| `pass_turn` | `{ roomId, targetId }` | Pass turn to teammate (when no cards) |
| `leave_room` | `{ roomId }` | Leave the current room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `game_created` | `{ roomId }` | Room created successfully |
| `joined_game` | `{ roomId }` | Joined room successfully |
| `player_update` | `Player[]` | Players list updated (lobby) |
| `game_started` | `{ turnIndex, players }` | Game has started |
| `game_started_personal` | `{ hand, turnIndex, players, myTeam }` | Personal game data |
| `game_update` | `GameUpdatePayload` | Game state update |
| `player_disconnected` | `{ playerId, playerName }` | A player disconnected |
| `error` | `{ message }` | Error occurred |

## Data Types

### Card
```typescript
interface Card {
    suit: 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'Red' | 'Black';
}
```

### Player
```typescript
interface Player {
    id: string;         // socket.id - changes on reconnect
    playerId: string;   // persistent UUID - stays same across reconnects
    name: string;
    hand: Card[];
    team: 'A' | 'B' | null;
    isOwner: boolean;
}
```

### GameState
```typescript
interface GameState {
    roomId: string;
    status: 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
    players: Player[];
    gameData: {
        turnIndex: number;
        log: string[];
        teams: { A: TeamState; B: TeamState };
        lastAsk?: LastAsk;
        completedSets: completedSet[];
        turnState: 'NORMAL' | 'PASSING_TURN';
        winner?: 'A' | 'B' | 'DRAW';
    };
}
```

## Key Implementation Details

### Room Management
- Rooms stored in `Map<string, GameState>` for O(1) lookup
- 6-digit room codes generated randomly
- Empty rooms are automatically deleted

### Player Reconnection
- Players identified by persistent `playerId` (UUID stored client-side)
- On reconnect, socket.id is updated but player data preserved
- Reconnecting players receive current game state


## Utility Functions

| Function | Description |
|----------|-------------|
| `generateRoomId()` | Creates 6-digit room code |
| `generateDeck()` | Creates 54-card deck |
| `shuffleArray(array)` | Fisher-Yates shuffle |
| `assignTeams(players)` | Alternating A/B team assignment |
| `distributeCards(deck, players)` | Round-robin card distribution |
| `getSetName(card)` | Returns set name for a card |
| `getSetCards(setName)` | Returns all cards in a set |
