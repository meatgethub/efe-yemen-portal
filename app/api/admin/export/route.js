import { NextResponse } from 'next/server';
import { readDB } from '../../../../lib/db';
import { staffFromRequest, can } from '../../../../lib/staff';

// تصدير CSV (يُفتح في Excel) — للمخوّلين فقط
export async function GET(req) {
  const me = staffFromRequest(req);
  if (!me || !can(me.role, 'export')) return NextResponse.json({ error: 'لا تملك صلاحية التصدير.' }, { status: 403 });
  const url = new URL(req.url);
  const programId = url.searchParams.get('programId') || '';
  const db = readDB();
  const list = db.applications.filter((a) => !programId || a.programId === programId);
  const head = ['reference', 'program', 'fullName', 'channel', 'address', 'age', 'city', 'education', 'employment', 'status', 'reviewer', 'score_total', 'createdAt'];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [head.join(',')];
  for (const a of list) {
    const total = (a.scores || []).length ? a.scores[a.scores.length - 1].total : '';
    lines.push([a.reference, a.programTitle, a.fullName, a.channel, a.address, a.age, a.city, a.education, a.employment, a.status, a.reviewer || '', total, a.createdAt].map(esc).join(','));
  }
  const csv = '﻿' + lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="applications-${programId || 'all'}.csv"`
    }
  });
}
