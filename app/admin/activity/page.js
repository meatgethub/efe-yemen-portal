'use client';
import { useEffect, useState } from 'react';
export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    fetch('/api/admin/activity').then(async (r) => {
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await r.json(); setLogs(j.activity || []);
    });
  }, []);
  return (
    <div>
      <h1>سجل الأنشطة</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>الوقت</th><th>الفاعل</th><th>الدور</th><th>الإجراء</th><th>الكيان</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l.id}><td dir="ltr">{l.at}</td><td>{l.actor}</td><td>{l.role}</td><td>{l.action} — {l.detail}</td><td>{l.entity}:{l.entityId}</td></tr>)}</tbody>
      </table></div></div>
    </div>
  );
}
