import { NextResponse } from 'next/server';
import { readDB, writeDB, newId } from '../../../../lib/db';
import { DEMO_MODE, makeOtp, otpSalt, hashOtp, normalizeAddress, validateChannelAddress, otpMessage, pushOutbox } from '../../../../lib/otp';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const channel = body.channel === 'email' ? 'email' : 'phone';
  const address = normalizeAddress(channel, body.address);
  const err = validateChannelAddress(channel, address);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const db = readDB();
  // حد المعدل: 5 طلبات خلال 15 دقيقة لنفس الوسيلة
  const windowStart = Date.now() - 15 * 60 * 1000;
  const recent = db.otps.filter((o) => o.address === address && new Date(o.at).getTime() > windowStart);
  if (recent.length >= 5) {
    return NextResponse.json({ error: 'طلبت رموزاً كثيرة خلال وقت قصير. انتظر 15 دقيقة ثم حاول مجدداً.' }, { status: 429 });
  }

  const code = makeOtp();
  const salt = otpSalt();
  db.otps.push({ id: newId('otp'), channel, address, salt, hash: hashOtp(code, salt), at: new Date().toISOString(), attempts: 0, used: false });
  db.otps = db.otps.slice(-500);

  const entry = pushOutbox(db, {
    channel, to: address,
    subject: 'رمز التحقق — بوابة EFE-Yemen',
    body: otpMessage(code, body.programTitle || ''),
    kind: 'otp',
    meta: { demo: DEMO_MODE }
  });
  writeDB(db);

  // تمييز واضح: تجريبي أم حقيقي
  if (DEMO_MODE) {
    return NextResponse.json({
      ok: true, demo: true, demoCode: code,
      message: `وضع تجريبي: هذا الرمز للعرض فقط ولم يُرسَل فعلياً إلى ${address}. أدخله للمتابعة. (سُجِّل في سجل الإشعارات رقم ${entry.id})`
    });
  }
  // الإنتاج: لا نعيد الرمز أبداً — أُرسل عبر الخدمة المُعدّة
  return NextResponse.json({ ok: true, demo: false, message: `أُرسل الرمز إلى ${address}. صالح لمدة 10 دقائق.` });
}
