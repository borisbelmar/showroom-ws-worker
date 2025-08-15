# 🚀 Configuración de GitHub Actions para Despliegue Automático

Este documento explica cómo configurar el despliegue automático a Cloudflare Workers usando GitHub Actions.

## 📋 Configuración Inicial

### 1. Obtener el API Token de Cloudflare

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Haz clic en "Create Token"
3. Usa la plantilla "Custom token" con estos permisos:
   ```
   Zone:Zone Settings:Read
   Zone:Zone:Read
   Account:Cloudflare Workers:Edit
   Account:Account Settings:Read
   ```
4. Incluye todos los accounts y zones que necesites
5. Copia el token generado

### 2. Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Crea un nuevo repository secret:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: El token que copiaste de Cloudflare

## 🔄 Flujo de Trabajo

### Pipeline Automático

El pipeline se ejecuta en los siguientes casos:

- **Push a `main`**: Despliega a producción
- **Pull Request**: Despliega a preview (ambiente de pruebas)

### Etapas del Pipeline

1. **Checkout**: Descarga el código del repositorio
2. **Setup Node.js**: Configura Node.js 20
3. **Install dependencies**: Instala dependencias con `npm ci`
4. **Run tests**: Ejecuta los tests con `npm test`
5. **Generate types**: Regenera tipos de Cloudflare
6. **Deploy**: Despliega a producción o preview según el evento

## 🌍 Entornos

### Producción
- **Trigger**: Push a rama `main`
- **URL**: `https://showroom-ws-worker.borisbelmarm.workers.dev`
- **WebSocket**: `wss://showroom-ws-worker.borisbelmarm.workers.dev/`

### Preview (Pull Requests)
- **Trigger**: Creación/actualización de Pull Request
- **URL**: `https://showroom-ws-worker-preview.borisbelmarm.workers.dev`
- **WebSocket**: `wss://showroom-ws-worker-preview.borisbelmarm.workers.dev/`

## 📁 Archivos de Configuración

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy WebSocket Worker

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Generate Cloudflare types
        run: npm run cf-typegen

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'

      - name: Deploy Preview (PR only)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env preview
        if: github.event_name == 'pull_request'
```

### `wrangler.jsonc` - Configuración de Entornos
```jsonc
{
  // ... configuración base ...
  "env": {
    "preview": {
      "name": "showroom-ws-worker-preview"
    }
  }
}
```

## ⚡ Comandos Locales

Para probar localmente antes de hacer push:

```bash
# Desarrollo local
npm run dev

# Ejecutar tests
npm test

# Desplegar manualmente a producción
npm run deploy

# Desplegar manualmente a preview
npx wrangler deploy --env preview

# Ver logs en tiempo real
npx wrangler tail

# Ver logs del preview
npx wrangler tail --env preview
```

## 🔍 Monitoreo y Debugging

### Ver Logs del Pipeline
1. Ve a tu repositorio en GitHub
2. Actions → Selecciona el workflow
3. Haz clic en el job para ver los logs detallados

### Ver Logs de Cloudflare
```bash
# Logs de producción
npx wrangler tail

# Logs de preview
npx wrangler tail --env preview
```

### URLs de Dashboard
- **Producción**: [showroom-ws-worker](https://dash.cloudflare.com/?to=/:account/workers/services/view/showroom-ws-worker)
- **Preview**: [showroom-ws-worker-preview](https://dash.cloudflare.com/?to=/:account/workers/services/view/showroom-ws-worker-preview)

## 🚨 Solución de Problemas

### Error: API Token Invalid
- Verifica que el token tenga los permisos correctos
- Asegúrate de que el secret esté configurado correctamente en GitHub

### Error: Durable Objects Migration
- Asegúrate de que las migraciones estén correctas en `wrangler.jsonc`
- Verifica que uses `new_sqlite_classes` para el plan gratuito

### Error: Tests Failing
- El pipeline no desplegará si los tests fallan
- Ejecuta `npm test` localmente para debugging

### Error: Build Fails
- Verifica que `npm run cf-typegen` funcione localmente
- Asegúrate de que no haya errores de TypeScript

## 📝 Mejores Prácticas

1. **Usa Pull Requests**: Siempre crea PRs para probar en preview antes de mergear
2. **Tests**: Asegúrate de que los tests pasen antes de hacer push
3. **Rollback**: Si algo falla en producción, puedes hacer rollback desde el dashboard
4. **Monitoreo**: Configura alertas en Cloudflare para errores en producción

## 🔄 Proceso de Desarrollo Recomendado

1. Crea una nueva rama: `git checkout -b feature/nueva-funcionalidad`
2. Desarrolla y testea localmente: `npm run dev`
3. Ejecuta tests: `npm test`
4. Haz commit y push: `git push origin feature/nueva-funcionalidad`
5. Crea Pull Request en GitHub
6. GitHub Actions desplegará automáticamente a preview
7. Prueba en preview: `https://showroom-ws-worker-preview.borisbelmarm.workers.dev`
8. Si todo está bien, mergea el PR a main
9. GitHub Actions desplegará automáticamente a producción

---

🎉 **¡Tu pipeline de CI/CD está listo!**
