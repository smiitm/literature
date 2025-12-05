import { socket } from '../socket';

const STORAGE_KEY = 'lit_game_session';
const PLAYER_ID_KEY = 'lit_player_id';

interface SessionData {
    roomId: string;
    playerName: string;
    playerId: string;
}

function generatePlayerId(): string {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);

    if (!playerId) {
        playerId = crypto.randomUUID();
        localStorage.setItem(PLAYER_ID_KEY, playerId);
    }

    return playerId;
}

export function getPlayerId(): string {
    return generatePlayerId();
}

export function connectSocket(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket.connected) {
            resolve();
            return;
        }

        const timer = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
        }, timeout);

        socket.connect();
        socket.once('connect', () => {
            clearTimeout(timer);
            resolve();
        });
    });
}

export function disconnectSocket() {
    if (socket.connected) {
        const session = getSession();
        if (session) {
            socket.emit('leave_room', { roomId: session.roomId });
        }
    }

    socket.disconnect();
    clearSession();

    // Broadcast to other tabs that we've left
    localStorage.setItem('lit_leave_room', Date.now().toString());
}

export function saveSession(roomId: string, playerName: string) {
    const playerId = getPlayerId();
    const data: SessionData = { roomId, playerName, playerId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSession(): SessionData | null {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        localStorage.removeItem(STORAGE_KEY); 
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}
