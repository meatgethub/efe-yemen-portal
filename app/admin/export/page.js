'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staff, allApps, toCSV } from '../../../lib/static-store';

export default function AdminExport() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!staff()) { window.location.href = '/admin/login'; return; }
    setOk(true);
  }, []);
  function download() {
    const csv = toCSV(allApps());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'applications.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>تصدير البيانات (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
      <div className="card">
        <p>يُصدَّر ملف CSV (يُفتح في Excel) للطلبات المحفوظة في هذا المتصفح فقط.</p>
        <button className="btn btn-primary" onClick={download}>تنزيل الطلبات (CSV)</button>
      </div>
    </div>
  );
}
