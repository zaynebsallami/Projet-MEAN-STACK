const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream, existsSync, mkdirSync } = require('fs');
const path = require('path');

const hostname = 'http://localhost:4200'; // Replace with your live domain when ready
const sitemapPath = path.resolve(__dirname, 'dist', 'browser');
const sitemapFile = path.join(sitemapPath, 'sitemap.xml');

// Make sure directory exists
if (!existsSync(sitemapPath)) {
  mkdirSync(sitemapPath, { recursive: true });
}

const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/profile', changefreq: 'weekly', priority: 0.8 },
  { url: '/cart', changefreq: 'weekly', priority: 0.7 },
  { url: '/wishlist', changefreq: 'weekly', priority: 0.6 },
  { url: '/categories', changefreq: 'weekly', priority: 0.7 },
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/register', changefreq: 'monthly', priority: 0.5 }
];

async function generateSitemap() {
  const sitemapStream = new SitemapStream({ hostname });
  const writeStream = createWriteStream(sitemapFile);

  sitemapStream.pipe(writeStream);

  for (const link of links) {
    sitemapStream.write(link);
  }

  sitemapStream.end();

  // Wait until sitemapStream is fully consumed and written
  await streamToPromise(sitemapStream);

  console.log(`✅ Sitemap generated at ${sitemapFile}`);
}


generateSitemap().catch(err => {
  console.error('❌ Error generating sitemap:', err);
});
