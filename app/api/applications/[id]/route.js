import { NextResponse } from 'next/server';
import { readDB, writeDB, logActivity } from '../../../../lib/db';
import { verify } from '../../../../lib/auth';

// إجراءات المتقدم على طلبه: تأكيد/اعتذار عن المقعد
export async function PATCH(req, { params }) {
  const body = await req.json().catch(() => ({}));
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '');
  const t = req.cookies.get('efe_applicant')?.value || bearer || new URL(req.url).searchParams.get('token');
  const me = t ? verify(t) : null;
  if (!me || me.kind !== 'applicant') return NextResponse.json({ error: 'سجّل الدخول برمز التحقق أولاً.' }, { status: 401 });
  const db = readDB();
  const app = db.applications.find((a) => a.id === params.id);
  if (!app) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });
  if (app.address !== me.address) return NextResponse.json({ error: 'هذا الطلب لا يخص وسيلة التواصل الحالية.' }, { status: 403 });

  const action = body.action;
  if (action === 'confirm') {
    if (app.status !== 'accepted') return NextResponse.json({ error: 'التأكيد متاح للمقبولين فقط.' }, { status: 400 });
    app.status = 'enrolled';
    app.enrollment.confirmed = true;
    app.history.push({ at: new Date().toISOString(), action: 'تأكيد المقعد من المتقدم', by: app.fullName });
    logActivity(db, { actor: app.fullName, role: 'متقدم', action: 'تأكيد المقعد', entity: 'application', entityId: app.reference, detail: '' });
  } else if (action === 'decline') {
    if (!['accepted', 'enrolled'].includes(app.status)) return NextResponse.json({ error: 'الاعتذار متاح للمقبولين فقط.' }, { status: 400 });
    app.status = 'declined';
    app.history.push({ at: new Date().toISOString(), action: 'اعتذار عن المقعد', by: app.fullName });
    logActivity(db, { actor: app.fullName, role: 'متقدم', action: 'اعتذار عن المقعد', entity: 'application', entityId: app.reference, detail: '' });
  } else {
    return NextResponse.json({ error: 'إجراء غير معروف.' }, { status: 400 });
  }
  app.updatedAt = new Date().toISOString();
  writeDB(db);
  return NextResponse.json({ ok: true });
}
