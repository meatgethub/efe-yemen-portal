import { NextResponse } from 'next/server';
import { readDB } from '../../../../lib/db';
import { staffFromRequest } from '../../../../lib/staff';

export async function GET(req) {
  const me = staffFromRequest(req);
  if (!me) return NextResponse.json({ error: 'غير مسموح.' }, { status: 401 });
  const db = readDB();
  return NextResponse.json({ activity: db.activity || [], outbox: db.outbox || [] });
}
