import { NextResponse } from 'next/server';
import { readDB, writeDB, logActivity } from '../../../../lib/db';
import { staffFromRequest } from '../../../../lib/staff';
import { STATUS_LABELS } from '../../../../lib/constants';
import { pushOutbox, DEMO_MODE } from '../../../../lib/otp';

// بحث الطلبات + تحديث فردي/جماعي + تقييم + رسائل
export async function GET(req) {
  const me = staffFromRequest(req);
  if (!me) return NextResponse.json({ error: 'غير مسموح.' }, { status: 401 });
  const url = new URL(req.url);
  const programId = url.searchParams.get('programId') || '';
  const status = url.searchParams.get('status') || '';
  const q = (url.searchParams.get('q') || '').trim();
  const db = readDB();
  let list = [...db.applications];
  if (programId) list = list.filter((a) => a.programId === programId);
  if (status) list = list.filter((a) => a.status === status);
  if (q) list = list.filter((a) => (a.fullName + ' ' + a.reference + ' ' + a.address).includes(q));
  return NextResponse.json({ applications: list, programs: db.programs.map((p) => ({ id: p.id, title: p.title })) });
}

export async function PATCH(req) {
  const me = staffFromRequest(req);
  if (!me) return NextResponse.json({ error: 'غير مسموح.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = readDB();
  const ids = Array.isArray(body.ids) ? body.ids : [body.id].filter(Boolean);

  // تعيين مراجع
  if (body.reviewer !== undefined) {
    for (const a of db.applications.filter((x) => ids.includes(x.id))) {
      a.reviewer = body.reviewer; a.updatedAt = new Date().toISOString();
      a.history.push({ at: new Date().toISOString(), action: 'تعيين مراجع: ' + body.reviewer, by: me.name });
    }
    logActivity(db, { actor: me.name, role: me.role, action: 'تعيين مراجع', entity: 'application', entityId: ids.join(','), detail: body.reviewer });
    writeDB(db);
    return NextResponse.json({ ok: true });
  }
  // درجة / ملاحظة داخلية (منفصلة عن رسائل المتقدم)
  if (body.score) {
    const a = db.applications.find((x) => x.id === body.id);
    if (!a) return NextResponse.json({ error: 'غير موجود.' }, { status: 404 });
    a.scores.push({ at: new Date().toISOString(), by: me.name, criteria: body.score.criteria || {}, total: body.score.total || 0 });
    if (body.internalNote) a.internalNotes.push({ at: new Date().toISOString(), by: me.name, body: String(body.internalNote) });
    a.history.push({ at: new Date().toISOString(), action: 'تسجيل درجة', by: me.name });
    logActivity(db, { actor: me.name, role: me.role, action: 'تسجيل درجة', entity: 'application', entityId: a.reference, detail: '' });
    writeDB(db);
    return NextResponse.json({ ok: true });
  }
  // رسالة للمتقدم (ظاهرة له) + تحديث حالة
  if (body.status || body.applicantMessage || body.nextSteps !== undefined) {
    const allowed = ['under_review', 'shortlisted', 'waitlisted', 'accepted', 'rejected', 'submitted'];
    for (const a of db.applications.filter((x) => ids.includes(x.id))) {
      if (body.status) {
        if (!allowed.includes(body.status)) continue;
        a.status = body.status;
        a.history.push({ at: new Date().toISOString(), action: 'تغيير الحالة إلى ' + (STATUS_LABELS[body.status] || body.status), by: me.name });
      }
      if (body.applicantMessage) a.applicantMessages.push({ at: new Date().toISOString(), by: me.name, body: String(body.applicantMessage) });
      if (body.nextSteps !== undefined) a.nextSteps = String(body.nextSteps);
      if (body.enrollmentDeadline !== undefined) a.enrollment.deadline = String(body.enrollmentDeadline);
      a.updatedAt = new Date().toISOString();
    }
    logActivity(db, { actor: me.name, role: me.role, action: 'تحديث حالة/رسالة (' + ids.length + ')', entity: 'application', entityId: ids.join(','), detail: body.status || '' });
    writeDB(db);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'لا يوجد إجراء.' }, { status: 400 });
}

// إشعار تجريبي/حقيقي + تسجيل في الصادر
export async function POST(req) {
  const me = staffFromRequest(req);
  if (!me) return NextResponse.json({ error: 'غير مسموح.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = readDB();
  const targets = db.applications.filter((a) => (body.ids || []).includes(a.id));
  if (!targets.length) return NextResponse.json({ error: 'اختر طلباً واحداً على الأقل.' }, { status: 400 });
  if (!body.body || String(body.body).trim().length < 5) return NextResponse.json({ error: 'اكتب نص الرسالة.' }, { status: 400 });
  const sent = [];
  for (const a of targets) {
    const entry = pushOutbox(db, {
      channel: a.channel, to: a.address, subject: body.subject || 'تحديث حول طلبك — EFE-Yemen',
      body: String(body.body), kind: 'staff-message', meta: { application: a.reference, by: me.name }
    });
    a.applicantMessages.push({ at: new Date().toISOString(), by: me.name, body: String(body.body) });
    sent.push(entry.id);
  }
  logActivity(db, { actor: me.name, role: me.role, action: DEMO_MODE ? 'إشعار تجريبي (مسجّل فقط)' : 'إرسال إشعار', entity: 'notification', entityId: sent.join(','), detail: `إلى ${targets.length} متقدم` });
  writeDB(db);
  return NextResponse.json({ ok: true, demo: DEMO_MODE, ids: sent, message: DEMO_MODE ? 'وضع تجريبي: سُجِّلت الرسائل في سجل الصادر ولم تُرسَل فعلياً.' : 'أُرسلت الرسائل عبر الخدمة المُعدّة.' });
}
