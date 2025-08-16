# 🧩 Showroom WebSocket Worker

[![Deploy Status](https://github.com/TU_USUARIO/showroom-ws-worker/actions/workflows/deploy.yml/badge.svg)](https://github.com/TU_USUARIO/showroom-ws-worker/actions/workflows/deploy.yml)
[![CI Status](https://github.com/TU_USUARIO/showroom-ws-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/showroom-ws-worker/actions/workflows/ci.yml)

Un servidor WebSocket construido con [Cloudflare Workers](https://workers.cloudflare.com/) y [Hono](https://hono.dev/) que permite comunicación en tiempo real para un sistema de showroom de cartas.

## ✨ Características

- 🔄 **WebSocket Bidireccional**: Comunicación en tiempo real entre clientes
- 📡 **Broadcasting**: Los mensajes se envían a todos los clientes conectados
- 🎴 **Gestión de Cartas**: Envío y visualización de cartas
- 🧹 **Comando Clear**: Limpia la pantalla de todos los clientes
- 🏥 **Health Check**: Endpoint de verificación de estado
- ⚡ **Escalabilidad**: Utiliza Durable Objects para manejo de estado

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

# Desarrollar localmente
npm run dev

# Desplegar a Cloudflare Workers
npm run deploy
```

## 🔧 Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:8787`

Para probar WebSockets, abre `test-client.html` en tu navegador y conecta a `ws://localhost:8787/`

## 📡 API

### WebSocket Endpoint

**URL**: `/`
**Protocolo**: WebSocket

#### Mensajes Entrantes

##### Enviar Carta
```json
{
  "type": "card",
  "card": "contenido de la carta"
}
```

##### Limpiar Pantalla
```json
{
  "type": "clear"
}
```

#### Mensajes Salientes

Los mensajes se envían a todos los clientes conectados:

##### Carta Enviada
```json
{
  "type": "card",
  "card": "contenido de la carta"
}
```

##### Pantalla Limpiada
```json
{
  "type": "clear"
}
```

### HTTP Endpoints

#### Health Check
```
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-08-15T18:00:00.000Z"
}
```

## 🏗️ Arquitectura

Este proyecto utiliza:

- **Hono**: Framework web ligero para Workers
- **Durable Objects**: Para mantener el estado de las conexiones WebSocket
- **WebSocket API**: API nativa de Cloudflare Workers para WebSockets

### Flujo de Datos

1. Cliente se conecta al WebSocket endpoint (`/`)
2. La conexión se maneja por un Durable Object (`WebSocketRoom`)
3. Los mensajes entrantes se procesan y se hace broadcast a todos los clientes
4. Las conexiones se gestionan automáticamente (apertura, cierre, errores)

## 🧪 Testing

### Cliente de Prueba

Abre `test-client.html` en tu navegador para probar el WebSocket:

1. Conectar al servidor WebSocket
2. Enviar cartas
3. Enviar comando clear
4. Ver logs en tiempo real

### 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests una vez (modo CI)
npm run test:run

# Ver documentación de tests
cat test/README.md
```

**Cobertura actual**: 18 tests pasando en 3 archivos
- ✅ Tests de endpoints HTTP (health, WebSocket, 404)
- ✅ Tests de Durable Objects (conexiones, broadcasting)
- ✅ Tests de validación de mensajes (card, clear, JSON)

📖 **Documentación completa**: [Test Documentation](test/README.md)

## 🚀 Despliegue

### Despliegue Automático con GitHub Actions

Este proyecto incluye un pipeline de CI/CD que despliega automáticamente:

- **Push a `main`**: Despliega a producción
- **Pull Requests**: Despliega a ambiente de preview

#### Configuración Inicial

1. **Obtén tu API Token de Cloudflare**:
   - Ve a [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Crea un token con permisos para Workers

2. **Configura el Secret en GitHub**:
   - Repositorio → Settings → Secrets and variables → Actions
   - Crea: `CLOUDFLARE_API_TOKEN` con tu token

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
