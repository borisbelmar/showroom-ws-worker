import { Hono } from 'hono';

type Bindings = {
  WEBSOCKET_ROOM: DurableObjectNamespace;
  SHOWROOM_KV: KVNamespace;
};

// Aplicación Hono
const app = new Hono<{ Bindings: Bindings }>();

// Constante para la clave de la última carta en KV
const LAST_CARD_KEY = 'last_card';

// Durable Object para manejar las conexiones WebSocket
export class WebSocketRoom {
  private clients: Set<WebSocket>;
  private env: Bindings;

  constructor(state: DurableObjectState, env: Bindings) {
    this.clients = new Set();
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Aceptar la conexión WebSocket
    server.accept();
    
    // Agregar cliente al conjunto
    this.clients.add(server);
    console.log('🔌 WebSocket connection opened. Total clients:', this.clients.size);

    // Manejar mensajes
    server.addEventListener('message', async (event) => {
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
        // Guardar la última carta en KV
        if (this.env?.SHOWROOM_KV) {
          await this.saveLastCard(messageData.card);
        }
        
        outgoing = JSON.stringify({
          type: 'card',
          card: messageData.card,
        });
      } else if (messageData.type === 'clear') {
        // Limpiar la última carta en KV
        if (this.env?.SHOWROOM_KV) {
          await this.clearLastCard();
        }
        
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

  // Método para guardar la última carta en KV
  private async saveLastCard(card: any): Promise<void> {
    try {
      const cardData = {
        card,
        timestamp: new Date().toISOString(),
        version: 1
      };
      await this.env.SHOWROOM_KV.put(LAST_CARD_KEY, JSON.stringify(cardData));
      console.log('💾 Last card saved to KV:', card);
    } catch (error) {
      console.error('❌ Error saving card to KV:', error);
    }
  }

  // Método para limpiar la última carta en KV
  private async clearLastCard(): Promise<void> {
    try {
      await this.env.SHOWROOM_KV.delete(LAST_CARD_KEY);
      console.log('🗑️ Last card cleared from KV');
    } catch (error) {
      console.error('❌ Error clearing card from KV:', error);
    }
  }
}

// Ruta WebSocket principal
app.get('/', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  // Obtener una instancia del Durable Object y pasar el env usando headers
  const id = c.env.WEBSOCKET_ROOM.idFromName('room');
  const room = c.env.WEBSOCKET_ROOM.get(id);
  
  // Crear un request wrapper que incluya referencias al env
  const requestWithEnv = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  
  // El Durable Object recibirá el env en su constructor automáticamente
  return room.fetch(requestWithEnv);
});

// Endpoint para obtener la última carta
app.get('/api/last-card', async (c) => {
  try {
    const lastCardData = await c.env.SHOWROOM_KV.get(LAST_CARD_KEY);
    
    if (!lastCardData) {
      return c.json({ 
        message: 'No card found',
        card: null,
        timestamp: null 
      }, 404);
    }

    const parsedData = JSON.parse(lastCardData);
    return c.json({
      message: 'Last card retrieved successfully',
      card: parsedData.card,
      timestamp: parsedData.timestamp,
      version: parsedData.version
    });
  } catch (error) {
    console.error('❌ Error retrieving last card:', error);
    return c.json({ 
      error: 'Failed to retrieve last card',
      message: 'Internal server error' 
    }, 500);
  }
});

// Endpoint para limpiar la última carta manualmente
app.delete('/api/last-card', async (c) => {
  try {
    await c.env.SHOWROOM_KV.delete(LAST_CARD_KEY);
    return c.json({ 
      message: 'Last card cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing last card:', error);
    return c.json({ 
      error: 'Failed to clear last card',
      message: 'Internal server error' 
    }, 500);
  }
});

// Ruta de health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default {
  fetch: app.fetch,
};
