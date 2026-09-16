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

function adjustAssetPaths(html, depth) {
  if (depth === 0) return html;
  const prefix = '../'.repeat(depth);

  // Replace relative paths like ./assets/ or /assets/ with prefix + assets/
  return html
    .replace(/(src|href)=["'](?:\.\/|\/)?assets\//g, `$1="${prefix}assets/`)
    .replace(/(src|href)=["'](?:\.\/|\/)?logo/g, `$1="${prefix}logo`)
    .replace(/(src|href)=["'](?:\.\/|\/)?asg_rover_logo/g, `$1="${prefix}asg_rover_logo`)
    .replace(/(src|href)=["'](?:\.\/|\/)?custom_logo/g, `$1="${prefix}custom_logo`);
}

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

  // Generate static pages for all routes
  for (const route of routes) {
    const depth = route.split('/').filter(Boolean).length;

    // 1. Single-file route: dist/signin.html (depth 0 relative to root)
    const fileRoutePath = path.join(distDir, `${route}.html`);
    const fileParentDir = path.dirname(fileRoutePath);
    if (!fs.existsSync(fileParentDir)) {
      fs.mkdirSync(fileParentDir, { recursive: true });
    }
    fs.writeFileSync(fileRoutePath, adjustAssetPaths(htmlContent, depth - 1 < 0 ? 0 : depth - 1), 'utf-8');

    // 2. Directory index route: dist/signin/index.html (depth = route folder depth)
    const dirRoutePath = path.join(distDir, route);
    if (!fs.existsSync(dirRoutePath)) {
      fs.mkdirSync(dirRoutePath, { recursive: true });
    }
    const adjustedHtml = adjustAssetPaths(htmlContent, depth);
    fs.writeFileSync(path.join(dirRoutePath, 'index.html'), adjustedHtml, 'utf-8');
  }

  console.log(`[Build Script] Successfully generated static HTML pages for ${routes.length} routes.`);
}

generateStaticPages().catch(err => {
  console.error('[Build Script] Error generating static pages:', err);
});
