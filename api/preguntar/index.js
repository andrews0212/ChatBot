const https = require('https');

module.exports = async function (context, req) {
    // 1. Obtenemos las credenciales de las variables de entorno
    const endpoint = process.env.CHATBOT_ENDPOINT;
    const apiKey = process.env.CHATBOT_KEY;

    // --- BLOQUE DE DIAGNÓSTICO (Útil si algo falla) ---
    const debugInfo = {
        endpointConfigured: endpoint ? "SÍ" : "NO",
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

    // 2. Preparamos los datos para enviar a Azure
    const question = req.body && req.body.question;
    
    // IMPORTANTE: Esta estructura debe coincidir con la documentación de Azure Language
    const payload = JSON.stringify({
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.1,
        answerSpanRequest: { enable: true, topAnswersWithSpan: 1, confidenceScoreThreshold: 0.1 }
    });

    try {
        // 3. CONSTRUCCIÓN DE LA URL (AQUÍ ESTABA EL ERROR)
        // Usamos la base del endpoint, pero forzamos la ruta específica que sale en tu captura.
        const urlBase = new URL(endpoint);
        
        // Copiado exactamente de tu captura de pantalla "Get prediction URL":
        // Path: /language/:query-knowledgebases
        // Params: ?projectName=chatbot&api-version=2021-10-01&deploymentName=production
        const apiPath = "/language/:query-knowledgebases?projectName=chatbot&api-version=2021-10-01&deploymentName=production";

        const options = {
            hostname: urlBase.hostname,
            path: apiPath, 
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        // 4. Realizamos la petición a Azure
        const azureResult = await new Promise((resolve, reject) => {
            const request = https.request(options, (response) => {
                let chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const bodyString = Buffer.concat(chunks).toString();
                    resolve({
                        statusCode: response.statusCode,
                        body: bodyString
                    });
                });
            });

            request.on('error', (e) => reject(e));
            request.write(payload);
            request.end();
        });

        // 5. Devolvemos la respuesta al Frontend
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                debug: debugInfo,
                azureStatus: azureResult.statusCode,
                // Parseamos la respuesta de Azure para enviarla limpia
                answers: azureResult.body ? JSON.parse(azureResult.body).answers : [] 
            })
        };

    } catch (error) {
        context.log.error("Error en la función:", error);
        context.res = {
            status: 500, // Error interno
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: "Error interno del servidor", 
                details: error.message, 
                debug: debugInfo 
            })
        };
    }
};