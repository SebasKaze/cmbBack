// socketManager.js
import { WebSocketServer } from 'ws';

const activeSessions = new Map(); // userId => ws

export const initWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log(' Cliente WebSocket conectado');

        ws.on('message', (data) => {
            try {
                const { userId } = JSON.parse(data);
                if (!userId) return;

                const previousWS = activeSessions.get(userId);
                if (previousWS && previousWS !== ws) {
                    console.log(`🔒 Detectada sesión previa para usuario ${userId}, cerrando la anterior...`);

                    if (previousWS.readyState === previousWS.OPEN) {
                        previousWS.send(JSON.stringify({
                            type: 'logout',
                            reason: 'Nueva sesión iniciada en otro dispositivo.',
                        }));
                        previousWS.close();
                        console.log(`✅ Sesión anterior de usuario ${userId} cerrada.`);
                    }
                }

                activeSessions.set(userId, ws);

                ws.on('close', () => {
                    if (activeSessions.get(userId) === ws) {
                        activeSessions.delete(userId);
                        console.log(`❌ Sesión cerrada para usuario ${userId}`);
                    }
                });
            } catch (err) {
                console.error('❗ Error al procesar mensaje WebSocket:', err);
            }
        });
    });
};

// ⚠️ Esto permite acceder al mapa desde otras partes (como login)
export const notifyLogout = (userId) => {
    const ws = activeSessions.get(userId);
    if (ws && ws.readyState === ws.OPEN) {
        console.log(`📣 Forzando cierre de sesión para usuario ${userId}`);
        ws.send(JSON.stringify({
            type: 'logout',
            reason: 'Sesión cerrada desde otro inicio de sesión.',
        }));
        ws.close();
    }
    activeSessions.delete(userId);
};