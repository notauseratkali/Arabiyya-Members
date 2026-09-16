import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
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

function safeWriteFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
  const parent = path.dirname(filePath);
  if (fs.existsSync(parent) && !fs.statSync(parent).isDirectory()) {
    fs.rmSync(parent, { force: true });
  }
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

async function syncRootAndRoutes() {
  const distIndex = path.join(distDir, 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('[Sync Root] dist/index.html does not exist!');
    return;
  }

  const compiledHtml = fs.readFileSync(distIndex, 'utf-8');

  // 1. Sync dist/404.html
  safeWriteFile(path.join(distDir, '404.html'), compiledHtml);
  console.log('[Sync Root] Created dist/404.html with compiled bundle');

  // 2. Sync root assets and root files
  const distAssets = path.join(distDir, 'assets');
  const rootAssets = path.join(rootDir, 'assets');

  if (fs.existsSync(distAssets)) {
    if (fs.existsSync(rootAssets)) {
      fs.rmSync(rootAssets, { recursive: true, force: true });
    }
    fs.cpSync(distAssets, rootAssets, { recursive: true });
    console.log('[Sync Root] Copied dist/assets to ./assets');
  }

  safeWriteFile(path.join(rootDir, 'index.html'), compiledHtml);
  safeWriteFile(path.join(rootDir, '404.html'), compiledHtml);
  console.log('[Sync Root] Updated root ./index.html and ./404.html with compiled production bundle');

  // 3. Create static HTML routes in both dist/ and root for direct path matching on static hosts
  for (const route of routes) {
    // Single HTML file: e.g. dist/signin.html and ./signin.html
    safeWriteFile(path.join(distDir, `${route}.html`), compiledHtml);
    safeWriteFile(path.join(rootDir, `${route}.html`), compiledHtml);

    // Directory index file: e.g. dist/signin/index.html and ./signin/index.html
    safeWriteFile(path.join(distDir, route, 'index.html'), compiledHtml);
    safeWriteFile(path.join(rootDir, route, 'index.html'), compiledHtml);
  }

  console.log(`[Sync Root] Successfully generated static pages for ${routes.length} routes.`);
}

syncRootAndRoutes().catch(err => {
  console.error('[Sync Root] Error during synchronization:', err);
  process.exit(1);
});
