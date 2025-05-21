import { JSDOM } from 'jsdom';

interface Metadata {
  title: string;
  favicon: string;
  description: string;
}

export async function fetchMetadata(url: string): Promise<Metadata> {
  try {
    // Validate URL
    const validUrl = new URL(url).toString();

    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkSaver/1.0; +https://github.com/yourusername/link-saver)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get title
    const title = document.querySelector('title')?.textContent?.trim() ||
      document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
      validUrl;

    // Get favicon
    const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
      document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
      new URL('/favicon.ico', validUrl).toString();

    // Get description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
      document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
      '';

    return {
      title,
      favicon: new URL(favicon, validUrl).toString(),
      description,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      title: url,
      favicon: '',
      description: '',
    };
  }
}

export async function generateSummary(url: string, description: string): Promise<string> {
  try {
    if (!description) {
      return 'No description available';
    }
    // Fallback: just return the description and log a warning
    console.warn('Summary API is not available. Returning description as summary.');
    return description;
  } catch (error) {
    console.error('Error generating summary:', error);
    return description || 'No summary available';
  }
} 