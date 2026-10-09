import { NextResponse } from 'next/server';
import { readDB } from '../../../lib/db';
import { programAvailability } from '../../../lib/constants';

export async function GET() {
  const db = readDB();
  const list = db.programs.map((p) => ({ ...p, _av: programAvailability(p) }));
  return NextResponse.json({ programs: list, timezone: 'Asia/Aden' });
}
