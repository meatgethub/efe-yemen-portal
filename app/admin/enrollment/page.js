'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staff, allApps } from '../../../lib/static-store';

export default function AdminEnrollment() {
  const [apps, setApps] = useState([]);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!staff()) { window.location.href = '/admin/login'; return; }
    setOk(true);
    setApps(allApps().filter((a) => ['accepted', 'enrolled'].includes(a.status)));
  }, []);
  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>التسجيل والمشاركون (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>المرجع</th><th>الاسم</th><th>الحالة</th><th>التواصل</th><th>تأكيد؟</th></tr></thead>
          <tbody>{apps.map((a) => <tr key={a.id}><td dir="ltr">{a.reference}</td><td>{a.fullName}</td><td>{a.status}</td><td dir="ltr">{a.address}</td><td>{a.enrollment?.confirmed ? 'نعم' : 'بانتظار التأكيد'}</td></tr>)}</tbody>
        </table></div>
        {apps.length === 0 && <p>لا يوجد مقبولون بعد في هذا المتصفح.</p>}
      </div>
    </div>
  );
}
