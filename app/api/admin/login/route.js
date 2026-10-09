import { NextResponse } from 'next/server';
import { readDB } from '../../../../lib/db';
import { checkPassword, staffCookiePayload } from '../../../../lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body;
  if (!username || !password) return NextResponse.json({ error: 'اكتب اسم المستخدم وكلمة المرور.' }, { status: 400 });
  const db = readDB();
  const u = db.staff.find((s) => s.username === String(username).trim());
  if (!u || !checkPassword(password, u.salt, u.passwordHash)) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
  }
  const token = staffCookiePayload({ username: u.username, role: u.role, name: u.name });
  const res = NextResponse.json({ ok: true, role: u.role, name: u.name });
  res.cookies.set('efe_staff', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('efe_staff', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
