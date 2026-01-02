# MCP Server Implementation Guide

## Overview

This project implements **Model Context Protocol (MCP)** servers following the official MCP specification from Anthropic. MCP is an open standard that enables AI applications to securely connect to data sources and tools.

## What is MCP?

The Model Context Protocol (MCP) is an open-source standard created by Anthropic for connecting AI applications to external systems. It provides:

- **Standardized Communication**: Like USB-C for AI applications
- **Security**: Built-in authentication and authorization patterns
- **Extensibility**: Easy to add new capabilities
- **Interoperability**: Works with multiple AI clients (Claude, etc.)

## Our MCP Implementation

### Architecture

```
┌─────────────────┐
│   MCP Client    │  (Claude Desktop, Custom Clients)
│  (AI Assistant) │
└────────┬────────┘
         │ MCP Protocol (STDIO/HTTP)
         ▼
┌─────────────────┐
│   MCP Server    │  (Our Implementation)
│  - fetch_public │  Tools exposed via MCP
│  - web_search   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scraper Module │  (Cheerio-based)
└─────────────────┘
```

### MCP Components

#### 1. **Tools** (What the AI can DO)
Our MCP server exposes these tools:
- `fetch_public_page` - Scrapes web pages and returns structured content
- `web_search` - Performs web searches (stub implementation)

#### 2. **Resources** (What the AI can READ)
Currently not implemented, but could include:
- Cached page content
- Historical scraping data

#### 3. **Prompts** (Pre-configured workflows)
Currently not implemented, but could include:
- Website analysis templates
- Data extraction patterns

## Standard MCP Patterns We Follow

### 1. **Transport Layer**
We support the standard MCP transports:
- **STDIO**: For local/process communication (current implementation)
- **HTTP/SSE**: Can be easily added for remote access

### 2. **Tool Definition Format**
Our tools follow the MCP spec exactly:

```json
{
  "type": "function",
  "function": {
    "name": "fetch_public_page",
    "description": "Fetch a public web page and return structured content",
    "parameters": {
      "type": "object",
      "properties": {
        "url": { "type": "string", "format": "uri" }
      },
      "required": ["url"]
    }
  }
}
```

### 3. **Response Format**
All responses follow MCP conventions:

```typescript
{
  "name": "fetch_public_page",
  "output": {
    "url": "https://example.com",
    "snippet": "Extracted content...",
    "title": "Page Title"
  }
}
```

## How It Works with Claude

### Configuration (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "tanjia-scraper": {
      "command": "node",
      "args": ["path/to/mcp-server/index.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Flow

1. **User asks Claude**: "What's on the Stripe homepage?"
2. **Claude decides** to use the `fetch_public_page` tool
3. **MCP Protocol** sends the request to our server
4. **Our server** scrapes the page using Cheerio
5. **Response** is sent back via MCP
6. **Claude** uses the content to answer the user

## Comparison with Other MCP Servers

Our implementation follows the same patterns as official MCP servers:

| Feature | Our Server | @modelcontextprotocol/server-fetch | Notes |
|---------|-----------|-----------------------------------|-------|
| Protocol | MCP 1.0 | MCP 1.0 | ✅ Standard |
| Transport | STDIO/HTTP | STDIO | ✅ Compatible |
| Tool Format | Standard | Standard | ✅ MCP Spec |
| Error Handling | Graceful | Graceful | ✅ Best Practice |
| Content Extraction | Cheerio (Advanced) | Basic fetch | ⭐ Enhanced |

## MCP Best Practices We Implement

### ✅ Security
- HTTPS-only fetching
- User-Agent identification
- Timeout protection (10s)
- Input validation

### ✅ Performance
- Async/await patterns
- Proper error handling
- Resource cleanup
- Reasonable size limits

### ✅ Observability
- Structured logging
- Error messages
- Clear success/failure states

### ✅ Documentation
- Tool descriptions
- Parameter schemas
- Example usage

## Connecting to MCP Clients

### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tanjia-web-scraper": {
      "command": "npm",
      "args": ["run", "mcp-server"],
      "cwd": "/path/to/tanjia-networking"
    }
  }
}
```

### Custom MCP Clients
Use the standard MCP client library:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["mcp-server/index.ts"],
});

const client = new Client({
  name: "my-client",
  version: "1.0.0",
}, {
  capabilities: {},
});

await client.connect(transport);
const result = await client.callTool({
  name: "fetch_public_page",
  arguments: { url: "https://example.com" }
});
```

