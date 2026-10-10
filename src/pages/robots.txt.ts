import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

// robots.txt: allow the whole site for search engines and AI assistants, and point at the sitemap.
// "Allow: /" for * already covers the AI crawlers; they are listed so intent stays explicit and
// a future blanket rule cannot shut them out by accident.
const aiAgents = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Amazonbot',
  'meta-externalagent',
];

/** Build /robots.txt as UTF-8 plain text with absolute sitemap and llms.txt URLs. */
export const GET: APIRoute = ({ site }) => {
  const body = `# Kurippu is a free, open-source Chrome extension for sticking notes on any website.
# Plain-text summary for AI agents: ${absoluteUrl(site, 'llms.txt')}

User-agent: *
Allow: /

# AI crawlers and assistants
${aiAgents.map((agent) => `User-agent: ${agent}`).join('\n')}
Allow: /

Sitemap: ${absoluteUrl(site, 'sitemap.xml')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
