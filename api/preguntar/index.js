const https = require('https');

module.exports = async function (context, req) {
    const endpoint = process.env.CHATBOT_ENDPOINT;
    const apiKey = process.env.CHATBOT_KEY;

    // 1. Verificación de seguridad: ¿Existen las claves?
    if (!endpoint || !apiKey) {
        context.res = {
            status: 500,
            body: JSON.stringify({ error: "Faltan las claves en Azure (Configuration -> Application Settings)" })
        };
        return;
    }

    // 2. Verificación de entrada: ¿Llegó la pregunta?
    const question = req.body && req.body.question;
    if (!question) {
        context.res = {
            status: 400,
            body: JSON.stringify({ error: "No se recibió ninguna pregunta en el cuerpo de la petición." })
        };
        return;
    }

    // 3. Preparar datos para Azure
    const payload = JSON.stringify({
        top: 3,
        question: question,
        includeUnstructuredSources: true,
        confidenceScoreThreshold: 0.1,
        answerSpanRequest: { enable: true, topAnswersWithSpan: 1, confidenceScoreThreshold: 0.1 }
    });

    try {
        const url = new URL(endpoint); // Esto valida si la URL tiene formato correcto

        // Promesa para manejar la petición asíncrona correctamente
        const azureResponse = await new Promise((resolve, reject) => {
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
                let dataChunks = [];
                
                response.on('data', (chunk) => dataChunks.push(chunk));
                
                response.on('end', () => {
                    const responseBody = Buffer.concat(dataChunks).toString();
                    resolve({
                        statusCode: response.statusCode,
                        body: responseBody
                    });
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            request.write(payload);
            request.end();
        });

        // 4. Analizar qué respondió Azure
        if (azureResponse.statusCode >= 200 && azureResponse.statusCode < 300) {
            // ÉXITO
            context.res = {
                status: 200,
                body: azureResponse.body,
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            // ERROR DE AZURE (401, 404, 400...)
            // Devolvemos el error al frontend para poder leerlo
            context.res = {
                status: azureResponse.statusCode, // Mantenemos el código de error original
                body: JSON.stringify({ 
                    error: "Azure rechazó la petición", 
                    statusCode: azureResponse.statusCode,
                    details: azureResponse.body 
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

    } catch (error) {
        // ERROR INTERNO O DE URL
        context.res = {
            status: 500,
            body: JSON.stringify({ error: "Error interno en el servidor", details: error.message })
        };
    }
};
