'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import site from '../../data/site.json';
import { applicant, myApps, confirmEnrollment, getPrograms } from '../../lib/static-store';
import { STATUS_LABELS } from '../../lib/constants';

export default function Enrollment() {
  const [apps, setApps] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    if (applicant()) setApps(myApps().filter((a) => ['accepted', 'enrolled'].includes(a.status)));
  }, []);
  function act(id, action) {
    const r = confirmEnrollment(id, action);
    if (r.error) { alert(r.error); return; }
    setApps(myApps().filter((a) => ['accepted', 'enrolled'].includes(a.status)));
  }
  if (!ready) return <div className="notice info">جارٍ التحميل…</div>;
  if (!applicant()) return <div className="notice info" role="status">سجّل الدخول أولاً من صفحة طلباتي برمز التحقق. <Link href="/dashboard">الانتقال إلى طلباتي</Link></div>;
  const progs = Object.fromEntries(getPrograms(site).map((p) => [p.id, p]));
  return (
    <div>
      <h1>التسجيل والقبول</h1>
      {apps.length === 0 && <div className="notice info">لا توجد قبولات حالياً على هذه الوسيلة في هذا المتصفح.</div>}
      {apps.map((a) => (
        <article className="card" key={a.id}>
          <h2>{a.programTitle}</h2>
          <p>الحالة: <strong>{STATUS_LABELS[a.status]}</strong> • المرجع: <strong dir="ltr">{a.reference}</strong></p>
          {a.enrollment?.instructions && <p>{a.enrollment.instructions}</p>}
          {progs[a.programId] && <p><strong>الجدول والمكان:</strong> {progs[a.programId].schedule} — {progs[a.programId].venue}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {a.status === 'accepted' && <><button className="btn btn-primary" onClick={() => act(a.id, 'confirm')}>تأكيد المقعد</button><button className="btn btn-ghost" onClick={() => act(a.id, 'decline')}>الاعتذار</button></>}
            {a.status === 'enrolled' && <p>تم تأكيد تسجيلك ✓ (تجريبي).</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
