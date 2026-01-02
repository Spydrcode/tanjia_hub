# Web Scraping Setup Guide

The web analysis feature uses intelligent web scraping to extract meaningful content from websites. This guide explains how to set it up properly.

## Quick Start

The web scraping functionality works out-of-the-box without any additional configuration! The system now uses:

- **Cheerio** - For intelligent HTML parsing and content extraction
- **Smart Content Detection** - Automatically identifies main content, headings, and metadata
- **Fallback Strategy** - Works directly without needing an external MCP server

## How It Works

### 1. Direct Scraping (Default)

By default, web scraping happens directly in your Next.js app:

```typescript
// Automatically extracts:
// - Page title and description
// - Main content (articles, main sections)
// - Key headings (h1, h2, h3)
// - Relevant links
// - Metadata (author, publish date, keywords)
```

### 2. Optional MCP Server (Enhanced)

For better performance and separation of concerns, you can optionally run the MCP server:

```bash
# Terminal 1: Start your Next.js app
npm run dev

# Terminal 2: Start the MCP server
npm run mcp-server
```

Then add to your `.env.local`:

```env
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8787
```

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
# Required for AI analysis
OPENAI_API_KEY=sk-your-key-here

# Optional: Enable MCP server
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8787
```

### MCP Server Port

The MCP server runs on port 8787 by default. To change it:

```bash
PORT=9000 npm run mcp-server
```

And update `.env.local`:

```env
MCP_SERVER_URL=http://localhost:9000
```

## Features

### Intelligent Content Extraction

The scraper automatically:

- **Removes noise**: Scripts, styles, navigation, ads, forms
- **Finds main content**: Identifies article tags, main sections, content divs
- **Extracts structure**: Headings, descriptions, metadata
- **Limits content**: Respects size limits to avoid overwhelming the AI

### Rich Snippets

Each scraped page returns:

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "description": "Meta description",
  "content": "Main page content...",
  "headings": ["Section 1", "Section 2"],
  "links": [{ "text": "About", "url": "https://example.com/about" }],
  "metadata": {
    "author": "John Doe",
    "publishedDate": "2024-01-01",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

### Multiple URL Support

The analyze endpoint automatically scrapes multiple pages:

- Primary URL
- Common pages: /about, /team, /services, /pricing, /blog, /company
- Web search results for additional context

## Troubleshooting

### No content returned

**Problem**: Analysis shows "Content was too thin to summarize confidently"

**Solutions**:
1. Check if the target site blocks bots (some sites require specific user agents)
2. Try a different page on the same site (e.g., /about instead of homepage)
3. Check the browser console for network errors
4. Verify OPENAI_API_KEY is set in .env.local

### MCP Server not connecting

**Problem**: MCP-based features not working

**Solutions**:
1. Ensure MCP server is running: `npm run mcp-server`
2. Check `MCP_SERVER_URL` in `.env.local` matches the port
3. Set `MCP_ENABLED=true` in `.env.local`
4. Check server logs for errors
5. **Note**: The system will automatically fall back to direct scraping if MCP is unavailable

### Timeout errors

**Problem**: Scraping times out

**Solutions**:
1. Target site may be slow - this is normal
2. System will automatically skip slow pages
3. Check your internet connection
4. Increase timeout in `src/lib/scraping/scraper.ts` if needed

### Rate limiting

**Problem**: Getting blocked by target sites

**Solutions**:
1. System automatically respects rate limits
2. Batch processing prevents overwhelming servers
3. Add delays between requests if needed
4. Be respectful of target sites' resources

## Development

### Testing Web Scraping

Test the scraper directly:

```typescript
import { scrapeWebpage } from "@/src/lib/scraping/scraper";

const result = await scrapeWebpage("https://example.com");
console.log(result);
```

### Testing MCP Server

Test the MCP endpoint:

```bash
curl -X POST http://localhost:8787/fetch_public_page \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Health Check

Visit `/api/tanjia/mcp-health` (while authenticated) to verify:
- MCP server connectivity
- Tool execution status
- Configuration status

## Best Practices

1. **Always test with real URLs** - Some sites have complex structures
2. **Monitor response times** - Large sites take longer to scrape
3. **Respect robots.txt** - The scraper identifies itself as TanjiaBot
4. **Handle failures gracefully** - Not all sites allow scraping
5. **Use caching wisely** - Next.js caches fetch results for 120 seconds

## Architecture

```
┌─────────────────┐
│   Web Analysis  │
│   UI Component  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /api/tanjia/   │
│    analyze      │
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  tools.ts       │  │ MCP Server   │
│  (direct fetch) │  │ (optional)   │
└────────┬────────┘  └──────┬───────┘
         │                  │
         └──────┬───────────┘
                ▼
        ┌──────────────┐
        │   scraper.ts │
        │   (Cheerio)  │
        └──────────────┘
```

## Support

If you encounter issues:

1. Check the browser console for client-side errors
2. Check the terminal for server-side errors
3. Verify all environment variables are set correctly
4. Test with a simple, known-good URL first (e.g., https://example.com)
5. Check the `/api/tanjia/mcp-health` endpoint for system status

## Future Enhancements

Potential improvements:

- [ ] Add support for JavaScript-heavy sites (Playwright/Puppeteer)
- [ ] Implement site-specific parsers for common platforms
- [ ] Add intelligent caching with TTL
- [ ] Support for authenticated pages
- [ ] PDF and document parsing
- [ ] Screenshot capture for visual analysis
