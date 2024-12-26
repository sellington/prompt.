// OpenRouter API configuration
const OPENROUTER_API_KEY = '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';
const API_BASE_URL = 'https://openrouter.ai/api/v1';

// Available models will be fetched from OpenRouter
let availableModels = [];

// DOM Elements
const modelSelect = document.getElementById('model-select');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Fetch available models from OpenRouter
async function fetchAvailableModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/models`, {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'Content-Type': 'application/json',
                'User-Agent': 'AI Chat Interface/1.0.0',
                'X-Title': 'AI Chat Interface',
                'Origin': 'http://localhost:3000'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid response format from API');
        }
        
        availableModels = data.data;
        
        // Populate the model selector
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.pricing?.prompt || 'N/A'}/prompt)`;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        const errorMessage = error.message || 'Failed to load available models';
        addMessage(`System Error: ${errorMessage}. Please check the console for details.`, 'ai-message');
    }
}

// Add a message to the chat
function addMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to OpenRouter API
async function sendMessage(message, modelId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'User-Agent': 'AI Chat Interface/1.0.0',
                'X-Title': 'AI Chat Interface',
                'Origin': 'http://localhost:3000'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: 'user', content: message }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error(error.message || 'Failed to get response from AI');
    }
}

// Handle sending messages
async function handleSend() {
    const message = userInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!message) return;
    if (!selectedModel) {
        addMessage('Please select an AI model first.', 'ai-message');
        return;
    }
    if (!OPENROUTER_API_KEY) {
        addMessage('Please set your OpenRouter API key first.', 'ai-message');
        return;
    }

    // Clear input
    userInput.value = '';

    // Add user message to chat
    addMessage(message, 'user-message');

    // Disable input while waiting for response
    userInput.disabled = true;
    sendButton.disabled = true;

    try {
        // Get AI response
        const response = await sendMessage(message, selectedModel);
        addMessage(response, 'ai-message');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'ai-message');
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchAvailableModels();
    
    // Add initial message
    addMessage('Please select an AI model and enter your message.', 'ai-message');
});
