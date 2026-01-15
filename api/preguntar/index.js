const https = require('https');

module.exports = async function (context, req) {
    const endpoint = process.env.CHATBOT_ENDPOINT;
    const apiKey = process.env.CHATBOT_KEY;

    if (!endpoint || !apiKey) {
        context.res = { status: 500, body: JSON.stringify({ error: "Faltan claves de configuración en Azure." }) };
        return;
    }

    const question = req.body && req.body.question;
    
    // Payload para Azure Language Service (Question Answering)
    const payload = JSON.stringify({
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.1,
        answerSpanRequest: { enable: true, topAnswersWithSpan: 1, confidenceScoreThreshold: 0.1 }
    });

    // Parseamos la URL
    // NOTA: new URL() maneja bien el endpoint completo con query params
    const url = new URL(endpoint);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search, // Combina la ruta y los parámetros (?projectName=...)
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload) // IMPORTANTE: Calcular longitud en bytes
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => data += chunk);
            
            response.on('end', () => {
                // Si Azure devuelve error (ej: 404, 400), lo pasamos al frontend para verlo
                if (response.statusCode >= 400) {
                    context.res = {
                        status: response.statusCode,
                        body: JSON.stringify({ error: "Error de Azure", details: data }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                } else {
                    // Respuesta exitosa
                    context.res = {
                        status: 200,
                        body: data,
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                resolve();
            });
        });

        request.on('error', (error) => {
            context.res = { status: 500, body: JSON.stringify({ error: error.message }) };
            resolve();
        });

        request.write(payload);
        request.end();
    });
};
