'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staff, getOutbox } from '../../../lib/static-store';

export default function AdminNotifications() {
  const [outbox, setOutbox] = useState([]);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!staff()) { window.location.href = '/admin/login'; return; }
    setOk(true); setOutbox(getOutbox());
  }, []);
  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>الإشعارات والصادر (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
      <div className="notice warn">جميع الرسائل مسجّلة محلياً فقط ولم تُرسَل عبر SMS/بريد.</div>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>الوقت</th><th>القناة</th><th>إلى</th><th>النص</th><th>الحالة</th></tr></thead>
          <tbody>{outbox.map((m) => <tr key={m.id}><td dir="ltr">{m.at}</td><td>{m.channel}</td><td dir="ltr">{m.to}</td><td>{m.subject} — {m.body.slice(0, 120)}</td><td>{m.status}</td></tr>)}</tbody>
        </table></div>
        {outbox.length === 0 && <p>لا توجد رسائل بعد.</p>}
      </div>
    </div>
  );
}
