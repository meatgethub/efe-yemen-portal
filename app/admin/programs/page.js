'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import site from '../../../data/site.json';
import { staff, getPrograms, upsertProgram, setProgramStatus } from '../../../lib/static-store';

const EMPTY = { title: '', field: 'تقنية المعلومات', location: 'عدن', delivery: 'حضوري', status: 'draft', capacity: 30, cost: 'مجاني', applicationDeadline: '', summary: '', description: '', schedule: '', venue: '' };

export default function AdminPrograms() {
  const [ok, setOk] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!staff()) { window.location.href = '/admin/login'; return; }
    setOk(true); setPrograms(getPrograms(site));
  }, []);
  function reload() { setPrograms(getPrograms(site)); }
  function edit(p) {
    setEditing(p.id);
    setForm({ ...EMPTY, title: p.title, field: p.field, location: p.location, delivery: p.delivery, status: p.status === 'archived' ? 'draft' : p.status, capacity: p.capacity, cost: p.cost, applicationDeadline: (p.applicationDeadline || '').slice(0, 16), summary: p.summary, description: p.description, schedule: p.schedule, venue: p.venue });
  }
  function save(e) {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 5) { setMsg('اكتب عنوان البرنامج.'); return; }
    const base = editing ? programs.find((x) => x.id === editing) || {} : {};
    upsertProgram({
      ...base, ...form, id: editing || undefined, capacity: Number(form.capacity),
      applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : ''
    });
    setMsg('تم الحفظ محلياً (تجريبي).'); setEditing(''); setForm(EMPTY); reload();
  }
  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>إدارة البرامج (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
      <div className="card">
        <h2>البرامج ({programs.length})</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>العنوان</th><th>الحالة</th><th>الموقع</th><th>إجراءات</th></tr></thead>
          <tbody>{programs.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td><td>{p.status} / {p._av}</td><td>{p.location}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => edit(p)}>تحرير</button>{' '}
                <button className="btn btn-ghost" onClick={() => { setProgramStatus(p.id, 'published'); reload(); }}>نشر</button>{' '}
                <button className="btn btn-ghost" onClick={() => { setProgramStatus(p.id, 'closed'); reload(); }}>إغلاق</button>
              </td>
            </tr>))}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2>{editing ? 'تحرير برنامج' : 'برنامج جديد'}</h2>
        <form onSubmit={save}>
          <div className="field"><label>العنوان *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid cols-3">
            <div className="field"><label>المجال</label><input type="text" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
            <div className="field"><label>الموقع</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="field"><label>طريقة التدريب</label><select value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })}><option>حضوري</option><option>عن بُعد</option><option>مدمج</option></select></div>
          </div>
          <div className="grid cols-3">
            <div className="field"><label>الحالة</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">مسودة</option><option value="published">منشور</option><option value="closed">مغلق</option></select></div>
            <div className="field"><label>السعة</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div className="field"><label>التكلفة</label><input type="text" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
          </div>
          <div className="field"><label>آخر موعد (بتوقيت عدن)</label><input type="datetime-local" dir="ltr" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} /></div>
          <div className="field"><label>ملخص</label><input type="text" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
          <div className="field"><label>الوصف</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {msg && <p role="status">{msg}</p>}
          <button className="btn btn-primary" type="submit">حفظ</button>{' '}
          <button className="btn btn-ghost" type="button" onClick={() => { setEditing(''); setForm(EMPTY); }}>إلغاء</button>
        </form>
      </div>
    </div>
  );
}
