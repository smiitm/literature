import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { socket } from './socket';
import { ThemeProvider } from './components/theme-provider';

interface Player {
  id: string;
  name: string;
  team: 'A' | 'B' | null;
  isOwner: boolean;
  hand: any[];
}

function App() {
  const [gameState, setGameState] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myTeam, setMyTeam] = useState<'A' | 'B' | null>(null);
  const [hand, setHand] = useState<any[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);

  useEffect(() => {
    socket.on('joined_game', ({ roomId }) => {
      setRoomId(roomId);
    });

    socket.on('game_created', ({ roomId }) => {
      setRoomId(roomId);
    });

    socket.on('player_update', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('game_started_personal', (data) => {
      setHand(data.hand);
      setTurnIndex(data.turnIndex);
      setPlayers(data.players);
      setMyTeam(data.myTeam);
      setGameState('GAME');
    });

    return () => {
      socket.off('joined_game');
      socket.off('game_created');
      socket.off('player_update');
      socket.off('game_started_personal');
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {gameState === 'LOBBY' ? (
        <Lobby roomId={roomId} players={players} />
      ) : (
        <Game
          initialHand={hand}
          initialTurnIndex={turnIndex}
          initialPlayers={players}
          myTeam={myTeam}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
