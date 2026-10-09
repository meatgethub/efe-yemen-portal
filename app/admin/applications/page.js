'use client';
import { useEffect, useState } from 'react';

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [f, setF] = useState({ programId: '', status: '', q: '' });
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [message, setMessage] = useState('');
  const [reviewer, setReviewer] = useState('');

  async function load() {
    const qs = new URLSearchParams(f).toString();
    const r = await fetch('/api/admin/applications?' + qs);
    if (r.status === 401) { window.location.href = '/admin/login'; return; }
    const j = await r.json();
    setApps(j.applications || []); setPrograms(j.programs || []);
  }
  useEffect(() => { load(); }, []);

  function toggle(id) {
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function patch(payload) {
    const r = await fetch('/api/admin/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || 'تعذر التنفيذ.'); return; }
    setMsg('تم التنفيذ بنجاح.'); setSel([]); load();
    if (detail) {
      const r2 = await fetch('/api/admin/applications');
      const j2 = await r2.json();
      setDetail((j2.applications || []).find((a) => a.id === detail.id) || null);
    }
  }

  async function send() {
    const r = await fetch('/api/admin/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: sel.length ? sel : (detail ? [detail.id] : []), body: message }) });
    const j = await r.json();
    setMsg(j.message || j.error);
  }

  return (
    <div>
      <h1>الطلبات والمراجعة</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="card">
        <div className="toolbar">
          <select value={f.programId} onChange={(e) => setF({ ...f, programId: e.target.value })} aria-label="البرنامج">
            <option value="">كل البرامج</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="الحالة">
            <option value="">كل الحالات</option>
            <option value="submitted">تم التقديم</option><option value="under_review">قيد المراجعة</option>
            <option value="shortlisted">مختصرة</option><option value="waitlisted">انتظار</option>
            <option value="accepted">مقبول</option><option value="rejected">غير مختار</option>
            <option value="enrolled">مؤكد</option><option value="declined">معتذر</option>
          </select>
          <input type="text" placeholder="بحث بالاسم/المرجع/التواصل" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          <button className="btn btn-primary" onClick={load}>بحث</button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <div className="table-wrap"><table>
          <thead><tr><th><input type="checkbox" aria-label="تحديد الكل" onChange={(e) => setSel(e.target.checked ? apps.map((a) => a.id) : [])} /></th><th>المرجع</th><th>الاسم</th><th>الحالة</th><th>المراجع</th><th>التواصل</th><th>عرض</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.id}>
              <td><input type="checkbox" checked={sel.includes(a.id)} onChange={() => toggle(a.id)} aria-label={'تحديد ' + a.reference} /></td>
              <td dir="ltr">{a.reference}</td><td>{a.fullName}</td><td>{a.status}</td><td>{a.reviewer || '—'}</td><td dir="ltr">{a.address}</td>
              <td><button className="btn btn-ghost" onClick={() => setDetail(a)}>فتح</button></td>
            </tr>))}</tbody>
        </table></div>
        {apps.length === 0 && <p>لا توجد طلبات مطابقة.</p>}
        <h2>إجراءات جماعية ({sel.length} محدد)</h2>
        <div className="toolbar">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} aria-label="الحالة الجديدة">
            <option value="under_review">قيد المراجعة</option><option value="shortlisted">مختصرة</option>
            <option value="waitlisted">انتظار</option><option value="accepted">مقبول</option><option value="rejected">غير مختار</option>
          </select>
          <button className="btn btn-secondary" onClick={() => patch({ ids: sel, status: bulkStatus })}>تحديث الحالة للجماعة</button>
          <input type="text" placeholder="تعيين مراجع (اسم)" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => patch({ ids: sel, reviewer })}>تعيين مراجع</button>
        </div>
        <div className="field"><label>معاينة وإرسال رسالة عربية للمحددين (وضع تجريبي: تُسجَّل فقط)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="مثال: عزيزي/عزيزتي… تم قبولك مبدئياً…" /></div>
        <button className="btn btn-primary" onClick={send}>معاينة/إرسال الرسالة</button>
      </div>

      {detail && (
        <div className="card" role="dialog" aria-label={'تفاصيل ' + detail.reference}>
          <h2>{detail.fullName} — <span dir="ltr">{detail.reference}</span></h2>
          <dl className="kv">
            <dt>البرنامج</dt><dd>{detail.programTitle}</dd>
            <dt>التواصل</dt><dd dir="ltr">{detail.address}</dd>
            <dt>العمر/المدينة</dt><dd>{detail.age} / {detail.city}</dd>
            <dt>التعليم/العمل</dt><dd>{detail.education} / {detail.employment}</dd>
            <dt>الدافعية</dt><dd>{detail.motivation}</dd>
            <dt>التوفر</dt><dd>{detail.availability}</dd>
            <dt>المستندات</dt><dd>{(detail.documents || []).map((d) => <span key={d.url}><a href={d.url}>{d.name}</a>؛ </span>) || '—'}</dd>
          </dl>
          <h3>إجابات خاصة</h3>
          <pre dir="auto" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(detail.customAnswers || {}, null, 2)}</pre>
          <h3>الدرجات (داخلية — لا يراها المتقدم)</h3>
          <ul>{(detail.scores || []).map((s, i) => <li key={i}>{s.by}: {s.total} — {JSON.stringify(s.criteria)}</li>)}</ul>
          <h3>ملاحظات داخلية (لا يراها المتقدم)</h3>
          <ul>{(detail.internalNotes || []).map((n, i) => <li key={i}>{n.by}: {n.body}</li>)}</ul>
          <h3>رسائل المتقدم (ظاهرة له)</h3>
          <ul>{(detail.applicantMessages || []).map((m, i) => <li key={i}>{m.body}</li>)}</ul>
          <div className="toolbar">
            <button className="btn btn-secondary" onClick={() => patch({ id: detail.id, status: 'shortlisted' })}>إدراج في المختصرة</button>
            <button className="btn btn-secondary" onClick={() => patch({ id: detail.id, status: 'waitlisted' })}>قائمة انتظار</button>
            <button className="btn btn-primary" onClick={() => patch({ id: detail.id, status: 'accepted' })}>قبول</button>
            <button className="btn btn-ghost" onClick={() => patch({ id: detail.id, status: 'rejected' })}>عدم اختيار</button>
            <button className="btn btn-ghost" onClick={() => setDetail(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
