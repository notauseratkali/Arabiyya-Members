import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '../dist');

// Copy dist/assets to ./assets
const distAssets = path.join(distDir, 'assets');
const rootAssets = path.join(rootDir, 'assets');

if (fs.existsSync(distAssets)) {
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
  console.log('[Sync Root] Copied dist/assets to ./assets');
}

// Copy dist/index.html to ./index.html and ./404.html
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  const content = fs.readFileSync(distIndex, 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'index.html'), content, 'utf-8');
  fs.writeFileSync(path.join(rootDir, '404.html'), content, 'utf-8');
  console.log('[Sync Root] Updated root ./index.html and ./404.html with compiled production bundle');
}
