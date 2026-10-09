import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, logActivity } from '../../../lib/db';
import { validateApplicationInput } from '../../../lib/validators';
import { verify } from '../../../lib/auth';
import { normalizeAddress } from '../../../lib/otp';
import { programAvailability, STATUS_LABELS, STATUS_DESCRIPTIONS } from '../../../lib/constants';

function applicantFrom(req) {
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '');
  const cookie = req.cookies.get('efe_applicant')?.value || bearer;
  // دعم التوكن من localStorage عبر Authorization أيضاً
  const t = req.cookies.get('efe_applicant')?.value || bearer;
  if (!t) return null;
  const data = verify(t);
  if (!data || data.kind !== 'applicant') return null;
  return data;
}

// إنشاء طلب جديد (بعد التحقق من الرمز مسبقاً عبر جلسة المتقدم)
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const db = readDB();
  const program = db.programs.find((p) => p.id === body.programId);
  if (!program) return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 404 });
  if (programAvailability(program) !== 'open') {
    return NextResponse.json({ error: 'انتهى موعد التقديم لهذا البرنامج أو لم يفتح بعد.' }, { status: 400 });
  }
  const errors = validateApplicationInput(body, program);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'راجع الحقول المطلوبة.', errors }, { status: 400 });
  }
  const channel = body.channel;
  const address = normalizeAddress(channel, body.address);
  // منع التكرار: نفس الوسيلة + نفس البرنامج (طلب نشط)
  const dup = db.applications.find((a) => a.programId === program.id && a.address === address && !['rejected', 'declined'].includes(a.status));
  if (dup && dup.idempotencyKey !== body.idempotencyKey) {
    return NextResponse.json({ error: `لديك طلب سابق لهذا البرنامج بالرقم ${dup.reference}. تابع حالته من صفحة طلباتي بدل التقديم مجدداً.` }, { status: 409 });
  }
  if (body.idempotencyKey) {
    const same = db.applications.find((a) => a.idempotencyKey === body.idempotencyKey);
    if (same) return NextResponse.json({ ok: true, application: same });
  }
  db.counters.applicationSeq += 1;
  const ref = 'EFE-2026-' + String(db.counters.applicationSeq).padStart(4, '0');
  const app = {
    id: newId('app'),
    reference: ref,
    programId: program.id,
    programTitle: program.title,
    channel, address,
    fullName: String(body.fullName).trim(),
    age: Number(body.age), city: body.city, education: body.education, employment: body.employment,
    motivation: String(body.motivation).trim(), availability: String(body.availability).trim(),
    customAnswers: body.customAnswers || {}, documents: body.documents || [],
    status: 'submitted',
    scores: [], internalNotes: [], applicantMessages: [],
    reviewer: '', nextSteps: 'طلبك قيد الانتظار للمراجعة.',
    idempotencyKey: body.idempotencyKey || '',
    enrollment: { confirmed: false, deadline: '', checklist: [], instructions: program.enrollmentInfo?.instructions || '' },
    history: [{ at: new Date().toISOString(), action: 'إرسال الطلب', by: 'المتقدم' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  db.applications.unshift(app);
  logActivity(db, { actor: app.fullName, role: 'متقدم', action: 'تقديم طلب جديد', entity: 'application', entityId: app.reference, detail: program.title });
  writeDB(db);
  return NextResponse.json({ ok: true, application: { ...app, statusLabel: STATUS_LABELS[app.status] } });
}

// طلبات المتقدم الحالي (عبر توكن التحقق)
export async function GET(req) {
  const me = applicantFrom(req);
  // بديل: السماح بالتوكن في ?token= للتجربة
  let who = me;
  if (!who) {
    const url = new URL(req.url);
    const t = url.searchParams.get('token');
    if (t) { const d = verify(t); if (d && d.kind === 'applicant') who = d; }
  }
  if (!who) return NextResponse.json({ error: 'سجّل الدخول برمز التحقق أولاً.' }, { status: 401 });
  const db = readDB();
  const list = db.applications
    .filter((a) => a.address === who.address)
    .map((a) => {
      const prog = db.programs.find((p) => p.id === a.programId);
      return {
        ...a,
        programTitle: prog?.title || a.programTitle,
        statusLabel: STATUS_LABELS[a.status] || a.status,
        statusDescription: STATUS_DESCRIPTIONS[a.status] || '',
        schedule: prog?.schedule || '', venue: prog?.venue || '',
        enrollment: { ...(prog?.enrollmentInfo ? { instructions: prog.enrollmentInfo.instructions } : {}), ...a.enrollment }
      };
    });
  return NextResponse.json({ applications: list });
}
