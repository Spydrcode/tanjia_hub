# Quick Start Guide - Web Analysis with Smart Scraping

## 🚀 What's New

Your web analysis page now has **intelligent web scraping** that extracts meaningful content from websites! No more placeholder messages like "signals were too thin" - you'll get actual insights.

## ✨ Works Out of the Box

**No configuration needed!** Just start your app:

```bash
npm install  # if you haven't already
npm run dev
```

Then visit: `http://localhost:3000/tanjia/tools/analyze`

## 🎯 Try It Now

1. Go to the analyze page
2. Enter any website URL (e.g., `https://stripe.com`)
3. Click "Run analysis"
4. Get rich insights about:
   - What's changed with their growth
   - Friction points they might be experiencing
   - Calm, helpful next steps for reaching out

## 🔧 Optional: Enhanced Mode

Want better performance? Run the MCP server:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run mcp-server
```

Create `.env.local` (copy from `.env.local.example`):
```env
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8787
OPENAI_API_KEY=your-key-here  # Required for analysis
```

## 📊 What You'll See

### Before (Old System)
```
Growth: "No clear growth signals were visible"
Friction: "Signals were too thin to identify"
Next Steps: "Try scanning a deeper page"
```

### After (New System)
```
Growth:
- Recently launched enterprise tier with annual contracts
- Expanded from 50 to 150+ integrations
- New healthcare vertical showing 3x growth

Friction:
- Pricing page doesn't clearly show ROI
- Setup docs scattered across multiple pages

Next Steps:
- Mention their healthcare expansion - ask how it's going
- Offer to walk through setup if complexity is a concern
```

## 🛠️ How It Works

1. **Smart HTML Parsing** - Uses Cheerio to extract actual content
2. **Multi-Page Scraping** - Fetches homepage, /about, /services, etc.
3. **Content Cleaning** - Removes ads, navigation, scripts automatically
4. **AI Analysis** - OpenAI analyzes the structured content
5. **Actionable Insights** - Returns growth signals, friction points, and next steps

## ⚡ Features

- ✅ Extracts titles, descriptions, and main content
- ✅ Identifies key headings and structure
- ✅ Captures metadata (author, publish date, keywords)
- ✅ Handles timeouts gracefully
- ✅ Works without MCP server (automatic fallback)
- ✅ Respects rate limits
- ✅ 10-second timeout per URL
- ✅ HTTPS only for security

## 🔍 Troubleshooting

### "Content was too thin"
- Try a different page (/about or /services often have more content)
- Some sites genuinely have little text
- Check if the site requires JavaScript (not yet supported)

### Slow performance
- Normal! Web scraping takes 2-5 seconds per URL
- The system fetches multiple pages for better context
- Use MCP server for slight performance boost

### MCP server not connecting
- Verify it's running: `npm run mcp-server`
- Check port 8787 is available
- Don't worry - system falls back to direct scraping automatically!

## 📚 More Info

- **Detailed docs:** [docs/WEB_SCRAPING.md](./WEB_SCRAPING.md)
- **Implementation:** [docs/IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Main README:** [README.md](../README.md)

## 🎉 That's It!

You're ready to analyze websites and get meaningful insights. No complex setup required - it just works!

---

**Need help?** Check the troubleshooting section in [docs/WEB_SCRAPING.md](./WEB_SCRAPING.md)
