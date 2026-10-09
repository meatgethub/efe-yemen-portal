'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  async function submit(e) {
    e.preventDefault(); setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || 'تعذر الدخول.'); return; }
    router.push('/admin');
  }
  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h1>دخول الطاقم</h1>
      <p className="small">منطقة آمنة منفصلة للطاقم المخوّل فقط (مدير / مدير برنامج / مراجع).</p>
      <div className="notice warn">حسابات تجريبية موسومة — غيّر كلمات المرور فور التشغيل:<br /><span dir="ltr">admin / Admin123! — programs / Manager123! — reviewer / Review123!</span></div>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="u">اسم المستخدم</label><input id="u" type="text" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
        <div className="field"><label htmlFor="p">كلمة المرور</label><input id="p" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {err && <div className="error-text" role="alert">{err}</div>}
        <button className="btn btn-primary" type="submit">دخول</button>
      </form>
    </div>
  );
}
