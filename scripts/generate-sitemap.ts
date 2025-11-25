/**
 * Generate sitemap.xml for SEO.
 * Run with: npx tsx scripts/generate-sitemap.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const SITE_URL = process.env.SITE_URL || 'https://your-domain.com';

const pages = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/portfolio', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog', changefreq: 'weekly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.7 },
];

function generateSitemap(): string {
  const today = new Date().toISOString().split('T')[0];

  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

const sitemap = generateSitemap();
const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
writeFileSync(outputPath, sitemap);
console.log(`Sitemap generated at ${outputPath}`);



