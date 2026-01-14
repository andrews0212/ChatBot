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

        if (!response.ok) {
            throw new Error(`Error de Azure: ${response.status}`);
        }

        const data = await response.json();

        // 4. Devolver la respuesta al Frontend
        context.res = {
            body: data
        };

    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: "Error interno al conectar con el bot."
        };
    }
}