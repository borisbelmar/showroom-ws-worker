# 🚀 Información de Despliegue

## ✅ Estado del Despliegue

✅ **Desplegado exitosamente en Cloudflare Workers**

- **URL de Producción**: https://showroom-ws-worker.borisbelmarm.workers.dev
- **WebSocket URL**: wss://showroom-ws-worker.borisbelmarm.workers.dev/
- **Health Check**: https://showroom-ws-worker.borisbelmarm.workers.dev/health

## 🔧 Comandos de Despliegue

### Despliegue a Producción
```bash
npm run deploy
```

### Desarrollo Local
```bash
npm run dev
```

### Verificar Estado
```bash
curl https://showroom-ws-worker.borisbelmarm.workers.dev/health
```

## 🧪 Cómo Probar el WebSocket

### Opción 1: Cliente de Prueba Incluido
1. Abre `test-client.html` en tu navegador
2. Cambia la URL a: `wss://showroom-ws-worker.borisbelmarm.workers.dev/`
3. Haz clic en "Conectar"
4. Prueba enviando cartas y comandos clear

### Opción 2: Cliente JavaScript
```javascript
const ws = new WebSocket('wss://showroom-ws-worker.borisbelmarm.workers.dev/');

ws.onopen = () => {
  console.log('Conectado!');
  
  // Enviar una carta
  ws.send(JSON.stringify({
    type: 'card',
    card: { id: 1, name: 'Pikachu', type: 'Electric' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Mensaje recibido:', data);
};
```

### Opción 3: Cliente de Línea de Comandos (usando wscat)
```bash
# Instalar wscat globalmente
npm install -g wscat

# Conectar al WebSocket
wscat -c wss://showroom-ws-worker.borisbelmarm.workers.dev/

# Enviar mensajes:
{"type":"card","card":{"name":"Charizard","power":150}}
{"type":"clear"}
```

## 📊 Monitoreo

### Logs en Cloudflare Dashboard
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navega a Workers & Pages > showroom-ws-worker
3. Ve la pestaña "Logs" para ver los logs en tiempo real

### Métricas Disponibles
- Número de requests
- Duración de ejecución
- Errores y excepciones
- Uso de CPU y memoria

## 🔄 Actualizaciones

Para actualizar el código desplegado:

1. Modifica el código en `src/index.ts`
2. Ejecuta `npm run deploy`
3. Los cambios se aplicarán inmediatamente

## 🌍 Disponibilidad Global

Tu Worker está desplegado en la red global de Cloudflare, lo que significa:

- ⚡ Baja latencia desde cualquier parte del mundo
- 🛡️ Protección DDoS automática
- 📈 Escalabilidad automática
- 🔒 Certificados SSL/TLS automáticos

## 🎯 URLs Importantes

| Servicio | URL |
|----------|-----|
| **WebSocket** | `wss://showroom-ws-worker.borisbelmarm.workers.dev/` |
| **Health Check** | `https://showroom-ws-worker.borisbelmarm.workers.dev/health` |
| **Dashboard** | `https://dash.cloudflare.com/?to=/:account/workers/services/view/showroom-ws-worker` |

## 🔧 Solución de Problemas

### Error de Conexión WebSocket
- Verifica que estés usando `wss://` (no `ws://`) para producción
- Asegúrate de que no haya firewalls bloqueando la conexión

### Error en Despliegue
- Ejecuta `npm run cf-typegen` para regenerar tipos
- Verifica que estés autenticado: `npx wrangler whoami`

### Ver Logs en Tiempo Real
```bash
npx wrangler tail
```

---

🎉 **¡Tu Showroom WebSocket Worker está listo para usar!**
