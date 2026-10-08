import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

// The site wants to be found, by search engines and by AI assistants alike. "Allow: /" for
// everyone already covers the AI crawlers; they are listed anyway so the intent is explicit and
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
