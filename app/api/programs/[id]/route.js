import { NextResponse } from 'next/server';
import { readDB } from '../../../../lib/db';
import { programAvailability } from '../../../../lib/constants';

export async function GET(_req, { params }) {
  const db = readDB();
  const p = db.programs.find((x) => x.id === params.id);
  if (!p) return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 404 });
  return NextResponse.json({ program: { ...p, _av: programAvailability(p) } });
}
