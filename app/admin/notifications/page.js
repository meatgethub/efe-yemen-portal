'use client';
import { useEffect, useState } from 'react';

export default function AdminNotifications() {
  const [outbox, setOutbox] = useState([]);
  useEffect(() => {
    fetch('/api/admin/activity').then(async (r) => {
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await r.json(); setOutbox(j.outbox || []);
    });
  }, []);
  return (
    <div>
      <h1>الإشعارات والصادر</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="notice warn"><strong>وضع تجريبي موسوم:</strong> الرسائل أدناه مسجّلة فقط ولم تُرسَل عبر SMS/بريد. للتفعيل الحقيقي اضبط متغيرات SMTP/Twilio في ملف .env (راجع README و.env.example).</div>
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
