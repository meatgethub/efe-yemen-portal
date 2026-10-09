import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { readDB } from '../../../lib/db';
import { ALLOWED_EXT, MAX_FILE_MB } from '../../../lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const slotId = String(form.get('slotId') || 'doc');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'اختر ملفاً لرفعه.' }, { status: 400 });
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: `نوع الملف غير مقبول. المقبول: ${ALLOWED_EXT.join('، ')}.` }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `حجم الملف كبير. الحد الأقصى ${MAX_FILE_MB} ميجابايت.` }, { status: 400 });
    }
    const safe = Date.now().toString(36) + '_' + String(file.name).replace(/[^a-zA-Z0-9_.\-ء-غف-ي]/g, '_').slice(0, 80);
    const dir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safe), Buffer.from(bytes));
    return NextResponse.json({ ok: true, file: { slotId, name: file.name, storedAs: safe, url: '/uploads/' + safe, size: bytes.byteLength } });
  } catch (e) {
    return NextResponse.json({ error: 'فشل رفع الملف. تحقق من الاتصال وحاول مجدداً.' }, { status: 500 });
  }
}
