'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staff, getActivity } from '../../../lib/static-store';

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!staff()) { window.location.href = '/admin/login'; return; }
    setOk(true); setLogs(getActivity());
  }, []);
  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>سجل الأنشطة (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>الوقت</th><th>الفاعل</th><th>الدور</th><th>الإجراء</th><th>الكيان</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l.id}><td dir="ltr">{l.at}</td><td>{l.actor}</td><td>{l.role}</td><td>{l.action} — {l.detail}</td><td>{l.entity}:{l.entityId}</td></tr>)}</tbody>
      </table></div>
      {logs.length === 0 && <p>لا توجد أنشطة مسجلة بعد.</p>}</div>
    </div>
  );
}
