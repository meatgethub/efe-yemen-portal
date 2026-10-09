'use client';
import { useEffect, useState } from 'react';

export default function Enrollment() {
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState('جارٍ التحميل…');

  async function load() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('efe_applicant_token') : null;
    if (!t) { setMsg('سجّل الدخول أولاً من صفحة طلباتي برمز التحقق.'); return; }
    const r = await fetch('/api/applications?mine=1', { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) { setMsg('تعذر التحميل. سجّل الدخول من صفحة طلباتي.'); return; }
    const j = await r.json();
    setApps((j.applications || []).filter((a) => ['accepted', 'enrolled'].includes(a.status)));
    setMsg('');
  }
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    const t = localStorage.getItem('efe_applicant_token');
    const r = await fetch('/api/applications/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ action }) });
    const j = await r.json();
    if (!r.ok) { alert(j.error || 'تعذر تنفيذ الإجراء.'); return; }
    load();
  }

  return (
    <div>
      <h1>التسجيل والقبول</h1>
      <p>هذه الصفحة للمقبولين: تأكيد المقعد، واستكمال المتطلبات، وعرض الجدول والمكان والوثائق والإعلانات.</p>
      {msg && <div className="notice info" role="status">{msg} <a href="/dashboard">الانتقال إلى طلباتي</a></div>}
      {apps.length === 0 && !msg && <div className="notice info">لا توجد قبولات حالياً على هذه الوسيلة.</div>}
      {apps.map((a) => (
        <article className="card" key={a.id}>
          <h2>{a.programTitle}</h2>
          <p>الحالة: <strong>{a.statusLabel}</strong> • المرجع: <strong dir="ltr">{a.reference}</strong></p>
          {a.enrollment?.deadline && <p><strong>موعد تأكيد المقعد:</strong> {a.enrollment.deadline} (بتوقيت عدن)</p>}
          {a.enrollment?.instructions && <p>{a.enrollment.instructions}</p>}
          {a.enrollment?.checklist?.length > 0 && (
            <div><strong>المتطلبات المتبقية:</strong>
              <ul>{a.enrollment.checklist.filter((c) => !c.done).map((c, i) => <li key={i}>{c.label}</li>)}</ul>
              {a.enrollment.checklist.filter((c) => !c.done).length === 0 && <p>اكتملت جميع المتطلبات ✓</p>}
            </div>
          )}
          {a.schedule && <p><strong>الجدول والمكان:</strong> {a.schedule} — {a.venue}</p>}
          {(a.documents || []).length > 0 && <p className="small">وثائقك المرفوعة: {(a.documents || []).map((d) => d.name).join('، ')}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {a.status === 'accepted' && <><button className="btn btn-primary" onClick={() => act(a.id, 'confirm')}>تأكيد المقعد</button><button className="btn btn-ghost" onClick={() => act(a.id, 'decline')}>الاعتذار</button></>}
          </div>
        </article>
      ))}
    </div>
  );
}
