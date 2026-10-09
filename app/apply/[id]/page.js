'use client';
import { useEffect, useMemo, useState } from 'react';

const STEPS = ['التواصل والإقامة', 'التعليم والعمل والدافعية', 'أسئلة البرنامج والمستندات', 'التحقق برمز لمرة واحدة', 'المراجعة والإرسال'];

export default function ApplyPage({ params }) {
  const programId = params.id;
  const [program, setProgram] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', channel: 'phone', address: '', age: '', gender: 'يفضل عدم الذكر',
    city: '', education: '', employment: '', motivation: '', availability: '',
    customAnswers: {}, documents: [], consent: false, idempotencyKey: ''
  });
  const [errors, setErrors] = useState({});
  const [otpState, setOtpState] = useState({ sent: false, demoCode: '', verified: false, message: '' });
  const [otpInput, setOtpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/programs/' + programId).then((r) => r.json()).then((j) => {
      setProgram(j.program || null); setLoading(false);
      const draftKey = 'draft_' + programId;
      try {
        const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (saved) setForm((f) => ({ ...f, ...saved }));
      } catch {}
    });
  }, [programId]);

  useEffect(() => {
    try { localStorage.setItem('draft_' + programId, JSON.stringify(form)); } catch {}
  }, [form, programId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadFile(slotId, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slotId', slotId);
    fd.append('programId', programId);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (!res.ok) { alert(j.error || 'فشل رفع الملف.'); return; }
    setForm((f) => ({ ...f, documents: [...f.documents.filter((d) => d.slotId !== slotId), { slotId, ...j.file }] }));
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

  async function requestOtp() {
    setOtpState({ sent: false, demoCode: '', verified: false, message: 'جارٍ إرسال الرمز…' });
    const res = await fetch('/api/otp/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: form.channel, address: form.address, programId })
    });
    const j = await res.json();
    if (!res.ok) { setOtpState({ sent: false, demoCode: '', verified: false, message: j.error || 'تعذر إرسال الرمز.' }); return; }
    setOtpState({ sent: true, demoCode: j.demoCode || '', verified: false, message: j.message });
  }

  async function verifyOtp() {
    const res = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: form.channel, address: form.address, code: otpInput })
    });
    const j = await res.json();
    if (!res.ok) { setOtpState((s) => ({ ...s, message: j.error || 'الرمز غير صحيح.' })); return; }
    setOtpState((s) => ({ ...s, verified: true, message: 'تم التحقق بنجاح. يمكنك الآن مراجعة طلبك وإرساله.' }));
  }

  async function submit() {
    if (!form.consent) { setErrors({ consent: 'يجب الموافقة على سياسة الخصوصية.' }); return; }
    if (!otpState.verified) { alert('أكمل خطوة التحقق برمز لمرة واحدة أولاً.'); setStep(3); return; }
    if (submitting) return;
    setSubmitting(true);
    const key = form.idempotencyKey || ('key_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
    if (!form.idempotencyKey) set('idempotencyKey', key);
    const res = await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, ...form, idempotencyKey: key })
    });
    const j = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      if (j.errors) setErrors(j.errors);
      alert(j.error || 'تعذر إرسال الطلب. تحقق من الحقول المطلوبة.');
      return;
    }
    setResult(j.application);
    try { localStorage.removeItem('draft_' + programId); } catch {}
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (loading) return <div className="notice info" role="status">جارٍ تحميل بيانات البرنامج…</div>;
  if (!program) return <div className="notice danger">البرنامج غير موجود أو مؤرشف.</div>;
  if (result) {
    return (
      <div className="card" role="status" aria-live="polite">
        <h1>تم استلام طلبك بنجاح ✓</h1>
        <p>احتفظ بالرقم المرجعي لمتابعة طلبك:</p>
        <p style={{ fontSize: 24, fontWeight: 800, direction: 'ltr' }}>{result.reference}</p>
        <p>الحالة الحالية: <strong>تم التقديم</strong>. ستصلك رسائل المتابعة على {form.channel === 'phone' ? 'هاتفك' : 'بريدك'}.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/dashboard">تتبع طلباتي</a>
          <a className="btn btn-ghost" href="/">تصفح برامج أخرى</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <a className="btn btn-ghost" href={`/programs/${programId}`}>→ العودة لتفاصيل البرنامج</a>
      <div className="card">
        <h1>طلب التقديم: {program.title}</h1>
        <p className="steps-label">الخطوة {step + 1} من {STEPS.length}: {STEPS[step]}</p>
        <div className="progress" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? 'done' : ''} />)}</div>

        {step === 0 && (
          <div>
            <div className="field"><label htmlFor="fullName">الاسم الكامل <span className="req">*</span></label>
              <input id="fullName" type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
              {errors.fullName && <div className="error-text">{errors.fullName}</div>}</div>
            <div className="field"><label>وسيلة التواصل للتحقق <span className="req">*</span></label>
              <select value={form.channel} onChange={(e) => set('channel', e.target.value)} aria-label="وسيلة التواصل">
                <option value="phone">هاتف (رسالة نصية)</option>
                <option value="email">بريد إلكتروني</option>
              </select></div>
            <div className="field"><label htmlFor="address">{form.channel === 'phone' ? 'رقم الهاتف مع رمز الدولة' : 'البريد الإلكتروني'} <span className="req">*</span></label>
              <input id="address" type="text" dir="ltr" placeholder={form.channel === 'phone' ? '+9677XXXXXXXX' : 'name@example.com'} value={form.address} onChange={(e) => set('address', e.target.value)} />
              {errors.address && <div className="error-text">{errors.address}</div>}</div>
            <div className="grid cols-2">
              <div className="field"><label htmlFor="age">العمر <span className="req">*</span></label>
                <input id="age" type="number" min="15" max="60" value={form.age} onChange={(e) => set('age', e.target.value)} />
                {errors.age && <div className="error-text">{errors.age}</div>}</div>
              <div className="field"><label htmlFor="city">المدينة / مكان الإقامة <span className="req">*</span></label>
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
            <div className="field"><label htmlFor="mot">لماذا تريد الالتحاق بهذا البرنامج؟ <span className="req">*</span></label>
              <textarea id="mot" value={form.motivation} onChange={(e) => set('motivation', e.target.value)} placeholder="اكتب باختصار دافعك وما تأمل تحقيقه…" />
              {errors.motivation && <div className="error-text">{errors.motivation}</div>}</div>
            <div className="field"><label htmlFor="avail">مدى التفرغ والتوفر <span className="req">*</span></label>
              <input id="avail" type="text" value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="مثال: متفرغ تماماً خلال فترة التدريب" />
              {errors.availability && <div className="error-text">{errors.availability}</div>}</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>أسئلة خاصة بالبرنامج</h2>
            {(program.formConfig?.customQuestions || []).length === 0 && <p className="small">لا توجد أسئلة إضافية لهذا البرنامج.</p>}
            {(program.formConfig?.customQuestions || []).map((q) => (
              <div className="field" key={q.id}>
                <label>{q.label} {q.required ? <span className="req">*</span> : <span className="small">(اختياري)</span>}</label>
                <textarea value={form.customAnswers[q.id] || ''} onChange={(e) => set('customAnswers', { ...form.customAnswers, [q.id]: e.target.value })} />
              </div>
            ))}
            <h2>المستندات</h2>
            <p className="small">الأنواع المقبولة: PDF أو Word أو JPG/PNG — بحد أقصى 5 ميجابايت.</p>
            {(program.formConfig?.requiredDocuments || []).length === 0 && <p className="small">لا توجد مستندات إلزامية.</p>}
            {(program.formConfig?.requiredDocuments || []).map((d) => (
              <div className="field" key={d.id}>
                <label>{d.label} {d.required ? <span className="req">*</span> : <span className="small">(اختياري)</span>}</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => uploadFile(d.id, e.target.files?.[0])} aria-label={d.label} />
                {form.documents.find((x) => x.slotId === d.id) && <div className="small">تم الرفع: {form.documents.find((x) => x.slotId === d.id).name}</div>}
              </div>
            ))}
            <div className="notice info">تُحفظ مسودتك تلقائياً في هذا الجهاز. لإرسال الطلب يجب إتمام التحقق في الخطوة التالية.</div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>التحقق برمز لمرة واحدة</h2>
            <p>لحماية طلبك ومنع التقديم المكرر، نرسل رمزاً من 6 أرقام إلى <strong>{form.address}</strong> قبل الحفظ والإرسال. الرمز صالح 10 دقائق فقط. معلوماتك المدخلة محفوظة ولن تضيع.</p>
            <div className="notice warn"><strong>وضع تجريبي موسوم:</strong> لا تُرسَل رسائل فعلية حالياً. سيظهر الرمز على هذه الشاشة للتجربة فقط. عند تفعيل SMS/البريد في الإنتاج سيصلك الرمز فعلياً (راجع README).</div>
            <button className="btn btn-secondary" onClick={requestOtp} type="button">إرسال / إعادة إرسال الرمز</button>
            {otpState.message && <p role="status">{otpState.message}</p>}
            {otpState.demoCode && <div className="notice info" role="status">الرمز التجريبي (للعرض فقط): <strong dir="ltr">{otpState.demoCode}</strong></div>}
            {otpState.sent && (
              <div className="field">
                <label htmlFor="otp">أدخل الرمز المكوّن من 6 أرقام</label>
                <input id="otp" type="text" inputMode="numeric" dir="ltr" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} />
                <div style={{ marginTop: 8 }}><button className="btn btn-primary" type="button" onClick={verifyOtp}>تحقق</button></div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2>مراجعة طلبك قبل الإرسال</h2>
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
              <label><input type="checkbox" checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} /> أوافق على <a href="/privacy">سياسة الخصوصية</a> ومعالجة بياناتي لغرض التقديم والمراجعة. <span className="req">*</span></label>
              {errors.consent && <div className="error-text">{errors.consent}</div>}
            </div>
            {!otpState.verified && <div className="notice danger">لم يتم التحقق بعد. عُد إلى خطوة التحقق أولاً.</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {step > 0 && <button className="btn btn-ghost" type="button" onClick={() => setStep(step - 1)}>السابق</button>}
          {step < 2 && <button className="btn btn-primary" type="button" onClick={() => { if (validateStep()) setStep(step + 1); }}>التالي</button>}
          {step === 2 && <button className="btn btn-primary" type="button" onClick={() => setStep(3)}>الانتقال إلى التحقق</button>}
          {step === 3 && otpState.verified && <button className="btn btn-primary" type="button" onClick={() => setStep(4)}>الانتقال إلى المراجعة</button>}
          {step === 4 && <button className="btn btn-primary" type="button" disabled={submitting} onClick={submit}>{submitting ? 'جارٍ الإرسال…' : 'تأكيد وإرسال الطلب'}</button>}
        </div>
      </div>
    </div>
  );
}
