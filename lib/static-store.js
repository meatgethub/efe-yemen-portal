// مخزن النسخة الثابتة (GitHub Pages): كل البيانات في متصفح الزائر فقط — للعرض والتجربة.
// موسوم بوضوح كوضع تجريبي: لا خادم، لا إرسال فعلي، لا مشاركة بيانات بين الأجهزة.
import { programAvailability } from './constants';

const KEY = 'efe_static_v1';
const OTP_TTL = 10 * 60 * 1000;

export const DEMO_STAFF = [
  { username: 'admin', password: 'Admin123!', role: 'admin', name: 'مدير النظام (تجريبي)' },
  { username: 'programs', password: 'Manager123!', role: 'program_manager', name: 'مديرة البرامج (تجريبي)' },
  { username: 'reviewer', password: 'Review123!', role: 'مراجع (تجريبي)' }
];

function empty() {
  return { apps: [], otps: [], outbox: [], activity: [], overrides: {}, applicant: null, staff: null, seq: 1000 };
}
export function load() {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') return { ...empty(), ...raw };
  } catch {}
  return empty();
}
export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
function rid(p) {
  return p + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

// البرامج: الأساس من site.json + تعديلات الطاقم المحلية
export function getPrograms(site) {
  const s = load();
  const base = [...site.programs.map((p) => ({ ...p })), ...Object.values(s.overrides).filter((o) => !site.programs.some((p) => p.id === o.id))];
  return base
    .filter((p) => !(s.overrides[p.id]?.deleted))
    .map((p) => ({ ...p, ...(s.overrides[p.id] || {}), id: p.id }))
    .map((p) => ({ ...p, _av: programAvailability(p) }));
}
export function upsertProgram(p) {
  const s = load();
  const id = p.id || rid('prog');
  s.overrides[id] = { ...p, id };
  log(s, 'طاقم (تجريبي)', 'staff', 'حفظ برنامج', 'program', id, p.title);
  save(s);
  return id;
}
export function setProgramStatus(id, status) {
  const s = load();
  s.overrides[id] = { ...(s.overrides[id] || {}), id, status };
  log(s, 'طاقم (تجريبي)', 'staff', 'تغيير حالة برنامج إلى ' + status, 'program', id, '');
  save(s);
}

// رمز تحقق تجريبي: يُعرض على الشاشة فقط
export function requestOtp(channel, address) {
  const a = String(address || '').trim();
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) return { error: 'اكتب بريداً إلكترونياً صحيحاً.' };
  if (channel !== 'email' && a.replace(/\D/g, '').length < 7) return { error: 'اكتب رقم هاتف صحيحاً مع رمز الدولة.' };
  const s = load();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  s.otps.push({ channel, address: a.toLowerCase(), code, at: Date.now(), attempts: 0, used: false });
  s.otps = s.otps.slice(-20);
  s.outbox.unshift({ id: rid('msg'), at: new Date().toISOString(), channel, to: a, subject: 'رمز التحقق', body: 'رمزك: ' + code, status: 'تجريبي — يعرض على الشاشة فقط' });
  save(s);
  return { ok: true, demoCode: code };
}
export function verifyOtp(channel, address, code) {
  const a = String(address || '').trim().toLowerCase();
  const s = load();
  const o = [...s.otps].reverse().find((x) => x.address === a && x.channel === channel && !x.used);
  if (!o) return { error: 'لا يوجد رمز فعّال. اطلب رمزاً جديداً.' };
  if (Date.now() - o.at > OTP_TTL) return { error: 'انتهت صلاحية الرمز (10 دقائق).' };
  o.attempts++;
  if (o.attempts > 5) { o.used = true; save(s); return { error: 'تجاوزت المحاولات. اطلب رمزاً جديداً.' }; }
  if (o.code !== String(code).replace(/\D/g, '')) { save(s); return { error: 'الرمز غير صحيح.' }; }
  o.used = true;
  s.applicant = { channel, address: a, exp: Date.now() + 30 * 24 * 3600 * 1000 };
  save(s);
  return { ok: true };
}
export function applicant() {
  const s = load();
  if (!s.applicant || Date.now() > s.applicant.exp) return null;
  return s.applicant;
}
export function logoutApplicant() {
  const s = load(); s.applicant = null; save(s);
}

