import { Hono } from 'hono';

type Bindings = {
  WEBSOCKET_ROOM: DurableObjectNamespace;
};

// Aplicación Hono
const app = new Hono<{ Bindings: Bindings }>();

// Durable Object para manejar las conexiones WebSocket
export class WebSocketRoom {
  private clients: Set<WebSocket>;

  constructor() {
    this.clients = new Set();
  }

  async fetch(_request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Aceptar la conexión WebSocket
    server.accept();
    
    // Agregar cliente al conjunto
    this.clients.add(server);
    console.log('🔌 WebSocket connection opened. Total clients:', this.clients.size);

    // Manejar mensajes
    server.addEventListener('message', (event) => {
      const raw = event.data.toString();
      console.log('📩 Received message:', raw);

      let messageData;
      try {
        messageData = JSON.parse(raw);
      } catch (err) {
        console.error('❌ Invalid JSON:', err);
        return;
      }

      let outgoing: string | null = null;

      if (messageData.type === 'card') {
        outgoing = JSON.stringify({
          type: 'card',
          card: messageData.card,
        });
      } else if (messageData.type === 'clear') {
        outgoing = JSON.stringify({ type: 'clear' });
      }

      // Broadcast a todos los clientes conectados
      if (outgoing) {
        this.broadcast(outgoing);
      }
    });

    // Manejar cierre de conexión
    server.addEventListener('close', () => {
      this.clients.delete(server);
      console.log('❎ WebSocket connection closed. Total clients:', this.clients.size);
    });

    // Manejar errores
    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Método para hacer broadcast a todos los clientes
  private broadcast(message: string) {
    for (const client of this.clients) {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      } catch (error) {
        console.error('Error sending message to client:', error);
        this.clients.delete(client);
      }
    }
  }
}

// Ruta WebSocket principal
app.get('/', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  // Obtener una instancia del Durable Object
  const id = c.env.WEBSOCKET_ROOM.idFromName('room');
  const room = c.env.WEBSOCKET_ROOM.get(id);
  
  return room.fetch(c.req.raw);
});

// Ruta de health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default {
  fetch: app.fetch,
};
