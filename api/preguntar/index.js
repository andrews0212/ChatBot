const https = require('https');

module.exports = async function (context, req) {
    const endpoint = process.env.CHATBOT_ENDPOINT;
    const apiKey = process.env.CHATBOT_KEY;

    // --- BLOQUE DE DIAGNÓSTICO ---
    const debugInfo = {
        endpointConfigured: endpoint ? "SÍ" : "NO",
        endpointLength: endpoint ? endpoint.length : 0,
        keyConfigured: apiKey ? "SÍ" : "NO",
        questionReceived: req.body ? req.body.question : "NO BODY"
    };

    if (!endpoint || !apiKey) {
        context.res = {
            status: 500,
            body: JSON.stringify({ error: "Faltan claves en Azure", debug: debugInfo })
        };
        return;
    }

    const question = req.body && req.body.question;
    const payload = JSON.stringify({
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.1,
        answerSpanRequest: { enable: true, topAnswersWithSpan: 1, confidenceScoreThreshold: 0.1 }
    });

    try {
        const url = new URL(endpoint);

        // Hacemos la llamada a Azure
        const azureResult = await new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const request = https.request(options, (response) => {
                let chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const bodyString = Buffer.concat(chunks).toString();
                    resolve({
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                        headers: response.headers,
                        body: bodyString
                    });
                });
            });

            request.on('error', (e) => resolve({ error: e.message }));
            request.write(payload);
            request.end();
        });

        // --- RESPUESTA BLINDADA ---
        // Devolvemos SIEMPRE un JSON con lo que pasó, sea bueno o malo.
        context.res = {
            status: 200, // Forzamos 200 para que el frontend pueda leer el JSON de error
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                debug: debugInfo,
                azureStatus: azureResult.statusCode,
                azureMessage: azureResult.statusMessage,
                azureBody: azureResult.body || "(Respuesta vacía)",
                answers: azureResult.body ? JSON.parse(azureResult.body).answers : [] 
            })
        };

    } catch (error) {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: "Error interno (Crash)", 
                details: error.message, 
                debug: debugInfo 
            })
        };
    }
};
