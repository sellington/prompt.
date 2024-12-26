# Prompt AI Chat Interface

A containerized web-based chat interface for AI models using the OpenRouter API.

## Features

- Clean, modern UI with neon theme
- Support for multiple AI models through OpenRouter
- Local AI model support via Ollama integration
- Real-time chat interface
- Containerized for easy deployment
- Nginx-based for optimal performance
- Environment variable configuration

## Prerequisites

- Docker
- Docker Compose
- OpenRouter API key (get one at https://openrouter.ai/)
- (Optional) Ollama installed locally for local AI model support

## Security Notice

This project uses environment variables for sensitive configuration. Never commit your `.env` file to version control. The repository includes:

- `.env.example` - Template file showing required environment variables
- `.gitignore` - Configured to exclude `.env` files
- Secure environment variable handling in the Docker container

## Quick Start

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd prompt
   ```

2. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual API key
   nano .env  # or use your preferred editor
   ```

3. Deploy with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application at `http://localhost:3000`

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| OPENROUTER_API_KEY | Your OpenRouter API key | sk-or-v1-... |
| OLLAMA_BASE_URL | URL for your Ollama instance (optional) | http://localhost:11434 |

Get your API key from [OpenRouter](https://openrouter.ai/).

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required)
- `OLLAMA_BASE_URL`: URL for your Ollama instance (defaults to http://localhost:11434)

### Docker Compose Configuration

The default `docker-compose.yml` includes:
- Port mapping: 3000:80
- Automatic container restart
- Network configuration
- Traefik labels for reverse proxy support

### Custom Domain

To use a custom domain, modify the Traefik labels in `docker-compose.yml`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.prompt-chat.rule=Host(`your-domain.com`)"
```

## Development

To build the container manually:

```bash
docker build -t prompt-chat .
```

To run without Docker Compose:

```bash
docker run -d \
  -p 3000:80 \
  -e OPENROUTER_API_KEY=your-api-key \
  --name prompt-chat \
  prompt-chat
```

## Security Considerations

- The OpenRouter API key is injected at runtime and not stored in the image
- HTTPS is recommended for production use
- Security headers are configured in the nginx configuration

## Troubleshooting

1. If the container fails to start, check:
   - The `.env` file exists and contains the API key
   - Ports are not already in use
   - Docker daemon is running

2. If the API calls fail:
   - Verify your OpenRouter API key is correct
   - Check the browser console for error messages
   - Ensure your network allows the required connections

3. If Ollama integration fails:
   - Verify Ollama is installed and running locally
   - Check if Ollama is accessible at the configured URL
   - Ensure your models are properly installed in Ollama (run `ollama list`)
   - Check browser console for CORS-related errors

## License

MIT License - See LICENSE file for details
