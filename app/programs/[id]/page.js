import Link from 'next/link';
import site from '../../../data/site.json';
import { getPrograms } from '../../../lib/static-store';
import { AVAILABILITY_LABELS, formatDateAr, formatDateTimeAr, TIMEZONE_LABEL } from '../../../lib/constants';

export function generateStaticParams() {
  return site.programs.map((p) => ({ id: p.id }));
}

export default function ProgramDetails({ params }) {
  const list = getPrograms(site);
  const p = list.find((x) => x.id === params.id);
  if (!p) return <div className="notice danger">البرنامج غير موجود أو مؤرشف. <Link href="/">العودة إلى البرامج</Link></div>;

  return (
    <div>
      <Link className="btn btn-ghost" href="/">→ العودة إلى البرامج</Link>
      <article className="card" aria-labelledby="ptitle">
        <span className={`badge ${p._av}`}>{AVAILABILITY_LABELS[p._av]}</span>
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
        <ul>{(p.eligibility || []).map((e, i) => <li key={i}>{e}</li>)}</ul>
        <h2>المستندات المطلوبة</h2>
        {(p.formConfig?.requiredDocuments || []).length === 0
          ? <p>لا توجد مستندات إلزامية لهذا البرنامج.</p>
          : <ul>{p.formConfig.requiredDocuments.map((d) => <li key={d.id}>{d.label} {d.required ? '(إلزامي)' : '(اختياري)'}</li>)}</ul>}
        <p className="small">الملفات المقبولة: PDF أو Word أو JPG/PNG — بحد أقصى 5 ميجابايت للملف (في النسخة الثابتة يُسجَّل اسم الملف فقط).</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {p._av === 'open'
            ? <Link className="btn btn-primary" href={`/apply/${p.id}`}>ابدأ التقديم — بدون تسجيل مسبق</Link>
            : <div className="notice warn" role="note">{p._av === 'upcoming' ? 'التقديم لم يفتح بعد. عُد قريباً.' : 'انتهى موعد التقديم لهذه الدفعة. يمكنك التقديم على برامج أخرى مفتوحة.'}</div>}
        </div>
      </article>
    </div>
  );
}
