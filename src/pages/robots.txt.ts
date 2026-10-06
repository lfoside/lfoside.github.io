import type { APIRoute } from 'astro';

// robots.txt генерируется при сборке: ссылка на sitemap берётся из site в astro.config.mjs
const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL));
};
