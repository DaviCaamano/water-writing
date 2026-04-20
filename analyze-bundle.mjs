import fs from 'fs';

const buf = fs.readFileSync('web/.next/diagnostics/analyze/data/analyze.data');
const raw = buf.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
const jsonStart = raw.indexOf('{"sources"');
const data = JSON.parse(raw.slice(jsonStart));

const pkgSizes = {};
(data.sources || []).forEach(s => {
  if (!s.size) return;
  const path = s.path || '';
  let pkg = '[app code]';
  const m = path.match(/node_modules\/(?:\.bun\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)\//);
  if (m) pkg = m[1];
  pkgSizes[pkg] = (pkgSizes[pkg] || 0) + s.size;
});

console.log('\nBundle size by package (uncompressed source):\n');
Object.entries(pkgSizes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([pkg, size]) => {
    const kb = (size / 1024).toFixed(1).padStart(8);
    console.log(`${kb} KB  ${pkg}`);
  });
