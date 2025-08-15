# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Este es un proyecto de Cloudflare Worker que implementa un servidor WebSocket usando:

- **Hono**: Framework web para Cloudflare Workers
- **Durable Objects**: Para manejo persistente de conexiones WebSocket
- **TypeScript**: Lenguaje de programación principal

## Características del proyecto

1. **WebSocket Server**: Maneja conexiones WebSocket bidireccionales
2. **Broadcasting**: Envía mensajes a todos los clientes conectados
3. **Tipos de mensajes**:
   - `card`: Envía información de carta con broadcast
   - `clear`: Limpia la pantalla de todos los clientes
4. **Health Check**: Endpoint `/health` para verificar el estado del servicio

## Patrones de desarrollo

- Usar Durable Objects para estado compartido entre conexiones
- Implementar manejo de errores robusto para conexiones WebSocket
- Seguir las mejores prácticas de Cloudflare Workers
- Mantener logs claros para debugging

## Comandos útiles

- `npm run dev`: Desarrollo local con hot reload
- `npm run deploy`: Despliega a Cloudflare Workers
- `npm run cf-typegen`: Regenera tipos TypeScript
