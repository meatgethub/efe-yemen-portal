import { NextResponse } from 'next/server';
import { readDB, writeDB, logActivity } from '../../../../../lib/db';
import { staffFromRequest, can } from '../../../../../lib/staff';

export async function PATCH(req, { params }) {
  const me = staffFromRequest(req);
  if (!me || !can(me.role, 'programs.write')) return NextResponse.json({ error: 'لا تملك الصلاحية.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const db = readDB();
  const p = db.programs.find((x) => x.id === params.id);
  if (!p) return NextResponse.json({ error: 'غير موجود.' }, { status: 404 });
  if (body.status) {
    if (!['draft', 'published', 'closed', 'archived'].includes(body.status)) return NextResponse.json({ error: 'حالة غير صالحة.' }, { status: 400 });
    p.status = body.status;
    logActivity(db, { actor: me.name, role: me.role, action: 'تغيير حالة برنامج إلى ' + body.status, entity: 'program', entityId: p.id, detail: p.title });
  } else {
    Object.assign(p, body);
    logActivity(db, { actor: me.name, role: me.role, action: 'تعديل برنامج', entity: 'program', entityId: p.id, detail: p.title });
  }
  writeDB(db);
  return NextResponse.json({ ok: true, program: p });
}
