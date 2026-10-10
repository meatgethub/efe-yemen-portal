// تحويل الروابط الداخلية <a href="/..."> إلى next/link في صفحات app (للتوافق مع basePath في Pages).
// يُستثنى: الروابط الخارجية (http) وروابط الملفات (#) وapp/api.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'app');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'api') walk(p); }
    else if (e.name === 'page.js') files.push(p);
  }
})(root);

let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const re = /<a((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/g;
  let n = 0;
  s = s.replace(re, (m, attrs, inner) => {
    if (/href="\/[^/]/.test(attrs) || /href=\{`\/[^`]/.test(attrs)) {
      n++;
      return '<Link' + attrs + '>' + inner + '</Link>';
    }
    return m;
  });
  if (n > 0) {
    if (!s.includes("from 'next/link'")) {
      s = s.replace(/('use client';\n)/, "$1import Link from 'next/link';\n");
      if (!s.includes("import Link from 'next/link'")) s = "import Link from 'next/link';\n" + s;
    }
    fs.writeFileSync(f, s, 'utf8');
    changed++;
    console.log('converted ' + n + ' in ' + path.relative(root, f));
  }
}
// إصلاحات page.js (روابط نسبية)
{
  const f = path.join(root, 'page.js');
  let s = fs.readFileSync(f, 'utf8');
  s = s.split('href={`./programs/').join('href={`/programs/');
  s = s.split('href={`./apply/').join('href={`/apply/');
  s = s.split('href="./dashboard"').join('href="/dashboard"');
  fs.writeFileSync(f, s, 'utf8');
  console.log('page.js relative links fixed');
}
console.log('files changed: ' + changed);
