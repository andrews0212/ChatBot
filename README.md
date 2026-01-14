# ChatBot Seguro

Chatbot que envía preguntas a Azure Cognitive Services (Language Service) de forma segura, sin exponer claves en el frontend.

## Cambios realizados (14/01/2026)

### Cliente (`index.html`)
- ✅ **Nuevo enfoque**: El cliente ahora llama **directamente** a Azure Language Service (sin backend proxy).
- ✅ Panel de configuración: Botón **⚙️ Configurar Credenciales** para introducir endpoint y clave sin editar código.
- ✅ Credenciales guardadas en `localStorage` (navegador).
- ✅ Manejo robusto de errores:
  - Valida respuestas JSON.
  - Muestra errores claros.
  - "Pensando..." se elimina siempre.

### Servidor (`api/chat/index.js`)
- ℹ️ **Archivado** (no se usa en este enfoque). Dejado en el repo por si necesitas migrar a un backend seguro después.

### Por qué este cambio
- Azure Static Web Apps **no soporta Node.js Functions** en la carpeta `api/` de forma directa.
- Esta solución es **más simple y rápida**: sin backend, sin CORS complicado, sin función Azure.
- **Trade-off**: Las credenciales viajan en el cliente (localStorage). Para producción, considera un backend proxy seguro.

## Configuración en Azure

### 1. Credenciales de Azure Language Service
Necesitas tener:
- **CHATBOT_ENDPOINT**: URL completa de tu Language Service (QnA Maker o similar)
  - Ejemplo: `https://<region>.api.cognitive.microsoft.com/language/:query-knowledgebases/<kb-id>/generateAnswer`
- **CHATBOT_KEY**: Clave API de acceso

### 2. En la aplicación
1. Abre el chat en tu Static Web App.
2. Haz clic en el botón **⚙️ Configurar Credenciales** (abajo).
3. Pega tu `CHATBOT_ENDPOINT` y `CHATBOT_KEY`.
4. Haz clic en **Guardar** (se guarda en localStorage del navegador).
5. Ahora puedes hacer preguntas.

⚠️ **Nota sobre seguridad**: Las credenciales se guardan en localStorage del navegador. **NO uses esto en producción sin protecciones adicionales** (como autenticación, encriptación, o un backend proxy). Para producción, implementa un backend seguro que maneje las credenciales.

## Cómo probar

### En Azure (tu caso actual)
1. Despliega los cambios en tu Static Web App (push a GitHub).
2. Abre `https://polite-hill-05823e03.1.azurewebsites.net/` en tu navegador.
3. Haz clic en **⚙️ Configurar Credenciales**.
4. Pega tu:
   - `CHATBOT_ENDPOINT` (URL completa del Language Service)
   - `CHATBOT_KEY` (tu clave API)
5. Haz clic en **Guardar**.
6. Escribe una pregunta y presiona **Enviar**.
7. Si todo está correcto:
   - Desaparece "Pensando..." y aparece la respuesta.
8. Si hay error:
   - Aparece el mensaje de error.
   - Abre consola (`F12` > **Console**) para ver detalles.

### Localmente (opcional, para desarrollo)

#### Requisitos
- Navegador moderno (Chrome, Firefox, Edge, Safari)

#### Pasos
1. Abre `index.html` en tu navegador (puedes arrastrar el archivo o usar un servidor local).
2. Haz clic en **⚙️ Configurar Credenciales**.
3. Pega tu `CHATBOT_ENDPOINT` y `CHATBOT_KEY`.
4. Guarda y prueba.

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