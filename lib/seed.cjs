// يبني كائن البذرة مع تجزئة كلمات مرور الطاقم (scrypt) — يُستخدم عند أول تشغيل.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function hashWithSalt(password, salt) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function buildSeed() {
  const seedFile = path.join(__dirname, '..', 'data', 'seed.json');
  const raw = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  const passwords = { admin: 'Admin123!', programs: 'Manager123!', reviewer: 'Review123!' };
  raw.staff = raw.staff.map((s) => {
    const { hash } = hashWithSalt(passwords[s.username] || 'Change123!', s.salt);
    return { ...s, passwordHash: hash };
  });
  return raw;
}

module.exports = { buildSeed };
