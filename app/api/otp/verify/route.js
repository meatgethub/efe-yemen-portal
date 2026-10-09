import { NextResponse } from 'next/server';
import { readDB, writeDB } from '../../../../lib/db';
import { OTP_TTL_MS, normalizeAddress, validateChannelAddress, hashOtp } from '../../../../lib/otp';
import { applicantCookiePayload, sign } from '../../../../lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const channel = body.channel === 'email' ? 'email' : 'phone';
  const address = normalizeAddress(channel, body.address);
  const code = String(body.code || '').replace(/\D/g, '');
  const err = validateChannelAddress(channel, address);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (code.length !== 6) return NextResponse.json({ error: 'أدخل الرمز المكوّن من 6 أرقام.' }, { status: 400 });

  const db = readDB();
  const candidates = db.otps.filter((o) => o.address === address && o.channel === channel && !o.used)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  const otp = candidates[0];
  if (!otp) return NextResponse.json({ error: 'لا يوجد رمز فعّال لهذه الوسيلة. اطلب رمزاً جديداً.' }, { status: 400 });
  // انتهاء الصلاحية
  if (Date.now() - new Date(otp.at).getTime() > OTP_TTL_MS) {
    return NextResponse.json({ error: 'انتهت صلاحية الرمز (10 دقائق). اطلب رمزاً جديداً.' }, { status: 400 });
  }
  otp.attempts = (otp.attempts || 0) + 1;
  if (otp.attempts > 5) {
    otp.used = true; writeDB(db);
    return NextResponse.json({ error: 'تجاوزت عدد المحاولات. اطلب رمزاً جديداً.' }, { status: 400 });
  }
  if (hashOtp(code, otp.salt) !== otp.hash) {
    writeDB(db);
    return NextResponse.json({ error: 'الرمز غير صحيح. تحقق وحاول مجدداً.' }, { status: 400 });
  }
  otp.used = true;
  writeDB(db);
  const token = applicantCookiePayload({ channel, address });
  const res = NextResponse.json({ ok: true, token, message: 'تم التحقق بنجاح.' });
  res.cookies.set('efe_applicant', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
