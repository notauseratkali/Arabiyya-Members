import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const routes = [
  'signin',
  'login',
  'join',
  'signup',
  'forgot-password',
  'track',
  'policy',
  'dashboard',
  'events',
  'attendance',
  'meeting-minutes',
  'profile',
  'members',
  'courses',
  'logbook',
  'log-book',
  'progress',
  'finance',
  'syllabus',
  'requests',
  'announcements',
  'settings',
  'admin',
  'admin/requests',
  'admin/settings',
  'admin/syllabus'
];

async function generateStaticPages() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[Build Script] dist/index.html does not exist!');
    return;
  }

  const htmlContent = fs.readFileSync(indexPath, 'utf-8');

  // Copy to 404.html for SPA fallback
  const fallback404Path = path.join(distDir, '404.html');
  fs.writeFileSync(fallback404Path, htmlContent, 'utf-8');
  console.log('[Build Script] Created dist/404.html static fallback');

  // Generate static pages and subfolder index.html for all routes
  for (const route of routes) {
    // 1. Route as filename: dist/signin.html (handling nested routes like admin/requests.html)
    const fileRoutePath = path.join(distDir, `${route}.html`);
    const fileParentDir = path.dirname(fileRoutePath);
    if (!fs.existsSync(fileParentDir)) {
      fs.mkdirSync(fileParentDir, { recursive: true });
    }
    fs.writeFileSync(fileRoutePath, htmlContent, 'utf-8');

    // 2. Route as subfolder: dist/signin/index.html
    const dirRoutePath = path.join(distDir, route);
    if (!fs.existsSync(dirRoutePath)) {
      fs.mkdirSync(dirRoutePath, { recursive: true });
    }
    fs.writeFileSync(path.join(dirRoutePath, 'index.html'), htmlContent, 'utf-8');
  }

  console.log(`[Build Script] Successfully generated static HTML pages for ${routes.length} routes.`);
}

generateStaticPages().catch(err => {
  console.error('[Build Script] Error generating static pages:', err);
});
