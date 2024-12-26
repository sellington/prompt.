// API configuration
const OPENROUTER_API_KEY = window.CONFIG.OPENROUTER_API_KEY;
const OLLAMA_BASE_URL = window.CONFIG.OLLAMA_BASE_URL;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Available models will be fetched from OpenRouter
let availableModels = [];
let isOllamaMode = false;

// DOM Elements
const modelSelect = document.getElementById('model-select');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const ollamaToggle = document.getElementById('ollama-toggle');
const modelSelectorDiv = document.querySelector('.model-selector');

// Ollama configuration
async function fetchOllamaModels() {
    try {
        console.log('Fetching Ollama models from:', OLLAMA_BASE_URL);
        const response = await fetch('/ollama/api/tags', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Ollama API response status:', response.status);
        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Ollama models data:', data);
        
        // Clear existing options
        modelSelect.innerHTML = '<option value="">Select an Ollama Model</option>';
        
        // Add Ollama models
        if (Array.isArray(data.models)) {
            console.log('Found models:', data.models);
            data.models.forEach(model => {
                console.log('Processing model:', model);
                const option = document.createElement('option');
                option.value = model.name || model;  // handle both object and string formats
                option.textContent = model.name || model;
                modelSelect.appendChild(option);
            });
            if (data.models.length === 0) {
                addMessage('No models found. Please install models using "ollama pull model-name"', 'ai-message');
            }
        } else {
            console.error('Invalid models data:', data);
            throw new Error('Invalid response format: models array not found');
        }
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        addMessage(`System Error: ${error.message}. Please check if Ollama is running locally at ${OLLAMA_BASE_URL}`, 'ai-message');
        // Reset UI state on error
        isOllamaMode = false;
        ollamaToggle.classList.remove('active');
        ollamaToggle.textContent = 'Use Ollama';
        modelSelectorDiv.classList.remove('ollama-mode');
    }
}

// Toggle between Ollama and OpenRouter
function toggleOllamaMode() {
    isOllamaMode = !isOllamaMode;
    
    // Update button text and style to indicate current mode
    if (isOllamaMode) {
        ollamaToggle.textContent = 'Using Ollama';
        ollamaToggle.classList.add('active');
        modelSelectorDiv.classList.add('ollama-mode');
        console.log('Switching to Ollama mode');
        fetchOllamaModels();
    } else {
        ollamaToggle.textContent = 'Use Ollama';
        ollamaToggle.classList.remove('active');
        modelSelectorDiv.classList.remove('ollama-mode');
        console.log('Switching to OpenRouter mode');
        modelSelect.innerHTML = '<option value="">Select an AI Model</option>';
        fetchAvailableModels();
    }

    // Add message to indicate mode change
    addMessage(`Switched to ${isOllamaMode ? 'Ollama' : 'OpenRouter'} mode`, 'ai-message');
}

// Fetch available models from OpenRouter
async function fetchAvailableModels() {
    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
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

// Send message to selected API
async function sendMessage(message, modelId) {
    try {
        console.log(`Sending message to ${isOllamaMode ? 'Ollama' : 'OpenRouter'} API with model:`, modelId);
        const response = await fetch(isOllamaMode ? 
            '/ollama/api/generate' : 
            `${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(isOllamaMode ? {} : {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'User-Agent': 'AI Chat Interface/1.0.0',
                    'X-Title': 'AI Chat Interface',
                    'Origin': 'http://localhost:3000'
                })
            },
            body: JSON.stringify(isOllamaMode ? {
                model: modelId,
                prompt: message,
                stream: false
            } : {
                model: modelId,
                messages: [{ role: 'user', content: message }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (isOllamaMode) {
            if (!data.response) {
                throw new Error('Invalid response format from Ollama API');
            }
            return data.response;
        } else {
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from OpenRouter API');
            }
            return data.choices[0].message.content;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error(error.message || 'Failed to get response from AI');
    }
}

// Handle sending messages
async function handleSend() {
    const message = userInput.value.trim();
    const selectedModel = modelSelect.value;

    console.log('Sending message with model:', selectedModel, 'isOllamaMode:', isOllamaMode);

    if (!message) return;
    if (!selectedModel) {
        addMessage('Please select an AI model first.', 'ai-message');
        return;
    }
    if (!isOllamaMode && !OPENROUTER_API_KEY) {
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
    
    // Add Ollama toggle listener
    ollamaToggle.addEventListener('click', toggleOllamaMode);
});
