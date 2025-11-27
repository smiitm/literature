import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { socket } from './socket';

interface Card {
  suit: 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
  rank: string;
}

interface Player {
  id: string;
  name: string;
  team: 'A' | 'B' | null;
  isOwner: boolean;
}

function App() {
  const [gameState, setGameState] = useState<'LOBBY' | 'IN_GAME'>('LOBBY');
  const [initialHand, setInitialHand] = useState<Card[]>([]);
  const [initialTurnIndex, setInitialTurnIndex] = useState(0);
  const [initialPlayers, setInitialPlayers] = useState<Player[]>([]);
  const [myTeam, setMyTeam] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    socket.on('game_started_personal', ({ hand, turnIndex, players, myTeam }) => {
      setInitialHand(hand);
      setInitialTurnIndex(turnIndex);
      setInitialPlayers(players);
      setMyTeam(myTeam);
      setGameState('IN_GAME');
    });

    return () => {
      socket.off('game_started_personal');
    };
  }, []);

  return (
    <>
      {gameState === 'LOBBY' && <Lobby />}
      {gameState === 'IN_GAME' && (
        <Game
          initialHand={initialHand}
          initialTurnIndex={initialTurnIndex}
          initialPlayers={initialPlayers}
          myTeam={myTeam}
        />
      )}
    </>
  );
}

export default App;
