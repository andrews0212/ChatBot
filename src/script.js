async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatHistory = document.getElementById('chat-history');
    const userText = inputField.value.trim();

    if (!userText) return;

    // 1. Mostrar mensaje del usuario en pantalla
    appendMessage(userText, 'user');
    inputField.value = '';

    // 2. Mostrar indicador de carga
    const loadingId = appendMessage('Consultando al chef...', 'bot');

    try {
        // 3. Llamada a TU propia API (Backend)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });

        const data = await response.json();

        // 4. Reemplazar mensaje de carga con la respuesta real
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove(); // Borramos el "cargando..."
        
        appendMessage(data.reply, 'bot');

    } catch (error) {
        console.error('Error:', error);
        appendMessage('Lo siento, tuve un error de conexión.', 'bot');
    }
}

function appendMessage(text, sender) {
    const chatHistory = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    const id = Date.now().toString(); // ID único
    msgDiv.id = id;
    msgDiv.classList.add('message', sender);
    msgDiv.innerText = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll al final
    return id;
}

// Permitir enviar con la tecla Enter
document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});