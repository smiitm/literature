import { useState, useEffect } from 'react';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { socket } from './socket';
import { connectSocket, getSession, getPlayerId } from './lib/socketManager';
import { ThemeProvider } from './components/theme-provider';
import type { Player } from './types';

function App() {
  const [gameState, setGameState] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myTeam, setMyTeam] = useState<'A' | 'B' | null>(null);
  const [hand, setHand] = useState<any[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState(true);

  // Auto-reconnect to saved session on page load
  useEffect(() => {
    const initializeSession = async () => {
      const session = getSession();

      if (session) {
        try {
          await connectSocket();

          const playerId = getPlayerId();
          socket.emit('join_game', {
            roomCode: session.roomId,
            playerName: session.playerName,
            playerId
          });
        } catch (err) {
          console.error('Failed to reconnect:', err);
        }
      }

      setIsReconnecting(false);
    };

    initializeSession();
  }, []);

  // Listen for leave room events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lit_leave_room') {
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Show loading during reconnection
  if (isReconnecting) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="text-2xl font-semibold">Reconnecting...</div>
        </div>
      </ThemeProvider>
    );
  }

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
          roomId={roomId}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
