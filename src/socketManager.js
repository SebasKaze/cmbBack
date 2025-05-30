import { WebSocketServer } from 'ws';

const activeSessions = new Map(); // userId => ws

export const initWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        ws.on('message', (data) => {
            try {
                const { userId } = JSON.parse(data);

                // Si ya hay una sesión activa, ciérrala
                const previousWS = activeSessions.get(userId);
                if (previousWS && previousWS !== ws) {
                    previousWS.send(JSON.stringify({ type: 'logout', reason: 'Nueva sesión iniciada en otro dispositivo.' }));
                    previousWS.close();
                }

                activeSessions.set(userId, ws);

                ws.on('close', () => {
                    if (activeSessions.get(userId) === ws) {
                        activeSessions.delete(userId);
                    }
                });
            } catch (err) {
                console.error('Error parsing WebSocket data:', err);
            }
        });
    });

    return wss;
};

export const notifyLogout = (userId) => {
    const ws = activeSessions.get(userId);
    if (ws) {
        ws.send(JSON.stringify({ type: 'logout', reason: 'Sesión cerrada desde otro lado.' }));
        ws.close();
        activeSessions.delete(userId);
    }
};