// الطلبات
export function submitApplication(program, form) {
  const me = applicant();
  if (!me) return { error: 'أكمل التحقق أولاً.' };
  const s = load();
  const dup = s.apps.find((x) => x.programId === program.id && x.address === me.address && !['rejected', 'declined'].includes(x.status));
  if (dup && dup.key !== form.idempotencyKey) return { error: `لديك طلب سابق لهذا البرنامج بالرقم ${dup.reference}.`, status: 409 };
  if (form.idempotencyKey) {
    const same = s.apps.find((x) => x.key === form.idempotencyKey);
    if (same) return { ok: true, app: same };
  }
  s.seq += 1;
  const app = {
    id: rid('app'), reference: 'EFE-2026-' + String(s.seq).padStart(4, '0'),
    programId: program.id, programTitle: program.title,
    channel: me.channel, address: me.address,
    fullName: form.fullName, age: form.age, city: form.city, education: form.education,
    employment: form.employment, motivation: form.motivation, availability: form.availability,
    customAnswers: form.customAnswers || {}, documents: form.documents || [],
    status: 'submitted', scores: [], internalNotes: [], applicantMessages: [],
    reviewer: '', nextSteps: 'طلبك قيد الانتظار للمراجعة (وضع تجريبي).',
    key: form.idempotencyKey || '', enrollment: { confirmed: false, deadline: '', instructions: program.enrollmentInfo?.instructions || '' },
    createdAt: new Date().toISOString()
  };
  s.apps.unshift(app);
  log(s, app.fullName, 'متقدم', 'تقديم طلب جديد', 'application', app.reference, program.title);
  save(s);
  return { ok: true, app };
}
export function myApps() {
  const me = applicant();
  if (!me) return [];
  return load().apps.filter((a) => a.address === me.address);
}
export function confirmEnrollment(id, action) {
  const s = load();
  const a = s.apps.find((x) => x.id === id);
  if (!a) return { error: 'غير موجود.' };
  if (action === 'confirm' && a.status === 'accepted') { a.status = 'enrolled'; a.enrollment.confirmed = true; }
  else if (action === 'decline' && ['accepted', 'enrolled'].includes(a.status)) { a.status = 'declined'; }
  else return { error: 'غير متاح لهذه الحالة.' };
  log(s, a.fullName, 'متقدم', action === 'confirm' ? 'تأكيد المقعد' : 'اعتذار عن المقعد', 'application', a.reference, '');
  save(s);
  return { ok: true };
}

// الطاقم (تجريبي محلي فقط — يتحقق داخل المتصفح)
export function staffLogin(username, password) {
  const u = DEMO_STAFF.find((x) => x.username === String(username).trim() && x.password === password);
  if (!u) return { error: 'بيانات الدخول غير صحيحة.' };
  const s = load();
  s.staff = { username: u.username, role: u.role, name: u.name };
  save(s);
  return { ok: true, staff: s.staff };
}
export function staff() { return load().staff; }
export function staffLogout() { const s = load(); s.staff = null; save(s); }

export function allApps() { return load().apps; }
export function updateApps(ids, patch, by) {
  const s = load();
  for (const a of s.apps.filter((x) => ids.includes(x.id))) {
    if (patch.status) a.status = patch.status;
    if (patch.reviewer !== undefined) a.reviewer = patch.reviewer;
    if (patch.applicantMessage) a.applicantMessages.push({ at: new Date().toISOString(), by, body: patch.applicantMessage });
    if (patch.nextSteps !== undefined) a.nextSteps = patch.nextSteps;
  }
  log(s, by, 'staff', 'تحديث طلبات (' + ids.length + ')', 'application', ids.join(','), patch.status || '');
  save(s);
}
export function addScore(id, criteria, total, note, by) {
  const s = load();
  const a = s.apps.find((x) => x.id === id);
  if (!a) return;
  a.scores.push({ at: new Date().toISOString(), by, criteria, total });
  if (note) a.internalNotes.push({ at: new Date().toISOString(), by, body: note });
  log(s, by, 'staff', 'تسجيل درجة', 'application', a.reference, '');
  save(s);
}
export function notify(ids, body, by) {
  const s = load();
  const targets = s.apps.filter((a) => ids.includes(a.id));
  for (const a of targets) {
    s.outbox.unshift({ id: rid('msg'), at: new Date().toISOString(), channel: a.channel, to: a.address, subject: 'تحديث حول طلبك', body, status: 'تجريبي — مسجّل فقط ولم يُرسَل' });
    a.applicantMessages.push({ at: new Date().toISOString(), by, body });
  }
  log(s, by, 'staff', 'إشعار تجريبي', 'notification', '', `إلى ${targets.length} متقدم`);
  save(s);
}
export function getOutbox() { return load().outbox; }
export function getActivity() { return load().activity; }
function log(s, actor, role, action, entity, entityId, detail) {
  s.activity.unshift({ id: rid('log'), at: new Date().toISOString(), actor, role, action, entity, entityId, detail });
  s.activity = s.activity.slice(0, 500);
}
export function toCSV(list) {
  const head = ['reference', 'program', 'fullName', 'channel', 'address', 'age', 'city', 'education', 'employment', 'status', 'reviewer', 'createdAt'];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [head.join(',')];
  for (const a of list) lines.push([a.reference, a.programTitle, a.fullName, a.channel, a.address, a.age, a.city, a.education, a.employment, a.status, a.reviewer || '', a.createdAt].map(esc).join(','));
  return '﻿' + lines.join('\n');
}
