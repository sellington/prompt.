// This file will be populated with environment variables during container startup
window.CONFIG = {
    OPENROUTER_API_KEY: '${OPENROUTER_API_KEY}',
    OLLAMA_BASE_URL: '${OLLAMA_BASE_URL}' || 'http://localhost:11434'
};
