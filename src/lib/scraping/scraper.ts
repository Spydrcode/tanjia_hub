import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 8000;
const TIMEOUT_MS = 10000;

export interface ScrapedContent {
  url: string;
  title: string;
  description?: string;
  content: string;
  headings: string[];
  links: Array<{ text: string; url: string }>;
  metadata: {
    author?: string;
    publishedDate?: string;
    keywords?: string[];
  };
}

/**
 * Scrape a webpage and extract meaningful content
 */
export async function scrapeWebpage(url: string): Promise<ScrapedContent | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TanjiaBot/1.0; +https://2ndmynd.com)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[scraper] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    return parseHtml(url, html);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[scraper] Timeout scraping ${url}`);
    } else {
      console.error(`[scraper] Error scraping ${url}:`, error);
    }
    return null;
  }
}

/**
 * Parse HTML and extract structured content
 */
export function parseHtml(url: string, html: string): ScrapedContent {
  const $ = cheerio.load(html);

  // Remove script, style, and other non-content elements
  $("script, style, noscript, iframe, nav, footer, aside, form").remove();
  $("[role='navigation'], [role='complementary'], [role='banner']").remove();

  // Extract title
  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Extract description
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    undefined;

  // Extract metadata
  const author =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    undefined;

  const publishedDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="publish-date"]').attr("content") ||
    $('time[datetime]').attr("datetime") ||
    undefined;

  const keywordsContent = $('meta[name="keywords"]').attr("content");
  const keywords = keywordsContent ? keywordsContent.split(",").map((k) => k.trim()) : undefined;

  // Extract main content
  let mainContent = "";
  const contentSelectors = [
    "article",
    '[role="main"]',
    "main",
    ".content",
    ".main-content",
    "#content",
    "#main",
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      mainContent = element.text();
      break;
    }
  }

  // Fallback to body if no main content found
  if (!mainContent) {
    mainContent = $("body").text();
  }

  // Clean up the content
  const content = mainContent
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n+/g, "\n") // Normalize newlines
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);

  // Extract headings
  const headings: string[] = [];
  $("h1, h2, h3").each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 0) {
      headings.push(text);
    }
  });

  // Extract relevant links
  const links: Array<{ text: string; url: string }> = [];
  const baseUrl = new URL(url);
  
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().trim();
    
    if (href && text && href.length > 0 && text.length > 0) {
      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, baseUrl).toString();
        
        // Only include links that seem relevant (same domain or important external links)
        if (
          absoluteUrl.startsWith(baseUrl.origin) ||
          href.includes("about") ||
          href.includes("contact") ||
          href.includes("team") ||
          href.includes("service") ||
          href.includes("product")
        ) {
          links.push({ text, url: absoluteUrl });
        }
      } catch {
        // Invalid URL, skip it
      }
    }
  });

  return {
    url,
    title,
    description,
    content,
    headings: headings.slice(0, 20), // Limit to first 20 headings
    links: links.slice(0, 30), // Limit to first 30 links
    metadata: {
      author,
      publishedDate,
      keywords,
    },
  };
}

/**
 * Create a concise summary snippet from scraped content
 */
export function createSnippet(scraped: ScrapedContent, maxLength = 1200): string {
  const parts: string[] = [];

  // Add title
  if (scraped.title) {
    parts.push(`# ${scraped.title}`);
  }

  // Add description if available
  if (scraped.description) {
    parts.push(`\n${scraped.description}`);
  }

  // Add key headings
  if (scraped.headings.length > 0) {
    parts.push("\n## Key Sections:");
    scraped.headings.slice(0, 5).forEach((h) => parts.push(`- ${h}`));
  }

  // Add main content excerpt
  if (scraped.content) {
    parts.push("\n## Content:");
    const excerpt = scraped.content.slice(0, maxLength - parts.join("").length - 100);
    parts.push(excerpt);
  }

  // Add metadata if available
  const metaParts: string[] = [];
  if (scraped.metadata.author) {
    metaParts.push(`Author: ${scraped.metadata.author}`);
  }
  if (scraped.metadata.publishedDate) {
    metaParts.push(`Published: ${scraped.metadata.publishedDate}`);
  }
  if (metaParts.length > 0) {
    parts.push("\n## Metadata:");
    parts.push(metaParts.join(" | "));
  }

  return parts.join("\n").slice(0, maxLength);
}

/**
 * Scrape multiple URLs and combine results
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options: { maxConcurrent?: number; includeSnippets?: boolean } = {}
): Promise<Array<{ url: string; snippet?: string; content?: ScrapedContent }>> {
  const { maxConcurrent = 5, includeSnippets = true } = options;
  const results: Array<{ url: string; snippet?: string; content?: ScrapedContent }> = [];

  // Process in batches to avoid overwhelming the target servers
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const promises = batch.map(async (url) => {
      const scraped = await scrapeWebpage(url);
      if (!scraped) {
        return { url, snippet: undefined, content: undefined };
      }
      return {
        url,
        snippet: includeSnippets ? createSnippet(scraped) : undefined,
        content: scraped,
      };
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}
