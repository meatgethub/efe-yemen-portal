import { notFound } from 'next/navigation';
import { readDB } from '../../../lib/db';
import { programAvailability, AVAILABILITY_LABELS, formatDateAr, formatDateTimeAr, TIMEZONE_LABEL } from '../../../lib/constants';

export const dynamic = 'force-dynamic';

export default function ProgramDetails({ params }) {
  const db = readDB();
  const p = db.programs.find((x) => x.id === params.id);
  if (!p) return notFound();
  const av = programAvailability(p);

  return (
    <div>
      <a className="btn btn-ghost" href="/">→ العودة إلى البرامج</a>
      <article className="card" aria-labelledby="ptitle">
        <span className={`badge ${av}`}>{AVAILABILITY_LABELS[av]}</span>
        <h1 id="ptitle">{p.title} <span className="sample-tag">محتوى تجريبي</span></h1>
        <p>{p.description}</p>
        <dl className="kv">
          <dt>المجال</dt><dd>{p.field}</dd>
          <dt>الموقع</dt><dd>{p.location}</dd>
          <dt>طريقة التدريب</dt><dd>{p.delivery}</dd>
          <dt>فترة التدريب</dt><dd>{formatDateAr(p.startDate)} — {formatDateAr(p.endDate)}</dd>
          <dt>الجدول</dt><dd>{p.schedule}</dd>
          <dt>مكان التدريب</dt><dd>{p.venue}</dd>
          <dt>آخر موعد للتقديم</dt><dd><strong>{formatDateTimeAr(p.applicationDeadline)}</strong> — {TIMEZONE_LABEL}</dd>
          <dt>السعة</dt><dd>{p.capacity} مقعداً</dd>
          <dt>التكلفة</dt><dd>{p.cost}</dd>
        </dl>
        <h2>شروط الأهلية</h2>
        <ul>
          {(p.eligibility || []).map((e, i) => <li key={i}>{e}</li>)}
        </ul>
        <h2>المستندات المطلوبة</h2>
        {(p.formConfig?.requiredDocuments || []).length === 0
          ? <p>لا توجد مستندات إلزامية لهذا البرنامج.</p>
          : <ul>{p.formConfig.requiredDocuments.map((d) => <li key={d.id}>{d.label} {d.required ? '(إلزامي)' : '(اختياري)'}</li>)}</ul>}
        <p className="small">الملفات المقبولة: PDF أو Word أو JPG/PNG — بحد أقصى 5 ميجابايت للملف.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {av === 'open'
            ? <a className="btn btn-primary" href={`/apply/${p.id}`}>ابدأ التقديم — بدون تسجيل مسبق</a>
            : <div className="notice warn" role="note">{av === 'upcoming' ? 'التقديم لم يفتح بعد. عُد قريباً.' : 'انتهى موعد التقديم لهذه الدفعة. يمكنك التقديم على برامج أخرى مفتوحة.'}</div>}
        </div>
      </article>
    </div>
  );
}
