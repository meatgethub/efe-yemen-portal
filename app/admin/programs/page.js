'use client';
import { useEffect, useState } from 'react';

const EMPTY = { title: '', field: 'تقنية المعلومات', location: 'عدن', delivery: 'حضوري', status: 'draft', capacity: 30, cost: 'مجاني', startDate: '', endDate: '', schedule: '', venue: '', applicationOpenDate: '', applicationDeadline: '', summary: '', description: '', eligibility: '', customQuestions: '', requiredDocuments: '', scoringCriteria: '' };

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch('/api/admin/programs');
    if (r.status === 401) { window.location.href = '/admin/login'; return; }
    const j = await r.json();
    setPrograms(j.programs || []);
  }
  useEffect(() => { load(); }, []);

  function edit(p) {
    setEditing(p.id);
    setForm({
      ...EMPTY,
      title: p.title, field: p.field, location: p.location, delivery: p.delivery, status: p.status,
      capacity: p.capacity, cost: p.cost,
      startDate: (p.startDate || '').slice(0, 16), endDate: (p.endDate || '').slice(0, 16),
      schedule: p.schedule, venue: p.venue,
      applicationOpenDate: (p.applicationOpenDate || '').slice(0, 16), applicationDeadline: (p.applicationDeadline || '').slice(0, 16),
      summary: p.summary, description: p.description, eligibility: (p.eligibility || []).join('\n'),
      customQuestions: JSON.stringify(p.formConfig?.customQuestions || [], null, 1),
      requiredDocuments: JSON.stringify(p.formConfig?.requiredDocuments || [], null, 1),
      scoringCriteria: JSON.stringify(p.formConfig?.scoringCriteria || [], null, 1)
    });
    window.scrollTo(0, document.body.scrollHeight);
  }

  async function save(e) {
    e.preventDefault(); setMsg('');
    let cq = [], rd = [], sc = [];
    try {
      if (form.customQuestions.trim()) cq = JSON.parse(form.customQuestions);
      if (form.requiredDocuments.trim()) rd = JSON.parse(form.requiredDocuments);
      if (form.scoringCriteria.trim()) sc = JSON.parse(form.scoringCriteria);
    } catch { setMsg('صيغة JSON غير صالحة في الأسئلة أو المستندات أو معايير التقييم.'); return; }
    const payload = {
      id: editing || undefined,
      title: form.title, field: form.field, location: form.location, delivery: form.delivery, status: form.status,
      capacity: Number(form.capacity), cost: form.cost,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : '',
      endDate: form.endDate ? new Date(form.endDate).toISOString() : '',
      schedule: form.schedule, venue: form.venue,
      applicationOpenDate: form.applicationOpenDate ? new Date(form.applicationOpenDate).toISOString() : '',
      applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : '',
      summary: form.summary, description: form.description, eligibility: form.eligibility,
      formConfig: { customQuestions: cq, requiredDocuments: rd, scoringCriteria: sc }
    };
    const r = await fetch('/api/admin/programs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || 'تعذر الحفظ.'); return; }
    setMsg('تم الحفظ بنجاح.'); setEditing(''); setForm(EMPTY); load();
  }

  async function setStatus(id, status) {
    await fetch('/api/admin/programs/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div>
      <h1>إدارة البرامج والنماذج</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="card">
        <h2>البرامج ({programs.length})</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>العنوان</th><th>الحالة</th><th>الموقع</th><th>الموعد النهائي</th><th>إجراءات</th></tr></thead>
          <tbody>{programs.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td><td>{p.status}</td><td>{p.location}</td><td dir="ltr">{(p.applicationDeadline || '').slice(0, 16)}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => edit(p)}>تحرير</button>{' '}
                <button className="btn btn-ghost" onClick={() => setStatus(p.id, 'published')}>نشر</button>{' '}
                <button className="btn btn-ghost" onClick={() => setStatus(p.id, 'closed')}>إغلاق</button>{' '}
                <button className="btn btn-ghost" onClick={() => setStatus(p.id, 'archived')}>أرشفة</button>
              </td>
            </tr>))}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2>{editing ? 'تحرير برنامج' : 'برنامج جديد'}</h2>
        <p className="small">الحقول الخاصة (أسئلة، مستندات، معايير) تُكتب بصيغة JSON. مثال السؤال: [&#123;&quot;id&quot;:&quot;q1&quot;,&quot;label&quot;:&quot;نص السؤال&quot;,&quot;required&quot;:true&#125;]. المواعيد بتوقيت عدن.</p>
        <form onSubmit={save}>
          <div className="field"><label>العنوان *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid cols-3">
            <div className="field"><label>المجال</label><input type="text" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
            <div className="field"><label>الموقع</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="field"><label>طريقة التدريب</label><select value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })}><option>حضوري</option><option>عن بُعد</option><option>مدمج</option></select></div>
          </div>
          <div className="grid cols-3">
            <div className="field"><label>الحالة</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">مسودة</option><option value="published">منشور</option><option value="closed">مغلق</option><option value="archived">مؤرشف</option></select></div>
            <div className="field"><label>السعة</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div className="field"><label>التكلفة</label><input type="text" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
          </div>
          <div className="grid cols-2">
            <div className="field"><label>فتح التقديم</label><input type="datetime-local" dir="ltr" value={form.applicationOpenDate} onChange={(e) => setForm({ ...form, applicationOpenDate: e.target.value })} /></div>
            <div className="field"><label>آخر موعد (بتوقيت عدن)</label><input type="datetime-local" dir="ltr" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} /></div>
          </div>
          <div className="field"><label>ملخص</label><input type="text" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
          <div className="field"><label>الوصف</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid cols-2">
            <div className="field"><label>الجدول</label><input type="text" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></div>
            <div className="field"><label>المكان</label><input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
          </div>
          <div className="field"><label>الأهلية (سطر لكل شرط)</label><textarea value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} /></div>
          <div className="field"><label>أسئلة خاصة (JSON)</label><textarea dir="ltr" value={form.customQuestions} onChange={(e) => setForm({ ...form, customQuestions: e.target.value })} /></div>
          <div className="field"><label>مستندات مطلوبة (JSON)</label><textarea dir="ltr" value={form.requiredDocuments} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} /></div>
          <div className="field"><label>معايير التقييم (JSON)</label><textarea dir="ltr" value={form.scoringCriteria} onChange={(e) => setForm({ ...form, scoringCriteria: e.target.value })} /></div>
          {msg && <p role="status">{msg}</p>}
          <button className="btn btn-primary" type="submit">حفظ</button>{' '}
          <button className="btn btn-ghost" type="button" onClick={() => { setEditing(''); setForm(EMPTY); }}>إلغاء</button>
        </form>
      </div>
    </div>
  );
}
