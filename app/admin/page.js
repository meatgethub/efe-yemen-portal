'use client';
import { useEffect, useState } from 'react';

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/api/admin/programs').then(async (r) => {
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await r.json();
      if (!r.ok) setErr(j.error || 'تعذر التحميل.');
      else setData(j);
    });
  }, []);
  if (err) return <div className="notice danger">{err}</div>;
  if (!data) return <div className="notice info">جارٍ التحميل…</div>;
  const total = Object.values(data.counts || {}).reduce((s, c) => s + (c._total || 0), 0);
  return (
    <div>
      <h1>لوحة الإدارة</h1>
      <nav className="toolbar" aria-label="أقسام الإدارة">
        <a className="btn btn-secondary" href="/admin/programs">البرامج والنماذج</a>
        <a className="btn btn-secondary" href="/admin/applications">الطلبات والمراجعة</a>
        <a className="btn btn-secondary" href="/admin/enrollment">التسجيل والمشاركون</a>
        <a className="btn btn-secondary" href="/admin/notifications">الإشعارات</a>
        <a className="btn btn-secondary" href="/admin/export">التصدير</a>
        <a className="btn btn-secondary" href="/admin/activity">سجل الأنشطة</a>
      </nav>
      <div className="grid cols-3">
        <div className="card"><h2>{data.programs.length}</h2><p>برنامجاً (بما فيها المسودات والمؤرشفة)</p></div>
        <div className="card"><h2>{total}</h2><p>طلباً إجمالاً</p></div>
        <div className="card"><h2>Asia/Aden</h2><p>المنطقة الزمنية للمواعيد النهائية</p></div>
      </div>
      <div className="card">
        <h2>الأعداد حسب البرنامج والمرحلة</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>البرنامج</th><th>الإجمالي</th><th>تم التقديم</th><th>قيد المراجعة</th><th>مختصرة</th><th>انتظار</th><th>مقبول</th><th>غير مختار</th><th>مؤكد</th></tr></thead>
          <tbody>{data.programs.map((p) => {
            const c = data.counts[p.id] || {};
            return <tr key={p.id}><td>{p.title}</td><td>{c._total || 0}</td><td>{c.submitted || 0}</td><td>{c.under_review || 0}</td><td>{c.shortlisted || 0}</td><td>{c.waitlisted || 0}</td><td>{c.accepted || 0}</td><td>{c.rejected || 0}</td><td>{c.enrolled || 0}</td></tr>;
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}
