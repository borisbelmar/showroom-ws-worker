import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  WEBSOCKET_ROOM: DurableObjectNamespace;
  SHOWROOM_KV: KVNamespace;
};

// Aplicación Hono
const app = new Hono<{ Bindings: Bindings }>();

// Configurar CORS abierto para todos los endpoints
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// TTL para datos en KV (1 día en segundos)
const KV_TTL_SECONDS = 24 * 60 * 60; // 86400 segundos = 1 día

// Función para generar clave de KV por token
const getLastCardKey = (token: string): string => `last_card:${token}`;
const getLastBackgroundKey = (token: string): string => `last_background:${token}`;

// Función para validar color hexadecimal
const isValidHexColor = (color: string): boolean => {
  if (!color) return false;
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

// Durable Object para manejar las conexiones WebSocket por token
export class WebSocketRoom {
  private clients: Set<WebSocket>;
  private env: Bindings;
  private token: string;

  constructor(state: DurableObjectState, env: Bindings) {
    this.clients = new Set();
    this.env = env;
    this.token = ''; // Se establecerá en el primer fetch
  }

  async fetch(request: Request): Promise<Response> {
    // Extraer token de la URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const tokenFromPath = pathParts[1]; // /{token}
    
    if (!tokenFromPath) {
      return new Response('Token required', { status: 400 });
    }
    
    // Establecer el token para esta instancia
    if (!this.token) {
      this.token = tokenFromPath;
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Aceptar la conexión WebSocket
    server.accept();
    
    // Agregar cliente al conjunto
    this.clients.add(server);
    console.log(`🔌 WebSocket connection opened for token ${this.token}. Total clients:`, this.clients.size);

    // Manejar mensajes
    server.addEventListener('message', async (event) => {
      const raw = event.data.toString();
      console.log(`📩 Received message for token ${this.token}:`, raw);

      let messageData;
      try {
        messageData = JSON.parse(raw);
      } catch (err) {
        console.error('❌ Invalid JSON:', err);
        return;
      }

      let outgoing: string | null = null;

      if (messageData.type === 'card') {
        // Guardar la última carta en KV con TTL
        if (this.env?.SHOWROOM_KV) {
          await this.saveLastCard(messageData.card);
        }
        
        outgoing = JSON.stringify({
          type: 'card',
          card: messageData.card,
        });
      } else if (messageData.type === 'background') {
        // Validar backgroundColor
        if (!messageData.backgroundColor || !isValidHexColor(messageData.backgroundColor)) {
          console.error('❌ Invalid hex color format:', messageData.backgroundColor);
          // Enviar error de vuelta al cliente
          server.send(JSON.stringify({
            type: 'error',
            message: 'Invalid backgroundColor format. Use hex format like #FF0000 or #F00'
          }));
          return;
        }

        // Guardar el backgroundColor en KV con TTL
        if (this.env?.SHOWROOM_KV) {
          await this.saveLastBackground(messageData.backgroundColor);
        }
        
        outgoing = JSON.stringify({
          type: 'background',
          backgroundColor: messageData.backgroundColor,
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
      console.log(`❎ WebSocket connection closed for token ${this.token}. Total clients:`, this.clients.size);
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

  // Método para guardar la última carta en KV con TTL por token
  private async saveLastCard(card: string): Promise<void> {
    try {
      const cardData = {
        card,
        timestamp: new Date().toISOString(),
        version: 1
      };
      
      const key = getLastCardKey(this.token);
      await this.env.SHOWROOM_KV.put(key, JSON.stringify(cardData), {
        expirationTtl: KV_TTL_SECONDS
      });
      console.log(`💾 Last card saved to KV for token ${this.token}:`, card);
    } catch (error) {
      console.error(`❌ Error saving card to KV for token ${this.token}:`, error);
    }
  }

  // Método para guardar el último background color en KV con TTL por token
  private async saveLastBackground(backgroundColor: string): Promise<void> {
    try {
      const backgroundData = {
        backgroundColor,
        timestamp: new Date().toISOString(),
        version: 1
      };
      
      const key = getLastBackgroundKey(this.token);
      await this.env.SHOWROOM_KV.put(key, JSON.stringify(backgroundData), {
        expirationTtl: KV_TTL_SECONDS
      });
      console.log(`🎨 Last background saved to KV for token ${this.token}:`, backgroundColor);
    } catch (error) {
      console.error(`❌ Error saving background to KV for token ${this.token}:`, error);
    }
  }

  // Método para limpiar la última carta en KV por token
  private async clearLastCard(): Promise<void> {
    try {
      const key = getLastCardKey(this.token);
      await this.env.SHOWROOM_KV.delete(key);
      console.log(`🗑️ Last card cleared from KV for token ${this.token}`);
    } catch (error) {
      console.error(`❌ Error clearing card from KV for token ${this.token}:`, error);
    }
  }
}

// Ruta de health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para obtener la última carta por token
app.get('/api/:token/last-card', async (c) => {
  try {
    const token = c.req.param('token');
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const key = getLastCardKey(token);
    const lastCardData = await c.env.SHOWROOM_KV.get(key);
    
    if (!lastCardData) {
      return c.json({
        message: 'No card found',
        card: null,
        timestamp: null
      });
    }

    let cardInfo;
    try {
      cardInfo = JSON.parse(lastCardData);
    } catch (error) {
      console.error('❌ Error retrieving last card:', error);
      return c.json({ 
        error: 'Invalid card data found',
        message: 'The stored card data is corrupted'
      }, 500);
    }

    return c.json({
      message: 'Last card retrieved successfully',
      ...cardInfo
    });
  } catch (error) {
    console.error('❌ Error in GET /api/:token/last-card:', error);
    return c.json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve last card'
    }, 500);
  }
});

// Endpoint para obtener el último background color por token
app.get('/api/:token/last-background', async (c) => {
  try {
    const token = c.req.param('token');
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const key = getLastBackgroundKey(token);
    const lastBackgroundData = await c.env.SHOWROOM_KV.get(key);
    
    if (!lastBackgroundData) {
      return c.json({
        message: 'No background found',
        backgroundColor: null,
        timestamp: null
      });
    }

    let backgroundInfo;
    try {
      backgroundInfo = JSON.parse(lastBackgroundData);
    } catch (error) {
      console.error('❌ Error retrieving last background:', error);
      return c.json({ 
        error: 'Invalid background data found',
        message: 'The stored background data is corrupted'
      }, 500);
    }

    return c.json({
      message: 'Last background retrieved successfully',
      ...backgroundInfo
    });
  } catch (error) {
    console.error('❌ Error in GET /api/:token/last-background:', error);
    return c.json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve last background'
    }, 500);
  }
});

// Endpoint para limpiar el último background color por token
app.delete('/api/:token/last-background', async (c) => {
  try {
    const token = c.req.param('token');
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const key = getLastBackgroundKey(token);
    await c.env.SHOWROOM_KV.delete(key);
    return c.json({ 
      message: 'Last background cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing last background:', error);
    return c.json({ 
      error: 'Failed to clear last background',
      message: 'Internal server error' 
    }, 500);
  }
});

// Endpoint para limpiar la última carta manualmente por token
app.delete('/api/:token/last-card', async (c) => {
  try {
    const token = c.req.param('token');
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const key = getLastCardKey(token);
    await c.env.SHOWROOM_KV.delete(key);
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

// Ruta WebSocket con token - DEBE IR AL FINAL
app.get('/:token', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const token = c.req.param('token');
  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  // Crear ID único para el Durable Object basado en el token
  const id = c.env.WEBSOCKET_ROOM.idFromName(token);
  const stub = c.env.WEBSOCKET_ROOM.get(id);
  
  return stub.fetch(c.req.raw);
});

export default {
  fetch: app.fetch,
};
