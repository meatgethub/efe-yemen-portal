// تخزين دائم خفيف: ملف JSON + ملفات مرفوعة على القرص.
// مناسب للتشغيل الداخلي للمنظمة. للإنتاج الواسع يُنقل إلى Postgres (انظر README).
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const up = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(up)) fs.mkdirSync(up, { recursive: true });
}

export function readDB() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    const seed = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seed.json'), 'utf8'));
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    const seed = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seed.json'), 'utf8'));
    return seed;
  }
}

export function writeDB(db) {
  ensureDir();
  db.updatedAt = new Date().toISOString();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
  return db;
}

export function logActivity(db, { actor, role, action, entity, entityId, detail }) {
  db.activity.unshift({
    id: 'log_' + Date.now().toString(36) + Math.floor(Math.random() * 999),
    at: new Date().toISOString(),
    actor: actor || 'النظام',
    role: role || '—',
    action, entity: entity || '', entityId: entityId || '', detail: detail || ''
  });
  db.activity = db.activity.slice(0, 1000);
}

export function newId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
