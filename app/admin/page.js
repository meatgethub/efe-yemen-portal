'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import site from '../../data/site.json';
import { staff, staffLogout, getPrograms, allApps } from '../../lib/static-store';

export default function AdminHome() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [progs, setProgs] = useState([]);
  const [apps, setApps] = useState([]);
  useEffect(() => {
    const s = staff();
    setMe(s); setReady(true);
    if (s) { setProgs(getPrograms(site)); setApps(allApps()); }
  }, []);
  if (!ready) return <div className="notice info">جارٍ التحميل…</div>;
  if (!me) return <div className="card"><h1>لوحة الإدارة</h1><p>سجّل الدخول أولاً.</p><Link className="btn btn-primary" href="/admin/login">دخول الطاقم</Link></div>;
  const counts = {};
  for (const a of apps) {
    counts[a.programId] = counts[a.programId] || {};
    counts[a.programId][a.status] = (counts[a.programId][a.status] || 0) + 1;
    counts[a.programId]._total = (counts[a.programId]._total || 0) + 1;
  }
  return (
    <div>
      <h1>لوحة الإدارة (تجريبي — {me.name})</h1>
      <nav className="toolbar" aria-label="أقسام الإدارة">
        <Link className="btn btn-secondary" href="/admin/programs">البرامج والنماذج</Link>
        <Link className="btn btn-secondary" href="/admin/applications">الطلبات والمراجعة</Link>
        <Link className="btn btn-secondary" href="/admin/enrollment">التسجيل والمشاركون</Link>
        <Link className="btn btn-secondary" href="/admin/notifications">الإشعارات</Link>
        <Link className="btn btn-secondary" href="/admin/export">التصدير</Link>
        <Link className="btn btn-secondary" href="/admin/activity">سجل الأنشطة</Link>
        <button className="btn btn-ghost" onClick={() => { staffLogout(); window.location.href = '/admin/login'; }}>خروج</button>
      </nav>
      <div className="grid cols-3">
        <div className="card"><h2>{progs.length}</h2><p>برنامجاً</p></div>
        <div className="card"><h2>{apps.length}</h2><p>طلباً (في هذا المتصفح)</p></div>
        <div className="card"><h2>Asia/Aden</h2><p>المنطقة الزمنية</p></div>
      </div>
      <div className="card">
        <h2>الأعداد حسب البرنامج والمرحلة</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>البرنامج</th><th>الإجمالي</th><th>تم التقديم</th><th>قيد المراجعة</th><th>مختصرة</th><th>انتظار</th><th>مقبول</th><th>غير مختار</th><th>مؤكد</th></tr></thead>
          <tbody>{progs.map((p) => {
            const c = counts[p.id] || {};
            return <tr key={p.id}><td>{p.title}</td><td>{c._total || 0}</td><td>{c.submitted || 0}</td><td>{c.under_review || 0}</td><td>{c.shortlisted || 0}</td><td>{c.waitlisted || 0}</td><td>{c.accepted || 0}</td><td>{c.rejected || 0}</td><td>{c.enrolled || 0}</td></tr>;
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}
