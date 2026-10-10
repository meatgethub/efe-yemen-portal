'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import site from '../../../data/site.json';
import { getPrograms, requestOtp, verifyOtp, submitApplication } from '../../../lib/static-store';

const STEPS = ['التواصل والإقامة', 'التعليم والعمل والدافعية', 'أسئلة البرنامج والمستندات', 'التحقق برمز لمرة واحدة', 'المراجعة والإرسال'];

export default function ApplyForm({ programId }) {
  const [program, setProgram] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', channel: 'phone', address: '', age: '', city: '',
    education: '', employment: '', motivation: '', availability: '',
    customAnswers: {}, documents: [], consent: false, idempotencyKey: ''
  });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState({ sent: false, demoCode: '', verified: false, message: '' });
  const [otpInput, setOtpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const p = getPrograms(site).find((x) => x.id === programId) || null;
    setProgram(p);
    try {
      const saved = JSON.parse(localStorage.getItem('draft_' + programId) || 'null');
      if (saved) setForm((f) => ({ ...f, ...saved }));
    } catch {}
  }, [programId]);
  useEffect(() => {
    try { if (!result) localStorage.setItem('draft_' + programId, JSON.stringify(form)); } catch {}
  }, [form, programId, result]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function onFile(slotId, file) {
    if (!file) return;
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)) { alert('نوع الملف غير مقبول. المقبول: PDF أو Word أو JPG/PNG.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الملف كبير. الحد الأقصى 5 ميجابايت.'); return; }
    // نسخة ثابتة: يُسجَّل اسم الملف فقط (توضيح تجريبي) — لا يُرفع لأي خادم
    setForm((f) => ({ ...f, documents: [...f.documents.filter((d) => d.slotId !== slotId), { slotId, name: file.name, size: file.size }] }));
  }

  function validateStep() {
    const e = {};
    if (step === 0) {
      if (!form.fullName || form.fullName.trim().length < 3) e.fullName = 'اكتب الاسم الكامل (3 أحرف على الأقل).';
      if (!form.address) e.address = 'اكتب رقم الهاتف أو البريد الإلكتروني.';
      const age = Number(form.age);
      if (!age || age < 15 || age > 60) e.age = 'اكتب العمر رقماً بين 15 و60.';
      if (!form.city) e.city = 'اختر المدينة / مكان الإقامة.';
    }
    if (step === 1) {
      if (!form.education) e.education = 'اختر المستوى التعليمي.';
      if (!form.employment) e.employment = 'اختر الحالة العملية.';
      if (!form.motivation || form.motivation.trim().length < 20) e.motivation = 'اكتب دافعك (20 حرفاً على الأقل).';
      if (!form.availability) e.availability = 'وضّح مدى تفرغك.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function doRequestOtp() {
    const r = requestOtp(form.channel, form.address);
    if (r.error) { setOtp({ sent: false, demoCode: '', verified: false, message: r.error }); return; }
    setOtp({ sent: true, demoCode: r.demoCode, verified: false, message: 'ظهر الرمز التجريبي أدناه — أدخله للمتابعة. صالح 10 دقائق.' });
  }
  function doVerify() {
    const r = verifyOtp(form.channel, form.address, otpInput);
    if (r.error) { setOtp((s) => ({ ...s, message: r.error })); return; }
    setOtp((s) => ({ ...s, verified: true, message: 'تم التحقق بنجاح. انتقل إلى المراجعة.' }));
  }
  function doSubmit() {
    if (!form.consent) { setErrors({ consent: 'يجب الموافقة على سياسة الخصوصية.' }); return; }
    if (!otp.verified) { alert('أكمل خطوة التحقق أولاً.'); setStep(3); return; }
    if (submitting) return;
    setSubmitting(true);
    const key = form.idempotencyKey || ('key_' + Date.now().toString(36));
    const r = submitApplication(program, { ...form, idempotencyKey: key });
    setSubmitting(false);
    if (!r.ok) { alert(r.error); return; }
    setResult(r.app);
    try { localStorage.removeItem('draft_' + programId); } catch {}
  }

  if (program === null) return <div className="notice info" role="status">جارٍ التحميل…</div>;
  if (!program) return <div className="notice danger">البرنامج غير موجود.</div>;
  if (result) {
    return (
      <div className="card" role="status">
        <h1>تم حفظ طلبك (تجريبي) ✓</h1>
        <p>رقمك المرجعي للمتابعة من نفس المتصفح:</p>
        <p style={{ fontSize: 24, fontWeight: 800, direction: 'ltr' }}>{result.reference}</p>
        <p className="small">نسخة Pages: حُفظ الطلب في متصفحك فقط ولم يُرسَل لأي خادم.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/dashboard">تتبع طلباتي</Link>
          <Link className="btn btn-ghost" href="/">تصفح برامج أخرى</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link className="btn btn-ghost" href={`/programs/${programId}`}>→ العودة لتفاصيل البرنامج</Link>
      <div className="card">
        <h1>طلب التقديم: {program.title}</h1>
        <p className="steps-label">الخطوة {step + 1} من {STEPS.length}: {STEPS[step]}</p>
        <div className="progress" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? 'done' : ''} />)}</div>

        {step === 0 && (
          <div>
            <div className="field"><label htmlFor="fullName">الاسم الكامل <span className="req">*</span></label>
              <input id="fullName" type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
              {errors.fullName && <div className="error-text">{errors.fullName}</div>}</div>
            <div className="field"><label>وسيلة التواصل <span className="req">*</span></label>
              <select value={form.channel} onChange={(e) => set('channel', e.target.value)}>
                <option value="phone">هاتف</option><option value="email">بريد إلكتروني</option>
              </select></div>
            <div className="field"><label htmlFor="address">{form.channel === 'phone' ? 'رقم الهاتف مع رمز الدولة' : 'البريد الإلكتروني'} <span className="req">*</span></label>
              <input id="address" type="text" dir="ltr" value={form.address} onChange={(e) => set('address', e.target.value)} />
              {errors.address && <div className="error-text">{errors.address}</div>}</div>
            <div className="grid cols-2">
              <div className="field"><label htmlFor="age">العمر <span className="req">*</span></label>
                <input id="age" type="number" min="15" max="60" value={form.age} onChange={(e) => set('age', e.target.value)} />
                {errors.age && <div className="error-text">{errors.age}</div>}</div>
              <div className="field"><label htmlFor="city">المدينة <span className="req">*</span></label>
                <select id="city" value={form.city} onChange={(e) => set('city', e.target.value)}>
                  <option value="">اختر…</option>
                  {['عدن', 'صنعاء', 'تعز', 'حضرموت (المكلا)', 'الحديدة', 'أخرى'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <div className="error-text">{errors.city}</div>}</div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="grid cols-2">
              <div className="field"><label>المستوى التعليمي <span className="req">*</span></label>
                <select value={form.education} onChange={(e) => set('education', e.target.value)}>
                  <option value="">اختر…</option>
                  {['ثانوية عامة أو أقل', 'دبلوم', 'بكالوريوس', 'دراسات عليا'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                {errors.education && <div className="error-text">{errors.education}</div>}</div>
              <div className="field"><label>الحالة العملية <span className="req">*</span></label>
                <select value={form.employment} onChange={(e) => set('employment', e.target.value)}>
                  <option value="">اختر…</option>
                  {['عاطل عن العمل', 'طالب', 'عمل جزئي', 'عمل كامل', 'عمل حر'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                {errors.employment && <div className="error-text">{errors.employment}</div>}</div>
            </div>
            <div className="field"><label htmlFor="mot">لماذا تريد الالتحاق؟ <span className="req">*</span></label>
              <textarea id="mot" value={form.motivation} onChange={(e) => set('motivation', e.target.value)} />
              {errors.motivation && <div className="error-text">{errors.motivation}</div>}</div>
            <div className="field"><label htmlFor="avail">مدى التفرغ <span className="req">*</span></label>
              <input id="avail" type="text" value={form.availability} onChange={(e) => set('availability', e.target.value)} />
              {errors.availability && <div className="error-text">{errors.availability}</div>}</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>أسئلة خاصة بالبرنامج</h2>
            {(program.formConfig?.customQuestions || []).map((q) => (
              <div className="field" key={q.id}>
                <label>{q.label} {q.required ? <span className="req">*</span> : <span className="small">(اختياري)</span>}</label>
                <textarea value={form.customAnswers[q.id] || ''} onChange={(e) => set('customAnswers', { ...form.customAnswers, [q.id]: e.target.value })} />
              </div>
            ))}
            <h2>المستندات</h2>
            <p className="small">في النسخة الثابتة يُسجَّل اسم الملف فقط ولا يُرفع لأي خادم.</p>
            {(program.formConfig?.requiredDocuments || []).map((d) => (
              <div className="field" key={d.id}>
                <label>{d.label} {d.required ? <span className="req">*</span> : <span className="small">(اختياري)</span>}</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => onFile(d.id, e.target.files?.[0])} aria-label={d.label} />
                {form.documents.find((x) => x.slotId === d.id) && <div className="small">تم التسجيل: {form.documents.find((x) => x.slotId === d.id).name}</div>}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>التحقق برمز تجريبي</h2>
            <p>في هذه النسخة الثابتة يظهر الرمز على الشاشة مباشرة (لا يُرسَل فعلياً) وهو صالح 10 دقائق.</p>
            <button className="btn btn-secondary" onClick={doRequestOtp} type="button">إرسال / إعادة إرسال الرمز</button>
            {otp.message && <p role="status">{otp.message}</p>}
            {otp.demoCode && <div className="notice info">الرمز التجريبي: <strong dir="ltr">{otp.demoCode}</strong></div>}
            {otp.sent && (
              <div className="field">
                <label htmlFor="otp">أدخل الرمز</label>
                <input id="otp" type="text" inputMode="numeric" dir="ltr" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} />
                <div style={{ marginTop: 8 }}><button className="btn btn-primary" type="button" onClick={doVerify}>تحقق</button></div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2>مراجعة طلبك</h2>
            <dl className="kv">
              <dt>البرنامج</dt><dd>{program.title}</dd>
              <dt>الاسم</dt><dd>{form.fullName}</dd>
              <dt>التواصل</dt><dd dir="ltr">{form.address}</dd>
              <dt>العمر / المدينة</dt><dd>{form.age} / {form.city}</dd>
              <dt>التعليم / العمل</dt><dd>{form.education} / {form.employment}</dd>
              <dt>الدافعية</dt><dd>{form.motivation}</dd>
              <dt>التوفر</dt><dd>{form.availability}</dd>
            </dl>
            <div className="field">
              <label><input type="checkbox" checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} /> أوافق على <Link href="/privacy">سياسة الخصوصية</Link> ومعالجة بياناتي لغرض العرض التجريبي. <span className="req">*</span></label>
              {errors.consent && <div className="error-text">{errors.consent}</div>}
            </div>
            {!otp.verified && <div className="notice danger">لم يتم التحقق بعد.</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {step > 0 && <button className="btn btn-ghost" type="button" onClick={() => setStep(step - 1)}>السابق</button>}
          {step < 2 && <button className="btn btn-primary" type="button" onClick={() => { if (validateStep()) setStep(step + 1); }}>التالي</button>}
          {step === 2 && <button className="btn btn-primary" type="button" onClick={() => setStep(3)}>الانتقال إلى التحقق</button>}
          {step === 3 && otp.verified && <button className="btn btn-primary" type="button" onClick={() => setStep(4)}>الانتقال إلى المراجعة</button>}
          {step === 4 && <button className="btn btn-primary" type="button" disabled={submitting} onClick={doSubmit}>{submitting ? 'جارٍ الحفظ…' : 'تأكيد وحفظ الطلب'}</button>}
        </div>
      </div>
    </div>
  );
}
