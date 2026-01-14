# ChatBot Seguro

Chatbot que envía preguntas a Azure Cognitive Services (Language Service) de forma segura, sin exponer claves en el frontend.

## Cambios realizados (14/01/2026)

### Cliente (`index.html`)
- ✅ Mejorado manejo de errores en `fetch`:
  - Comprueba `response.ok` antes de parsear JSON.
  - Maneja respuestas que no sean JSON (devuelve texto si es texto plano).
  - El mensaje "Pensando..." se elimina siempre (incluso si hay error) usando bloque `finally`.
  - Muestra mensajes de error más informativos en la UI y en consola del navegador.

### Servidor (`api/chat/index.js`)
- ✅ Validación de configuración:
  - Verifica que existan variables de entorno `CHATBOT_ENDPOINT` y `CHATBOT_KEY`.
  - Si faltan, devuelve JSON con un mensaje de error claro.
- ✅ Manejo robusto de errores:
  - Para respuestas no-OK (4xx, 5xx) de Azure, devuelve JSON con `error` y `details`.
  - **Siempre** devuelve JSON al cliente (encabezado `Content-Type: application/json`).
  - Previene fallos de parseo en el cliente.

## Configuración en Azure

### 1. Variables de entorno (Configuración de Azure App)
En **Azure Portal**, ve a tu **Function App** > **Configuración** > **Configuración de la aplicación** y añade dos nuevas variables:

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `CHATBOT_ENDPOINT` | `https://<tu-region>.api.cognitive.microsoft.com/language/:query-knowledgebases/<kb-id>/generateAnswer` | URL del endpoint de tu Language Service (QnA Maker o similar) |
| `CHATBOT_KEY` | `<tu-clave-api>` | Clave API de acceso al Language Service |

⚠️ **Nota**: No incluyas estas claves en el repositorio. Úsalas solo en Azure Portal.

### 2. CORS (si es necesario)
Si tu frontend está alojado en un dominio diferente a la Function App:
1. En **Configuración** > **CORS**
2. Añade el dominio de origen de tu frontend (ej: `https://miapp.azurewebsites.net`)
3. O usa `*` si quieres permitir cualquier origen (menos seguro, úsalo solo para desarrollo)

## Cómo probar

### En Azure (tu caso actual)
1. Despliega los cambios en tu Function App.
2. Abre `index.html` desde tu dominio Azure o desde donde esté alojado.
3. Escribe una pregunta en el chat.
4. Si todo está bien:
   - Desaparece "Pensando..." y aparece la respuesta de Azure.
5. Si hay error:
   - Desaparece "Pensando..." y aparece un mensaje como "Error del servidor: ..." o "Configuración del servidor incompleta".
   - Abre la consola del navegador (`F12` > **Console**) para ver más detalles en `console.error()`.

### Localmente (opcional, para desarrollo)

#### Requisitos
- Node.js 18+ 
- Azure Functions Core Tools (`func` comando)

#### Pasos
1. Crea un archivo `local.settings.json` en la raíz del proyecto (NO lo commits):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "CHATBOT_ENDPOINT": "https://<tu-region>.api.cognitive.microsoft.com/language/:query-knowledgebases/<kb-id>/generateAnswer",
       "CHATBOT_KEY": "<tu-clave-api>"
     }
   }
   ```

2. Inicia el runtime de Functions:
   ```powershell
   func start
   ```

3. En otra terminal, sirve `index.html` con un servidor estático:
   ```powershell
   npm install -g http-server  # si no lo tienes
   http-server . -p 8080
   ```

4. Abre `http://localhost:8080` en tu navegador y prueba.

## Estructura del proyecto

```
ChatBot/
├── index.html              # Frontend (chat UI)
├── README.md               # Este archivo
├── api/
│   └── chat/
│       ├── function.json   # Config de la Function (triggers HTTP)
│       └── index.js        # Lógica: recibe pregunta, llama Azure, devuelve respuesta
```

## Troubleshooting

### "Pensando..." se queda congelado sin respuesta
- Abre consola (`F12`) y busca errores en **Console**.
- Posibles causas:
  - Falta `CHATBOT_ENDPOINT` o `CHATBOT_KEY` en Azure.
  - El endpoint es incorrecto o expiró la clave.
  - Problema de CORS: frontend y API en orígenes diferentes sin permitir CORS.

### "Error del servidor: ..."
- Lee el mensaje: te da pistas de qué falla.
- Si dice "Configuración del servidor incompleta", configura las variables de entorno en Azure.
- Si es un error de Azure, revisa la clave y el endpoint.

### El chat no se conecta en absoluto (timeout)
- Comprueba que `/api/chat` esté realmente desplegado en Azure.
- Verifica que el endpoint sea accesible (test en Postman o curl).

---

**Última actualización**: 14/01/2026  
**Status**: ✅ Cambios desplegados, awaiting user testing