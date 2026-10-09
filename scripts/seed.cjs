const fs = require('node:fs');
const path = require('node:path');
const { buildSeed } = require('../lib/seed.cjs');

const out = path.join(__dirname, '..', 'data', 'db.json');
const seed = buildSeed();
seed.updatedAt = new Date().toISOString();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(seed, null, 2), 'utf8');
console.log('تمت تهيئة قاعدة البيانات في', out);
console.log('حسابات تجريبية: admin/Admin123! | programs/Manager123! | reviewer/Review123!');
