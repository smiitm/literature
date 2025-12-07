import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { socket } from './socket';
import { connectSocket, getSession, getPlayerId, saveSession, clearSession } from './lib/socketManager';
import { ThemeProvider } from './components/ui/theme-provider';
import { Toaster, toast } from './components/ui/sonner';
import type { Player } from './types';

type GameState = 'HOME' | 'LOBBY' | 'GAME';

function App() {
  const [gameState, setGameState] = useState<GameState>('HOME');
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
          clearSession();
          toast.error('Failed to reconnect to session. Please join again.');
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
    socket.on('joined_game', ({ roomId, playerName }) => {
      setRoomId(roomId);
      saveSession(roomId, playerName);
      setGameState('LOBBY');
      toast.success('Joined room successfully');
    });

    socket.on('game_created', ({ roomId, playerName }) => {
      setRoomId(roomId);
      saveSession(roomId, playerName);
      setGameState('LOBBY');
      toast.success('Room created successfully');
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
      toast.success('Game started!');
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    socket.on('player_disconnected', ({ playerName }) => {
      toast.warning(`${playerName} disconnected`);
    });

    return () => {
      socket.off('joined_game');
      socket.off('game_created');
      socket.off('player_update');
      socket.off('game_started_personal');
      socket.off('error');
      socket.off('player_disconnected');
    };
  }, []);

  // Show loading during reconnection
  if (isReconnecting) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="text-2xl font-semibold">Reconnecting...</div>
        </div>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {gameState === 'HOME' && <Home />}
      {gameState === 'LOBBY' && <Lobby roomId={roomId} players={players} />}
      {gameState === 'GAME' && (
        <Game
          initialHand={hand}
          initialTurnIndex={turnIndex}
          initialPlayers={players}
          myTeam={myTeam}
          roomId={roomId}
        />
      )}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export default App;