## MCP Resources

### Official Documentation
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)

### Our Implementation
- Main Server: [mcp-server/index.ts](../mcp-server/index.ts)
- Scraper Module: [src/lib/scraping/scraper.ts](../src/lib/scraping/scraper.ts)
- Tools Integration: [src/lib/agents/tools.ts](../src/lib/agents/tools.ts)

## Extending Our MCP Server

### Adding a New Tool

```typescript
// In mcp-server/index.ts

async function handleNewTool(req: http.IncomingMessage, res: http.ServerResponse, payload: any) {
  // Validate input
  if (!payload?.param) return json(res, 400, { error: "param required" });
  
  try {
    // Do work
    const result = await doSomething(payload.param);
    return json(res, 200, { result });
  } catch (error) {
    return json(res, 500, { error: "failed" });
  }
}

// Add route
if (path === "/new_tool") return handleNewTool(req, res, payload);
```

### Adding a Resource

Resources provide read-only data access:

```typescript
// Example: Expose cached scraping results
const resources = {
  "cache://recent-scrapes": {
    uri: "cache://recent-scrapes",
    name: "Recent Scrapes",
    description: "Recently scraped pages",
    mimeType: "application/json"
  }
};
```

### Adding a Prompt Template

Prompts guide AI behavior:

```typescript
const prompts = {
  "analyze-website": {
    name: "Website Analysis",
    description: "Analyze a website for insights",
    arguments: [
      {
        name: "url",
        description: "Website URL to analyze",
        required: true
      }
    ]
  }
};
```

## MCP vs Direct API Integration

### Why MCP?

| Aspect | MCP | Direct API |
|--------|-----|-----------|
| **Standardization** | ✅ Open standard | ❌ Custom per service |
| **AI Client Support** | ✅ Works with any MCP client | ❌ Needs custom integration |
| **Security** | ✅ Built-in patterns | ⚠️ Roll your own |
| **Discoverability** | ✅ Tools auto-discovered | ❌ Manual configuration |
| **Maintenance** | ✅ Standard updates | ❌ Breaking changes |

## Troubleshooting

### MCP Server Not Connecting

1. **Check logs**: Look at Claude Desktop logs
   - Mac: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

2. **Verify command**: Test the server directly
   ```bash
   npm run mcp-server
   ```

3. **Check transport**: Ensure STDIO is working
   ```bash
   echo '{"method":"tools/list"}' | npm run mcp-server
   ```

### Tools Not Appearing

1. **Restart Claude** after config changes
2. **Check tool definitions** are valid JSON
3. **Verify server is running** (`ps aux | grep mcp-server`)

### Errors During Scraping

1. **Check URL format**: Must be HTTPS
2. **Verify timeout**: Increase if needed
3. **Test directly**: Run scraper module standalone

## Future Enhancements

### Planned MCP Features

- [ ] **Resources**: Expose scraping cache
- [ ] **Prompts**: Pre-configured analysis templates
- [ ] **Sampling**: Interactive user confirmation
- [ ] **HTTP Transport**: For remote access
- [ ] **Authentication**: OAuth/API key support
- [ ] **Rate Limiting**: Per-client limits
- [ ] **Webhooks**: Real-time notifications

### Compatibility Roadmap

- [ ] MCP SDK 2.0 support
- [ ] Claude Pro features
- [ ] Multi-client testing
- [ ] Performance benchmarks
- [ ] Security audit

## Contributing

When adding features, ensure:

1. **MCP Compliance**: Follow the spec
2. **Error Handling**: Graceful failures
3. **Documentation**: Update this guide
4. **Testing**: Test with multiple clients
5. **Security**: Validate all inputs

## License

This MCP implementation follows the same license as the main project. See [LICENSE](../LICENSE) for details.

## Support

- **MCP Questions**: See [MCP Discord](https://discord.gg/mcp)
- **Our Implementation**: Open an issue on GitHub
- **General Help**: See [docs/WEB_SCRAPING.md](./WEB_SCRAPING.md)
