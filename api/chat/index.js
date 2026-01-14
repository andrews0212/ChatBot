// Necesitas Node.js 18+ para usar 'fetch' nativo, que es el estándar en Azure hoy día.
module.exports = async function (context, req) {
    // 1. Obtener la pregunta del frontend
    const question = req.body && req.body.question;

    if (!question) {
        context.res = { status: 400, body: "Por favor envía una pregunta." };
        return;
    }

    // 2. Obtener las credenciales desde las Variables de Entorno (Configuración de Azure)
    // NO PONEMOS LA CLAVE AQUÍ DIRECTAMENTE
    const AZURE_ENDPOINT = process.env.CHATBOT_ENDPOINT;
    const AZURE_KEY = process.env.CHATBOT_KEY;

    // Validaciones mínimas: devolver JSON claro si falta configuración
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
        context.log.error('Faltan variables de entorno: CHATBOT_ENDPOINT o CHATBOT_KEY');
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Configuración del servidor incompleta. Configure CHATBOT_ENDPOINT y CHATBOT_KEY.' }
        };
        return;
    }

    // Configuración del cuerpo para Azure Language Service
    const payload = {
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.3,
        answerSpanRequest: {
            enable: true,
            topAnswersWithSpan: 1,
            confidenceScoreThreshold: 0.3
        }
    };

    try {
        // 3. Llamar a Azure Cognitive Services
        const response = await fetch(AZURE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            // Intentamos leer cuerpo de error (JSON o texto)
            let errBody = null;
            if (contentType.includes('application/json')) {
                errBody = await response.json().catch(() => null);
            } else {
                errBody = await response.text().catch(() => `Status ${response.status}`);
            }
            context.log.error('Azure error', response.status, errBody);
            context.res = {
                status: response.status || 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Error al conectar con el servicio de Azure.', details: errBody }
            };
            return;
        }

        // Parseamos la respuesta de Azure según su content-type
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text().catch(() => 'Respuesta no JSON de Azure');
            // Normalizamos la salida para que el frontend siempre reciba JSON
            data = { text: text };
        }

        // 4. Devolver la respuesta al Frontend (siempre JSON)
        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: data
        };

    } catch (error) {
        context.log.error('Catch error:', error.message || error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Error interno al conectar con el bot.', message: error.message || error }
        };
    }
}