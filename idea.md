# **Technical Documentation: Multiplayer Literature Card Game**

## **1\. Executive Summary**

A real-time, multiplayer web application for playing the card game "Literature". The system supports 4-12 players, separated into two teams. It utilizes a lobby system for game creation and joining via unique codes. The application prioritizes low latency and strict server-side validation of game logic.

## **2\. Technology Stack**

### **Frontend (The Client)**

* **Framework:** **React** (via **Vite**).  
* **Language:** **TypeScript**.  
* **Styling:** **Tailwind CSS**.  
* **Component Library:** **shadcn/ui**.  
* **State Management:** **React Context** or **Zustand**.

### **Backend (The Server)**

* **Runtime:** **Node.js**.  
* **Framework:** **Express**.  
* **Communication:** **Socket.io**.  
* **Database:** **In-Memory (RAM)**.

## **3\. Architecture & Data Structures**

Since we aren't using a database, the Server State is the single source of truth.

### **The Game Store (Server-Side)**

interface GameState {  
  roomId: string;  
  status: 'LOBBY' | 'IN\_GAME' | 'GAME\_OVER';  
  players: Player\[\];  
  settings: {  
    maxPlayers: number; // 4, 6, 8, 10, 12  
  };  
  gameData: {  
    deck: Card\[\];        // Remaining cards (if any)  
    turnIndex: number;   // Whose turn is it?  
    teams: {  
      A: { score: number, declaredSets: string\[\] };  
      B: { score: number, declaredSets: string\[\] };  
    };  
    log: string\[\];       // "A asked B for 8 of Hearts"  
    sets: {              // Tracking which sets are live  
       "Low Spades": { owner: null | "Team A" | "Team B", cards: \[\] }  
    }  
  };  
}

interface Player {  
  id: string;      // Socket ID  
  name: string;  
  hand: Card\[\];  
  team: 'A' | 'B';  
  isOwner: boolean;  
}

## **4\. WebSocket Event Protocol**

### **Connection & Lobby Phase**

| Event Name | Direction | Payload | Description |
| :---- | :---- | :---- | :---- |
| create\_game | Client \-\> Server | { playerName } | Server generates a 6-digit Room Code. |
| join\_game | Client \-\> Server | { roomCode, playerName } | Connects player to room. |
| player\_update | Server \-\> Client | \[Player\] | Broadcasts list of players in lobby (for UI). |
| kick\_player | Client \-\> Server | { targetPlayerId } | Owner removes a player. |
| start\_game | Client \-\> Server | {} | Owner initiates the game. |

### **Gameplay Phase**

| Event Name | Direction | Payload | Description |
| :---- | :---- | :---- | :---- |
| game\_started | Server \-\> Client | { hand, turnIndex, teams } | Distributes cards and starts loop. |
| ask\_card | Client \-\> Server | { targetPlayerId, card } | "I ask Player B for 8 of Hearts". |
| transfer\_turn | Server \-\> Client | { nextTurnPlayerId } | If ask fails, turn passes. |
| card\_transfer | Server \-\> Client | { from, to, card } | If ask succeeds, update hands. |
| declare\_set | Client \-\> Server | { declarationMap } | Player attempts to drop a set. |
| game\_over | Server \-\> Client | \`{ winner: 'A' | 'B' }\` |

## **5\. Development Roadmap**

### **Phase 1: The Lobby**

1. Setup Express \+ Socket.io server.  
2. Setup React \+ Tailwind.  
3. Implement create\_game (Generate random Room ID).  
4. Implement join\_game (Store socket ID in a Map).  
5. Show list of players in the lobby in real-time.

### **Phase 2: Core Game Logic**

1. **Card Distribution:** Logic to shuffle deck and split evenly among $N$ players.  
2. **Turn Logic:**  
   * Validating requests (You must have a card of the same suit to ask).  
   * Handling success (Take card, keep turn).  
   * Handling failure (pass turn).  
3. **UI:** Displaying your hand. Visually distinguishing suits.

### **Phase 3: Declarations & Scoring**

1. **The Declaration Modal:** The most complex UI part. User must assign every card in a specific half-suit to a specific player on their team.  
2. **Validation:** Server checks if the assignment is 100% correct.  
   * If correct: Team gets point, cards removed.  
   * If wrong: Opposing team gets point.

## **6\. Security & Anti-Cheat Notes**

* **Never send the full state to everyone:** Only send a player *their specific hand*. A tech-savvy user could inspect the WebSocket network tab and see everyone's cards if you send the whole object.  
* **Validate "Asks":** Ensure the asking player actually possesses a card of the suit they are asking for (a core rule of Literature). Validate this on the server, not just the client.