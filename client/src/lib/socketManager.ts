import { socket } from '../socket';

const STORAGE_KEY = 'lit_game_session';
const PLAYER_ID_KEY = 'lit_player_id';

interface SessionData {
    roomId: string;
    playerName: string;
    playerId: string;
}

// Generate or retrieve persistent player ID
function generatePlayerId(): string {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);

    if (!playerId) {
        // Generate UUID v4
        playerId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem(PLAYER_ID_KEY, playerId);
    }

    return playerId;
}

export function getPlayerId(): string {
    return generatePlayerId();
}

export function connectSocket(): Promise<void> {
    return new Promise((resolve) => {
        if (socket.connected) {
            resolve();
            return;
        }

        socket.connect();
        socket.once('connect', () => {
            resolve();
        });
    });
}

export function disconnectSocket() {
    // Emit leave_room event before disconnecting
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
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}
