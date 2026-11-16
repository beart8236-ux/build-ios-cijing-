// Downloads libs once, then generates BOTH app/ (Electron, macOS) and www/ (Capacitor, iOS/iPadOS) from source.html.
const fs = require('fs'), path = require('path'), https = require('https'), crypto = require('crypto');
const ROOT = __dirname, TARGETS = ['app', 'www'];
const FILES = [
  { name: 'pdf.min.js', mark: 'pdfjsLib', urls: ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'] },
  { name: 'pdf.worker.min.js', mark: 'WorkerMessageHandler', urls: ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'] },
  { name: 'jszip.min.js', mark: 'JSZip', urls: ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'] },
  { name: 'docx-preview.min.js', mark: 'docx', urls: ['https://cdn.jsdelivr.net/npm/docx-preview@0.3/dist/docx-preview.min.js', 'https://unpkg.com/docx-preview@0.3/dist/docx-preview.min.js'] },
];
function get(url, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'yves-cijing-build' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && depth < 5) { res.resume(); return resolve(get(new URL(res.headers.location, url).href, depth + 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const c = []; res.on('data', d => c.push(d)); res.on('end', () => resolve(Buffer.concat(c)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', reject);
  });
}
const valid = (buf, f) => buf.length > 10000 && buf.toString('utf8').includes(f.mark);
async function fetchAll() {
  const cache = path.join(ROOT, 'app', 'vendor'); fs.mkdirSync(cache, { recursive: true });
  for (const f of FILES) {
    const dest = path.join(cache, f.name);
    if (fs.existsSync(dest) && valid(fs.readFileSync(dest), f)) { console.log('[cached] ' + f.name); continue; }
    let ok = false;
    for (const u of f.urls) {
      for (let a = 1; a <= 3 && !ok; a++) {
        try { console.log(`[download] ${f.name} <- ${u} (try ${a}/3)`); const buf = await get(u); if (!valid(buf, f)) throw new Error('content check failed');
          fs.writeFileSync(dest, buf); console.log(`  ok ${buf.length} bytes sha256=${crypto.createHash('sha256').update(buf).digest('hex')}`); ok = true; }
        catch (e) { console.log('  failed: ' + e.message); }
      }
      if (ok) break;
    }
    if (!ok) throw new Error('Could not download ' + f.name);
  }
}
function transform(html) {
  const re = /const LIBS = \{[\s\S]*?\n\};\s*\nconst libDone/;
  if (!re.test(html)) throw new Error('LIBS block not found in source.html');
  html = html.replace(re, "const LIBS = {\n  pdf: [['vendor/pdf.min.js']],\n  docx: [['vendor/jszip.min.js'], ['vendor/docx-preview.min.js']],\n};\nconst libDone");
  return html.replace('<title>LexiGlass · 词镜</title>', '<title>Yves词境</title>');
}
function build() {
  const out = transform(fs.readFileSync(path.join(ROOT, 'source.html'), 'utf8'));
  for (const t of TARGETS) {
    const dir = path.join(ROOT, t); fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
    if (t !== 'app') for (const f of FILES) fs.copyFileSync(path.join(ROOT, 'app', 'vendor', f.name), path.join(dir, 'vendor', f.name));
    fs.writeFileSync(path.join(dir, 'index.html'), out); console.log(t + '/index.html generated (' + out.length + ' chars)');
  }
}
module.exports = { transform };
if (require.main === module) fetchAll().then(build).catch(e => { console.error('ASSETS FAILED: ' + e.message); process.exit(1); });
