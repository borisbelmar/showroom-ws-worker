# 🧩 Showroom WebSocket Worker

[![Deploy Status](https://github.com/borisbelmar/showroom-ws-worker/actions/workflows/deploy.yml/badge.svg)](https://github.com/borisbelmar/showroom-ws-worker/actions/workflows/deploy.yml)
[![CI Status](https://github.com/borisbelmar/showroom-ws-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/borisbelmar/showroom-ws-worker/actions/workflows/ci.yml)

Un servidor WebSocket multi-instancia construido con [Cloudflare Workers](https://workers.cloudflare.com/) y [Hono](https://hono.dev/) que permite comunicación en tiempo real para un sistema de showroom de cartas con soporte para múltiples salas independientes.

## ✨ Características

- � **Multi-instancia con Tokens**: Cada token crea una sala independiente
- �🔄 **WebSocket Bidireccional**: Comunicación en tiempo real entre clientes
- 📡 **Broadcasting por Sala**: Los mensajes se envían solo a clientes de la misma sala
- 🎴 **Gestión de Cartas**: Envío y visualización de cartas por sala
- 🎨 **Colores de Fondo**: Gestión independiente de colores de fondo hexadecimales
- 💾 **Persistencia con TTL**: Estado persistente por 24 horas usando Cloudflare KV
- 🧹 **Comando Clear**: Limpia la pantalla de todos los clientes de una sala
- 🏥 **Health Check**: Endpoint de verificación de estado
- ⚡ **Escalabilidad**: Utiliza Durable Objects para manejo de estado distribuido

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Cuenta de Cloudflare
- Wrangler CLI

### Instalación

```bash
# Clonar o usar este directorio
cd showroom-ws-worker

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional para desarrollo local)
cp wrangler.toml.example wrangler.toml

# Desarrollar localmente
npm run dev

# Desplegar a Cloudflare Workers
npm run deploy
```

## 🔧 Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests una vez
npm run test:run

# Ver logs del worker
npm run logs
```

El servidor estará disponible en `http://localhost:8787`

## 📡 API Reference

### WebSocket Connection

Conecta a una sala específica usando un token:

```
ws://localhost:8787/{token}
```

**Ejemplo:**
```javascript
const ws = new WebSocket('ws://localhost:8787/mi-sala-123');
```

### Mensajes WebSocket

#### 1. Enviar Carta
```json
{
  "type": "card",
  "card": "🎭"
}
```

#### 2. Cambiar Color de Fondo
```json
{
  "type": "background",
  "backgroundColor": "#FF0000"
}
```

#### 3. Limpiar Pantalla
```json
{
  "type": "clear"
}
```

### REST API Endpoints

#### Health Check
```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Obtener Última Carta

```http
GET /api/{token}/last-card
```

**Respuesta exitosa:**
```json
{
  "card": "🎭",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": 1
}
```

**Sin carta:**
```json
{
  "message": "No card found",
  "card": null,
  "timestamp": null
}
```

#### Eliminar Última Carta

```http
DELETE /api/{token}/last-card
```

**Respuesta:**
```json
{
  "message": "Last card cleared successfully"
}
```

#### Obtener Último Color de Fondo

```http
GET /api/{token}/last-background
```

**Respuesta exitosa:**
```json
{
  "backgroundColor": "#FF0000",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": 1
}
```

**Sin color:**
```json
{
  "message": "No background found",
  "backgroundColor": null,
  "timestamp": null
}
```

#### Eliminar Último Color de Fondo

```http
DELETE /api/{token}/last-background
```

**Respuesta:**
```json
{
  "message": "Last background cleared successfully"
}
```

## � Ejemplos de Uso

### Cliente JavaScript (Frontend)

```javascript
// Conectar a una sala específica
const token = 'mi-sala-123';
const ws = new WebSocket(`wss://tu-worker.tu-subdominio.workers.dev/${token}`);

ws.onopen = () => {
  console.log('Conectado a la sala:', token);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'card':
      console.log('Nueva carta recibida:', data.card);
      // Mostrar carta en la UI
      break;
    
    case 'background':
      console.log('Nuevo color de fondo:', data.backgroundColor);
      // Cambiar color de fondo
      document.body.style.backgroundColor = data.backgroundColor;
      break;
    
    case 'clear':
      console.log('Limpiar pantalla');
      // Limpiar la UI
      break;
  }
};

// Enviar una carta
function sendCard(emoji) {
  ws.send(JSON.stringify({
    type: 'card',
    card: emoji
  }));
}

// Cambiar color de fondo
function changeBackground(color) {
  ws.send(JSON.stringify({
    type: 'background',
    backgroundColor: color
  }));
}

// Limpiar pantalla
function clearScreen() {
  ws.send(JSON.stringify({
    type: 'clear'
  }));
}

// Ejemplos de uso
sendCard('🎭');
changeBackground('#FF0000');
clearScreen();
```

### Recuperar Estado con API REST

```javascript
// Obtener última carta de una sala
async function getLastCard(token) {
  const response = await fetch(`/api/${token}/last-card`);
  const data = await response.json();
  
  if (data.card) {
    console.log('Última carta:', data.card);
    console.log('Timestamp:', data.timestamp);
  } else {
    console.log('No hay cartas en esta sala');
  }
}

// Obtener último color de fondo
async function getLastBackground(token) {
  const response = await fetch(`/api/${token}/last-background`);
  const data = await response.json();
  
  if (data.backgroundColor) {
    console.log('Último color:', data.backgroundColor);
    document.body.style.backgroundColor = data.backgroundColor;
  }
}

// Limpiar datos de una sala
async function clearRoomData(token) {
  await fetch(`/api/${token}/last-card`, { method: 'DELETE' });
  await fetch(`/api/${token}/last-background`, { method: 'DELETE' });
  console.log('Datos de la sala limpiados');
}
```

### Uso con cURL

```bash
# Obtener última carta
curl "https://tu-worker.tu-subdominio.workers.dev/api/mi-sala-123/last-card"

# Obtener último color de fondo
curl "https://tu-worker.tu-subdominio.workers.dev/api/mi-sala-123/last-background"

# Eliminar última carta
curl -X DELETE "https://tu-worker.tu-subdominio.workers.dev/api/mi-sala-123/last-card"

# Eliminar último color de fondo
curl -X DELETE "https://tu-worker.tu-subdominio.workers.dev/api/mi-sala-123/last-background"

# Health check
curl "https://tu-worker.tu-subdominio.workers.dev/health"
```

## 🔒 Validaciones

### Colores de Fondo
- **Formato válido**: `#RRGGBB` (6 dígitos) o `#RGB` (3 dígitos)
- **Ejemplos válidos**: `#FF0000`, `#F00`, `#123ABC`, `#1A2`
- **Ejemplos inválidos**: `red`, `#GG0000`, `#12`, `#1234567`

### Tokens
- **Permitidos**: Letras, números, guiones, guiones bajos
- **Longitud**: 1-100 caracteres
- **Ejemplos válidos**: `sala-1`, `room_abc123`, `test-token`

## 🏗️ Arquitectura

### Componentes Principales

- **Hono Router**: Manejo de rutas HTTP y WebSocket
- **Durable Objects**: Estado distribuido por token/sala
- **Cloudflare KV**: Persistencia con TTL de 24 horas
- **WebSocket API**: Comunicación bidireccional en tiempo real

### Flujo de Datos

```
Cliente → WebSocket → Durable Object → KV Storage
                                   ↓
                              Broadcast a todos
                              los clientes de la sala
```

### Aislamiento por Token

Cada token crea:
- Una instancia independiente de Durable Object
- Llaves separadas en KV Storage (`last_card:{token}`, `last_background:{token}`)
- Conexiones WebSocket aisladas por sala
- Estado persistente independiente

## 🧪 Testing

```bash
# Ejecutar todos los tests en modo watch
npm test

# Ejecutar tests una vez (modo CI)
npm run test:run

# Regenerar tipos TypeScript
npm run cf-typegen
```

### Coverage de Tests

**34 tests pasando** distribuidos en:

- ✅ **Validación de mensajes** (10 tests): Validación de tipos card, background, clear
- ✅ **Integración KV con tokens** (9 tests): Persistencia por token con TTL
- ✅ **WebSocket Durable Objects** (8 tests): Conexiones, broadcasting, manejo de errores
- ✅ **Endpoints HTTP** (7 tests): Health check, APIs REST, manejo de 404

### Cliente de Prueba Local

Para probar el WebSocket localmente, puedes usar este HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test WebSocket Client</title>
</head>
<body>
    <h1>Showroom WebSocket Test</h1>
    
    <div>
        <label>Token/Sala:</label>
        <input type="text" id="tokenInput" value="test-room" placeholder="Nombre de la sala">
        <button onclick="connect()">Conectar</button>
        <button onclick="disconnect()">Desconectar</button>
    </div>
    
    <div>
        <label>Carta:</label>
        <input type="text" id="cardInput" placeholder="🎭" maxlength="2">
        <button onclick="sendCard()">Enviar Carta</button>
    </div>
    
    <div>
        <label>Color de Fondo:</label>
        <input type="color" id="colorInput" value="#FF0000">
        <button onclick="sendBackground()">Cambiar Fondo</button>
    </div>
    
    <div>
        <button onclick="clearScreen()">Limpiar Pantalla</button>
    </div>
    
    <div>
        <h3>Mensajes:</h3>
        <div id="messages"></div>
    </div>

    <script>
        let ws = null;
        
        function connect() {
            const token = document.getElementById('tokenInput').value;
            ws = new WebSocket(`ws://localhost:8787/${token}`);
            
            ws.onopen = () => addMessage('Conectado a sala: ' + token);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                addMessage('Recibido: ' + JSON.stringify(data));
                
                if (data.type === 'background') {
                    document.body.style.backgroundColor = data.backgroundColor;
                }
            };
            ws.onclose = () => addMessage('Desconectado');
            ws.onerror = (error) => addMessage('Error: ' + error);
        }
        
        function disconnect() {
            if (ws) ws.close();
        }
        
        function sendCard() {
            if (!ws) return;
            const card = document.getElementById('cardInput').value;
            ws.send(JSON.stringify({ type: 'card', card }));
        }
        
        function sendBackground() {
            if (!ws) return;
            const backgroundColor = document.getElementById('colorInput').value;
            ws.send(JSON.stringify({ type: 'background', backgroundColor }));
        }
        
        function clearScreen() {
            if (!ws) return;
            ws.send(JSON.stringify({ type: 'clear' }));
            document.body.style.backgroundColor = '';
        }
        
        function addMessage(msg) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
            document.getElementById('messages').appendChild(div);
        }
    </script>
</body>
</html>
```

## 🚀 Despliegue

### Despliegue Automático con GitHub Actions

Este proyecto incluye un pipeline de CI/CD que despliega automáticamente:

- **Push a `main`**: Despliega a producción  
- **Pull Requests**: Despliega a ambiente de preview

#### Configuración Inicial

1. **Fork el repositorio** en tu cuenta de GitHub

2. **Obtén tu API Token de Cloudflare**:
   - Ve a [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Crea un token con permisos: `Cloudflare Workers:Edit`, `Zone:Read`

3. **Configura el Secret en GitHub**:
   - Tu Repositorio → Settings → Secrets and variables → Actions  
   - Crea: `CLOUDFLARE_API_TOKEN` con tu token

4. **Actualiza `wrangler.toml`** con tu información:
   ```toml
   name = "showroom-ws-worker"
   account_id = "tu-account-id"  # Obtenlo del dashboard de Cloudflare
   ```

### Despliegue Manual

```bash
# Desplegar a producción
npm run deploy

# Desplegar a preview
npm run deploy:preview

# Ver logs en tiempo real
npm run logs
```

## ⚙️ Configuración

### Variables de Entorno

El proyecto requiere la configuración de un KV namespace en `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SHOWROOM_KV"
id = "tu-kv-namespace-id"
```

### Crear KV Namespace

```bash
# Crear namespace para producción
wrangler kv:namespace create "SHOWROOM_KV"

# Crear namespace para preview
wrangler kv:namespace create "SHOWROOM_KV" --preview
```

Luego actualiza `wrangler.toml` con los IDs generados.

## 🔧 Estructura del Proyecto

```
showroom-ws-worker/
├── src/
│   └── index.ts              # Worker principal y Durable Object
├── test/
│   ├── index.spec.ts         # Tests de endpoints HTTP
│   ├── message-validation.spec.ts  # Tests de validación
│   ├── token-kv-storage.spec.ts   # Tests de KV por token
│   └── websocket-room.spec.ts     # Tests de WebSocket
├── .github/
│   └── workflows/
│       ├── ci.yml            # Pipeline de testing
│       └── deploy.yml        # Pipeline de despliegue
├── wrangler.toml            # Configuración de Cloudflare Workers
├── package.json
├── tsconfig.json
├── vitest.config.mts        # Configuración de tests
└── README.md
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Scripts de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Tests en modo watch
npm test

# Tests una vez
npm run test:run

# Regenerar tipos
npm run cf-typegen

# Ver logs del worker
npm run logs

# Desplegar
npm run deploy
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Cloudflare Workers](https://workers.cloudflare.com/) - Plataforma serverless
- [Hono](https://hono.dev/) - Framework web ultrarrápido
- [Vitest](https://vitest.dev/) - Framework de testing
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático

---

**Construido con ❤️ para la comunidad de desarrolladores**

### Despliegue Manual

```bash
# Desplegar a producción
npm run deploy

# Desplegar a preview
npm run deploy:preview

# Ver logs en tiempo real
npm run logs
```

3. **¡Listo!** El próximo push a `main` desplegará automáticamente

📖 **Documentación completa**: [GitHub Actions Setup](.github/CICD.md)

### Despliegue Manual

#### Producción

```bash
# Desplegar a producción
npm run deploy

# Desplegar a preview
npm run deploy:preview
```

#### Desarrollo Local

```bash
# Servidor de desarrollo (producción)
npm run dev

# Servidor de desarrollo (preview)
npm run dev:preview
```

#### Monitoreo

```bash
# Ver logs de producción
npm run logs

# Ver logs de preview
npm run logs:preview
```

### Variables de Entorno

No se requieren variables de entorno especiales para este proyecto.

### Configuración de Durable Objects

El proyecto está configurado con:
- **Binding**: `WEBSOCKET_ROOM`
- **Clase**: `WebSocketRoom`
- **Migración**: `v1` (nueva clase)

## 📝 Diferencias con Node.js

Este proyecto es una adaptación de un servidor WebSocket Node.js original. Las principales diferencias:

### Node.js (Original)
- Usa `@hono/node-ws` para WebSockets
- Mantiene conexiones en memoria con `Set<WSContext>`
- Servidor HTTP tradicional con `@hono/node-server`

### Cloudflare Workers (Esta implementación)
- Usa Durable Objects para manejo de estado
- WebSocket API nativa de Cloudflare
- Escalabilidad automática y distribución global
- Sin servidor tradicional (serverless)

## 🔗 Enlaces Útiles

- [Documentación de Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentación de Hono](https://hono.dev/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

## 📄 Licencia

Este proyecto es de código abierto. Consulta el archivo LICENSE para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

*Desarrollado con ❤️ usando Cloudflare Workers*
