// التحقق برمز لمرة واحدة + سجل الإشعارات.
// وضع تجريبي موسوم بوضوح: لا يُرسل SMS/بريد حقيقي إلا عند ضبط التكاملات (انظر README).
import crypto from 'node:crypto';
import { hashCode } from './auth.js';

export const DEMO_MODE = process.env.DEMO_MODE !== 'false';
export const OTP_TTL_MS = 10 * 60 * 1000;

export function makeOtp() {
  return String(crypto.randomInt(100000, 999999));
}
export function otpSalt() {
  return crypto.randomBytes(8).toString('hex');
}
export function hashOtp(code, salt) {
  return hashCode(code, salt);
}

export function normalizeAddress(channel, address) {
  const a = String(address || '').trim();
  if (channel === 'email') return a.toLowerCase();
  // هاتف: إبقاء الأرقام و+ فقط
  return a.replace(/[^\d+]/g, '');
}

export function validateChannelAddress(channel, address) {
  const a = String(address || '').trim();
  if (channel === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) return 'اكتب بريداً إلكترونياً صحيحاً، مثال: name@example.com';
    return null;
  }
  const digits = a.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'اكتب رقم هاتف صحيحاً مع رمز الدولة، مثال: ‎+9677XXXXXXXX';
  return null;
}

// قالب رسالة عربية للرمز
export function otpMessage(code, programTitle) {
  return `رمز التحقق الخاص ببوابة EFE-Yemen هو: ${code}. صالح لمدة 10 دقائق.${programTitle ? ' للبرنامج: ' + programTitle : ''} لا تشاركه مع أحد.`;
}

export function pushOutbox(db, { channel, to, subject, body, kind, meta }) {
  const entry = {
    id: 'msg_' + Date.now().toString(36) + Math.floor(Math.random() * 9999),
    at: new Date().toISOString(),
    channel, to, subject: subject || '', body,
    kind: kind || 'notification',
    // تمييز واضح: تجريبي أم حقيقي
    status: DEMO_MODE ? 'تجريبي — مسجّل فقط ولم يُرسَل فعلياً' : 'مُرسَل عبر الخدمة المُعدّة',
    demo: DEMO_MODE,
    meta: meta || {}
  };
  db.outbox.unshift(entry);
  db.outbox = db.outbox.slice(0, 1000);
  return entry;
}
