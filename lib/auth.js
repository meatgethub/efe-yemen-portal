// جلسات الطاقم + تحقق المتقدمين — Node crypto فقط (بدون اعتماديات خارجية).
import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-efe-yemen';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}

export function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return body + '.' + sig;
}
export function verify(token) {
  try {
    const [body, sig] = String(token).split('.');
    if (!body || !sig) return null;
    const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
    const data = JSON.parse(unb64url(body));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

export function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}
export function checkPassword(password, salt, hash) {
  try {
    const h = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch { return false; }
}

export function hashCode(code, salt) {
  return crypto.createHmac('sha256', salt + SECRET).update(String(code)).digest('hex');
}

export function applicantCookiePayload({ channel, address }) {
  return sign({ kind: 'applicant', channel, address: String(address).trim().toLowerCase(), exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
}
export function staffCookiePayload({ username, role, name }) {
  return sign({ kind: 'staff', username, role, name, exp: Date.now() + 1000 * 60 * 60 * 12 });
}
