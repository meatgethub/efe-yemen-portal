'use client';
import Link from 'next/link';
import { useState } from 'react';
import { requestOtp, verifyOtp, applicant, myApps, confirmEnrollment, logoutApplicant } from '../../lib/static-store';
import { STATUS_LABELS, STATUS_DESCRIPTIONS } from '../../lib/constants';

export default function Dashboard() {
  const [channel, setChannel] = useState('phone');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState(applicant() ? 'list' : 'login');
  const [demoCode, setDemoCode] = useState('');
  const [msg, setMsg] = useState('');
  const [apps, setApps] = useState(() => (applicant() ? myApps() : []));

  function doRequest() {
    const r = requestOtp(channel, address);
    if (r.error) { setMsg(r.error); return; }
    setDemoCode(r.demoCode); setMsg('ظهر الرمز التجريبي — أدخله للمتابعة.'); setStage('otp');
  }
  function doVerify() {
    const r = verifyOtp(channel, address, code);
    if (r.error) { setMsg(r.error); return; }
    setApps(myApps()); setStage('list'); setMsg('');
  }
  function act(id, action) {
    const r = confirmEnrollment(id, action);
    if (r.error) { alert(r.error); return; }
    setApps(myApps());
  }

  return (
    <div>
      <h1>طلباتي</h1>
      <div className="notice warn"><strong>نسخة عرض ثابتة:</strong> الطلبات محفوظة في هذا المتصفح فقط.</div>
      {stage !== 'list' ? (
        <div className="card">
          <div className="field"><label>وسيلة التواصل</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="phone">هاتف</option><option value="email">بريد إلكتروني</option>
            </select></div>
          <div className="field"><label>{channel === 'phone' ? 'رقم الهاتف' : 'البريد الإلكتروني'}</label>
            <input type="text" dir="ltr" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          {stage === 'login'
            ? <button className="btn btn-primary" onClick={doRequest}>إرسال رمز التحقق</button>
            : <div>
                <div className="field"><label>الرمز (6 أرقام)</label>
                  <input type="text" dir="ltr" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
                <button className="btn btn-primary" onClick={doVerify}>تحقق وعرض طلباتي</button>
              </div>}
          {demoCode && <div className="notice info">الرمز التجريبي: <strong dir="ltr">{demoCode}</strong></div>}
          {msg && <p role="status">{msg}</p>}
        </div>
      ) : (
        <div>
          {apps.length === 0 && <div className="notice info">لا توجد طلبات بعد على هذه الوسيلة في هذا المتصفح. <Link href="/">تصفح البرامج وقدّم الآن</Link>.</div>}
          {apps.map((a) => (
            <article className="card" key={a.id}>
              <h2>{a.programTitle}</h2>
              <p>الرقم المرجعي: <strong dir="ltr">{a.reference}</strong> • الحالة: <strong>{STATUS_LABELS[a.status]}</strong></p>
              <p className="small">{STATUS_DESCRIPTIONS[a.status]}</p>
              {(a.applicantMessages || []).length > 0 && (
                <div className="notice info"><strong>رسائل الفريق:</strong><ul>{a.applicantMessages.map((m, i) => <li key={i}>{m.body}</li>)}</ul></div>
              )}
              {a.nextSteps && <p><strong>الخطوة التالية:</strong> {a.nextSteps}</p>}
              {a.status === 'accepted' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => act(a.id, 'confirm')}>تأكيد المقعد</button>
                  <button className="btn btn-ghost" onClick={() => act(a.id, 'decline')}>الاعتذار عن المقعد</button>
                  <Link className="btn btn-secondary" href="/enrollment">إتمام متطلبات التسجيل</Link>
                </div>
              )}
            </article>
          ))}
          <button className="btn btn-ghost" onClick={() => { logoutApplicant(); setStage('login'); setApps([]); }}>تسجيل الخروج من هذا الجهاز</button>
        </div>
      )}
    </div>
  );
}
