const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Procesando mensaje del chat...');

    // 1. Obtener variables de entorno (Configuradas en Azure o local.settings.json)
    const endpoint = process.env.LANGUAGE_ENDPOINT; // Ej: https://mi-recurso.cognitiveservices.azure.com/
    const apiKey = process.env.LANGUAGE_API_KEY;
    const projectName = process.env.PROJECT_NAME;
    const deploymentName = process.env.DEPLOYMENT_NAME || 'production';

    // 2. Validar entrada
    const userMessage = req.body && req.body.message;
    if (!userMessage) {
        context.res = { status: 400, body: "Por favor envía un mensaje en el cuerpo del JSON." };
        return;
    }

    try {
        // 3. Configurar la petición a Azure Question Answering
        // Documentación: https://learn.microsoft.com/en-us/rest/api/language/question-answering/query-knowledgebases
        const apiUrl = `${endpoint}language/:query-knowledgebases?projectName=${projectName}&api-version=2021-10-01&deploymentName=${deploymentName}`;

        const payload = {
            question: userMessage,
            top: 1, // Número de respuestas a devolver
            confidenceScoreThreshold: 0.3 // Mínima confianza para responder
        };

        // 4. Enviar petición a Azure
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // 5. Extraer la mejor respuesta
        const answers = response.data.answers;
        let botReply = "Lo siento, no encontré una receta para eso.";

        if (answers && answers.length > 0 && answers[0].answer) {
            botReply = answers[0].answer;
        }

        // 6. Responder al Frontend
        context.res = {
            status: 200,
            body: { reply: botReply }
        };

    } catch (error) {
        context.log.error("Error en la API de Azure:", error.message);
        context.res = {
            status: 500,
            body: { reply: "Hubo un error interno conectando con el cerebro del bot." }
        };
    }
}