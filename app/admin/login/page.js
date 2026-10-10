'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffLogin, DEMO_STAFF } from '../../../lib/static-store';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  function submit(e) {
    e.preventDefault();
    const r = staffLogin(username, password);
    if (!r.ok) { setErr(r.error); return; }
    router.push('/admin');
  }
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1>دخول الطاقم (تجريبي)</h1>
      <div className="notice warn">نسخة Pages: تحقق محلي داخل المتصفح فقط وليس حماية حقيقية. الحسابات التجريبية:<br /><span dir="ltr">admin / Admin123! — programs / Manager123! — reviewer / Review123!</span></div>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="u">اسم المستخدم</label><input id="u" type="text" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div className="field"><label htmlFor="p">كلمة المرور</label><input id="p" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <div className="error-text" role="alert">{err}</div>}
        <button className="btn btn-primary" type="submit">دخول</button>
      </form>
      <p className="small">عدد الحسابات التجريبية: {DEMO_STAFF.length}. <Link href="/admin">لوحة الإدارة</Link></p>
    </div>
  );
}
