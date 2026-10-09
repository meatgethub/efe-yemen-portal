'use client';
import { useEffect, useState } from 'react';

export default function AdminEnrollment() {
  const [apps, setApps] = useState([]);
  useEffect(() => {
    fetch('/api/admin/applications?status=accepted').then(async (r) => {
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await r.json(); setApps(j.applications || []);
    });
    fetch('/api/admin/applications?status=enrolled').then(async (r) => {
      const j = await r.json();
      setApps((prev) => [...prev, ...(j.applications || []).filter((a) => !prev.some((p) => p.id === a.id))]);
    });
  }, []);
  return (
    <div>
      <h1>التسجيل والمشاركون</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="card">
        <h2>المقبولون والمؤكدون ({apps.length})</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>المرجع</th><th>الاسم</th><th>الحالة</th><th>التواصل</th><th>تأكيد؟</th></tr></thead>
          <tbody>{apps.map((a) => <tr key={a.id}><td dir="ltr">{a.reference}</td><td>{a.fullName}</td><td>{a.status}</td><td dir="ltr">{a.address}</td><td>{a.enrollment?.confirmed ? 'نعم' : 'بانتظار التأكيد'}</td></tr>)}</tbody>
        </table></div>
        <p><a className="btn btn-secondary" href="/api/admin/export">تصدير CSV للمشاركين</a></p>
      </div>
    </div>
  );
}
