import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, logActivity } from '../../../../lib/db';
import { staffFromRequest, can } from '../../../../lib/staff';

// قائمة البرامج + إنشاء (للمخوّلين)
export async function GET(req) {
  const me = staffFromRequest(req);
  if (!me) return NextResponse.json({ error: 'غير مسموح.' }, { status: 401 });
  const db = readDB();
  const counts = {};
  for (const a of db.applications) {
    counts[a.programId] = counts[a.programId] || {};
    counts[a.programId][a.status] = (counts[a.programId][a.status] || 0) + 1;
    counts[a.programId]._total = (counts[a.programId]._total || 0) + 1;
  }
  return NextResponse.json({ programs: db.programs, counts });
}

export async function POST(req) {
  const me = staffFromRequest(req);
  if (!me || !can(me.role, 'programs.write')) return NextResponse.json({ error: 'لا تملك صلاحية إدارة البرامج.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body.title || String(body.title).trim().length < 5) return NextResponse.json({ error: 'اكتب عنوان البرنامج (5 أحرف على الأقل).' }, { status: 400 });
  const db = readDB();
  const p = {
    id: body.id || newId('prog'),
    title: String(body.title).trim(),
    field: body.field || '', location: body.location || '', delivery: body.delivery || 'حضوري',
    status: body.status || 'draft', capacity: Number(body.capacity) || 0, cost: body.cost || 'مجاني',
    startDate: body.startDate || '', endDate: body.endDate || '', schedule: body.schedule || '', venue: body.venue || '',
    applicationOpenDate: body.applicationOpenDate || '', applicationDeadline: body.applicationDeadline || '',
    summary: body.summary || '', description: body.description || '',
    eligibility: Array.isArray(body.eligibility) ? body.eligibility : String(body.eligibility || '').split('\n').map((s) => s.trim()).filter(Boolean),
    formConfig: {
      customQuestions: body.formConfig?.customQuestions || [],
      requiredDocuments: body.formConfig?.requiredDocuments || [],
      scoringCriteria: body.formConfig?.scoringCriteria || []
    },
    enrollmentInfo: body.enrollmentInfo || { instructions: '', documents: [], announcements: [] }
  };
  const i = db.programs.findIndex((x) => x.id === p.id);
  if (i >= 0) db.programs[i] = p; else db.programs.unshift(p);
  logActivity(db, { actor: me.name, role: me.role, action: i >= 0 ? 'تعديل برنامج' : 'إنشاء برنامج', entity: 'program', entityId: p.id, detail: p.title });
  writeDB(db);
  return NextResponse.json({ ok: true, program: p });
}
