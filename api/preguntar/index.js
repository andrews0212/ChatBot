
const https = require('https');

module.exports = async function (context, req) {
    // Leemos las claves desde las variables de entorno de Azure
    const endpoint = process.env.CHATBOT_ENDPOINT;
    const apiKey = process.env.CHATBOT_KEY;

    if (!endpoint || !apiKey) {
        context.res = { status: 500, body: "Error de configuración en el servidor (faltan claves)." };
        return;
    }

    const question = req.body && req.body.question;

    // Preparamos los datos para Azure
    const payload = JSON.stringify({
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.1,
        answerSpanRequest: { enable: true, topAnswersWithSpan: 1, confidenceScoreThreshold: 0.1 }
    });

    // Como Node.js nativo a veces complica el fetch en versiones antiguas de Azure, usamos 'https' básico
    const url = new URL(endpoint);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                context.res = {
                    status: response.statusCode,
                    body: data,
                    headers: { 'Content-Type': 'application/json' }
                };
                resolve();
            });
        });

        request.on('error', (error) => {
            context.res = { status: 500, body: error.message };
            resolve();
        });

        request.write(payload);
        request.end();
    });
};