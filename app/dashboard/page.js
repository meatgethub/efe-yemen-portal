'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [channel, setChannel] = useState('phone');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('login'); // login | otp | list
  const [demoCode, setDemoCode] = useState('');
  const [msg, setMsg] = useState('');
  const [apps, setApps] = useState([]);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true); setMsg('جارٍ إرسال الرمز…');
    const r = await fetch('/api/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel, address }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error || 'تعذر الإرسال.'); return; }
    setDemoCode(j.demoCode || ''); setMsg(j.message); setStage('otp');
  }
  async function verify() {
    setBusy(true);
    const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel, address, code }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error || 'الرمز غير صحيح.'); return; }
    load(j.token);
  }
  async function load(token) {
    const t = token || localStorage.getItem('efe_applicant_token');
    if (token) localStorage.setItem('efe_applicant_token', token);
    if (!t) { setStage('login'); return; }
    const r = await fetch('/api/applications?mine=1', { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) { setStage('login'); setMsg('انتهت الجلسة. أدخل بياناتك لاستلام رمز جديد.'); return; }
    const j = await r.json();
    setApps(j.applications || []); setStage('list');
  }
  useState(() => {}, []);
  if (typeof window !== 'undefined' && stage === 'login' && localStorage.getItem('efe_applicant_token')) {
    // محاولة تحميل تلقائي مرة واحدة
  }

  async function confirmEnrollment(id, action) {
    const t = localStorage.getItem('efe_applicant_token');
    const r = await fetch('/api/applications/' + id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
      body: JSON.stringify({ action })
    });
    const j = await r.json();
    if (!r.ok) { alert(j.error || 'تعذر تنفيذ الإجراء.'); return; }
    load();
  }

  return (
    <div>
      <h1>طلباتي</h1>
      <p>ادخل رقم الهاتف أو البريد الإلكتروني لاستلام رمز تحقق والوصول إلى طلباتك — بدون كلمة مرور.</p>
      {stage !== 'list' ? (
        <div className="card">
          <div className="notice warn"><strong>وضع تجريبي:</strong> الرمز يظهر على الشاشة للتجربة فقط ولا يُرسَل فعلياً.</div>
          <div className="field"><label>وسيلة التواصل</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="phone">هاتف</option><option value="email">بريد إلكتروني</option>
            </select></div>
          <div className="field"><label>{channel === 'phone' ? 'رقم الهاتف' : 'البريد الإلكتروني'}</label>
            <input type="text" dir="ltr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={channel === 'phone' ? '+9677XXXXXXXX' : 'name@example.com'} /></div>
          {stage === 'login'
            ? <button className="btn btn-primary" disabled={busy} onClick={request}>إرسال رمز التحقق</button>
            : <div>
                <div className="field"><label>الرمز (6 أرقام)</label>
                  <input type="text" dir="ltr" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
                <button className="btn btn-primary" disabled={busy} onClick={verify}>تحقق وعرض طلباتي</button>
              </div>}
          {demoCode && <div className="notice info">الرمز التجريبي: <strong dir="ltr">{demoCode}</strong></div>}
          {msg && <p role="status">{msg}</p>}
          <p><button className="btn btn-ghost" onClick={() => load()}>لدي رمز تحقق سابق — عرض طلباتي</button></p>
        </div>
      ) : (
        <div>
          {apps.length === 0 && <div className="notice info">لا توجد طلبات بعد على هذه الوسيلة. <a href="/">تصفح البرامج وقدّم الآن</a>.</div>}
          {apps.map((a) => (
            <article className="card" key={a.id}>
              <h2>{a.programTitle}</h2>
              <p>الرقم المرجعي: <strong dir="ltr">{a.reference}</strong> • الحالة: <strong>{a.statusLabel}</strong></p>
              <p className="small">{a.statusDescription}</p>
              {(a.applicantMessages || []).length > 0 && (
                <div className="notice info"><strong>رسائل الفريق:</strong><ul>{a.applicantMessages.map((m, i) => <li key={i}>{m.body} <span className="small">({m.at})</span></li>)}</ul></div>
              )}
              {a.nextSteps && <p><strong>الخطوة التالية:</strong> {a.nextSteps}</p>}
              {a.status === 'accepted' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => confirmEnrollment(a.id, 'confirm')}>تأكيد المقعد</button>
                  <button className="btn btn-ghost" onClick={() => confirmEnrollment(a.id, 'decline')}>الاعتذار عن المقعد</button>
                  <a className="btn btn-secondary" href="/enrollment">إتمام متطلبات التسجيل</a>
                </div>
              )}
            </article>
          ))}
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('efe_applicant_token'); setStage('login'); }}>تسجيل الخروج من هذا الجهاز</button>
        </div>
      )}
    </div>
  );
}
