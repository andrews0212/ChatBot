const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Procesando mensaje del chat...');

    // 1. AQUÍ ESTABA EL CAMBIO NECESARIO (Coincidiendo con tu imagen 3)
    const endpoint = process.env.CHATBOT_ENDPOINT; 
    const apiKey = process.env.CHATBOT_KEY;
    
    // Estos dos probablemente no los tengas en las variables de entorno aún.
    // O los añades en Azure con estos nombres, o los escribes "a fuego" aquí si es una prueba.
    const projectName = process.env.PROJECT_NAME || "ChatBot"; 
    const deploymentName = process.env.DEPLOYMENT_NAME || "production";

    const userMessage = req.body && req.body.message;

    if (!endpoint || !apiKey) {
        context.res = { status: 500, body: "Error: Faltan las variables de entorno en Azure." };
        return;
    }

    if (!userMessage) {
        context.res = { status: 400, body: "Por favor envía un mensaje." };
        return;
    }

    try {
        // La URL para Question Answering
        const apiUrl = `${endpoint}language/:query-knowledgebases?projectName=${projectName}&api-version=2021-10-01&deploymentName=${deploymentName}`;

        const response = await axios.post(apiUrl, {
            question: userMessage,
            top: 1
        }, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const answers = response.data.answers;
        const botReply = (answers && answers[0]) ? answers[0].answer : "No encontré respuesta.";

        context.res = {
            status: 200,
            body: { reply: botReply }
        };

    } catch (error) {
        context.log.error("Error:", error.message);
        context.res = {
            status: 500,
            body: { reply: "Error interno del servidor. Revisa los logs." }
        };
    }
}