'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import site from '../../../data/site.json';
import { staff, getPrograms, allApps, updateApps, addScore, notify } from '../../../lib/static-store';

export default function AdminApplications() {
  const [ok, setOk] = useState(false);
  const [me, setMe] = useState(null);
  const [apps, setApps] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [f, setF] = useState({ programId: '', status: '', q: '' });
  const [sel, setSel] = useState([]);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [message, setMessage] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const s = staff();
    if (!s) { window.location.href = '/admin/login'; return; }
    setMe(s); setOk(true); reload();
  }, []);
  function reload() { setApps(allApps()); setPrograms(getPrograms(site)); }
  const list = apps.filter((a) =>
    (!f.programId || a.programId === f.programId) &&
    (!f.status || a.status === f.status) &&
    (!f.q || (a.fullName + ' ' + a.reference + ' ' + a.address).includes(f.q)));

  function ext(id, patch) {
    updateApps(id ? [id] : sel, patch, me.name);
    setSel([]); reload(); setMsg('تم التنفيذ محلياً (تجريبي).');
    if (id) setDetail(allApps().find((a) => a.id === id) || null);
  }
  function send() {
    const ids = sel.length ? sel : (detail ? [detail.id] : []);
    if (!ids.length || !message.trim()) { setMsg('اختر طلباً واكتب الرسالة.'); return; }
    notify(ids, message, me.name);
    setMsg('سُجِّلت الرسالة في الصادر التجريبي (لم تُرسَل فعلياً).'); reload();
  }

  if (!ok) return <div className="notice info">جارٍ التحميل…</div>;
  return (
    <div>
      <h1>الطلبات والمراجعة (تجريبي)</h1>
      <Link className="btn btn-ghost" href="/admin">→ لوحة الإدارة</Link>
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
        </div>
        {msg && <p role="status">{msg}</p>}
        <div className="table-wrap"><table>
          <thead><tr><th></th><th>المرجع</th><th>الاسم</th><th>الحالة</th><th>التواصل</th><th>عرض</th></tr></thead>
          <tbody>{list.map((a) => (
            <tr key={a.id}>
              <td><input type="checkbox" checked={sel.includes(a.id)} onChange={() => setSel((s) => s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id])} aria-label={'تحديد ' + a.reference} /></td>
              <td dir="ltr">{a.reference}</td><td>{a.fullName}</td><td>{a.status}</td><td dir="ltr">{a.address}</td>
              <td><button className="btn btn-ghost" onClick={() => setDetail(a)}>فتح</button></td>
            </tr>))}</tbody>
        </table></div>
        {list.length === 0 && <p>لا توجد طلبات في هذا المتصفح بعد. جرّب التقديم من <Link href="/">صفحة البرامج</Link>.</p>}
        <h2>إجراءات جماعية ({sel.length} محدد)</h2>
        <div className="toolbar">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} aria-label="الحالة الجديدة">
            <option value="under_review">قيد المراجعة</option><option value="shortlisted">مختصرة</option>
            <option value="waitlisted">انتظار</option><option value="accepted">مقبول</option><option value="rejected">غير مختار</option>
          </select>
          <button className="btn btn-secondary" onClick={() => ext(null, { status: bulkStatus })}>تحديث الحالة</button>
          <input type="text" placeholder="تعيين مراجع" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => ext(null, { reviewer })}>تعيين مراجع</button>
        </div>
        <div className="field"><label>رسالة عربية للمحددين (تُسجَّل فقط)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={send}>تسجيل الرسالة</button>
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
            <dt>المستندات</dt><dd>{(detail.documents || []).map((d) => d.name).join('، ') || '—'}</dd>
          </dl>
          <h3>الدرجات (داخلية)</h3>
          <ul>{(detail.scores || []).map((s, i) => <li key={i}>{s.by}: {s.total}</li>)}</ul>
          <div className="toolbar">
            <input type="number" placeholder="الدرجة الإجمالية" value={score} onChange={(e) => setScore(e.target.value)} aria-label="الدرجة" />
            <input type="text" placeholder="ملاحظة داخلية" value={note} onChange={(e) => setNote(e.target.value)} aria-label="ملاحظة داخلية" />
            <button className="btn btn-secondary" onClick={() => { addScore(detail.id, {}, Number(score) || 0, note, me.name); setScore(''); setNote(''); reload(); setDetail(allApps().find((a) => a.id === detail.id)); }}>حفظ الدرجة</button>
          </div>
          <h3>رسائل المتقدم</h3>
          <ul>{(detail.applicantMessages || []).map((m, i) => <li key={i}>{m.body}</li>)}</ul>
          <div className="toolbar">
            <button className="btn btn-secondary" onClick={() => ext(detail.id, { status: 'shortlisted' })}>مختصرة</button>
            <button className="btn btn-secondary" onClick={() => ext(detail.id, { status: 'waitlisted' })}>انتظار</button>
            <button className="btn btn-primary" onClick={() => ext(detail.id, { status: 'accepted', applicantMessage: 'تم قبولك. أكّد مقعدك من صفحة طلباتي.' })}>قبول</button>
            <button className="btn btn-ghost" onClick={() => ext(detail.id, { status: 'rejected' })}>عدم اختيار</button>
            <button className="btn btn-ghost" onClick={() => setDetail(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
