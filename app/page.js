import { readDB } from '../lib/db';
import { AVAILABILITY_LABELS, programAvailability, formatDateAr, TIMEZONE_LABEL } from '../lib/constants';

export const dynamic = 'force-dynamic';

function statusBadge(av) {
  const label = AVAILABILITY_LABELS[av];
  const icon = av === 'open' ? '●' : av === 'upcoming' ? '◷' : '■';
  return <span className={`badge ${av}`}><span aria-hidden="true">{icon}</span> {label}</span>;
}

export default function Home({ searchParams }) {
  const db = readDB();
  const q = (searchParams?.q || '').trim();
  const loc = searchParams?.loc || '';
  const field = searchParams?.field || '';
  const del = searchParams?.del || '';
  const av = searchParams?.av || '';

  const locations = [...new Set(db.programs.map((p) => p.location))];
  const fields = [...new Set(db.programs.map((p) => p.field))];

  let list = db.programs.filter((p) => p.status !== 'archived');
  if (q) list = list.filter((p) => (p.title + ' ' + p.summary).includes(q));
  if (loc) list = list.filter((p) => p.location === loc);
  if (field) list = list.filter((p) => p.field === field);
  if (del) list = list.filter((p) => p.delivery === del);
  list = list.map((p) => ({ ...p, _av: programAvailability(p) }));
  if (av) list = list.filter((p) => p._av === av);
  list.sort((a, b) => (a._av === 'open' ? 0 : 1) - (b._av === 'open' ? 0 : 1));

  return (
    <div>
      <section className="card" aria-labelledby="hero">
        <h1 id="hero" style={{ margin: 0 }}>البرامج التدريبية المتاحة</h1>
        <p>
          ابحث عن البرنامج المناسب وقدّم طلبك مباشرة. يمكنك بدء الطلب بدون تسجيل،
          واستلام رمز تحقق قبل الحفظ أو الإرسال. جميع المواعيد <strong>{TIMEZONE_LABEL}</strong>.
        </p>
        <div className="toolbar" role="search" aria-label="بحث وتصفية البرامج">
          <form method="get" action="/" style={{ display: 'contents' }}>
            <input type="text" name="q" defaultValue={q} placeholder="ابحث باسم البرنامج…" aria-label="بحث باسم البرنامج" />
            <select name="loc" defaultValue={loc} aria-label="تصفية حسب الموقع">
              <option value="">كل المواقع</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select name="field" defaultValue={field} aria-label="تصفية حسب المجال">
              <option value="">كل المجالات</option>
              {fields.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select name="del" defaultValue={del} aria-label="تصفية حسب طريقة التدريب">
              <option value="">حضوري / عن بُعد / مدمج</option>
              <option value="حضوري">حضوري</option>
              <option value="عن بُعد">عن بُعد</option>
              <option value="مدمج">مدمج</option>
            </select>
            <select name="av" defaultValue={av} aria-label="تصفية حسب حالة التقديم">
              <option value="">مفتوح + قريباً + مغلق</option>
              <option value="open">التقديم مفتوح</option>
              <option value="upcoming">يفتح قريباً</option>
              <option value="closed">التقديم مغلق</option>
            </select>
            <button className="btn btn-primary" type="submit">بحث وتصفية</button>
            <a className="btn btn-ghost" href="/">مسح</a>
          </form>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="notice info" role="status">
          <strong>لا توجد نتائج مطابقة.</strong>
          <br />جرّب إزالة بعض الفلاتر أو البحث بكلمة مختلفة. يمكنك أيضاً تصفح <a href="/">كل البرامج</a> أو التواصل معنا عبر <a href="/help">صفحة المساعدة</a>.
        </div>
      ) : (
        <div className="grid cols-2">
          {list.map((p) => (
            <article className="card" key={p.id} aria-label={p.title}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                {statusBadge(p._av)}
                <span className="small">{p.location} • {p.delivery} • {p.field}</span>
              </div>
              <h2 style={{ fontSize: 19 }}>{p.title} <span className="sample-tag">محتوى تجريبي</span></h2>
              <p>{p.summary}</p>
              <dl className="kv">
                <dt>آخر موعد للتقديم</dt><dd>{formatDateAr(p.applicationDeadline)} — {TIMEZONE_LABEL}</dd>
                <dt>بدء التدريب</dt><dd>{formatDateAr(p.startDate)}</dd>
                <dt>السعة</dt><dd>{p.capacity} مقعداً • التكلفة: {p.cost}</dd>
              </dl>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <a className="btn btn-secondary" href={`/programs/${p.id}`}>التفاصيل</a>
                {p._av === 'open'
                  ? <a className="btn btn-primary" href={`/apply/${p.id}`}>قدّم الآن</a>
                  : <span className="small" role="note">{p._av === 'upcoming' ? 'سيُفتح التقديم قريباً — تابع هذه الصفحة.' : 'انتهى التقديم لهذه الدفعة.'}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="card">
        <h2>لديك طلب سابق؟</h2>
        <p>ادخل رقم الهاتف أو البريد الإلكتروني لاستلام رمز تحقق والوصول إلى طلباتك بدون كلمة مرور.</p>
        <a className="btn btn-ghost" href="/dashboard">الانتقال إلى طلباتي</a>
      </section>
    </div>
  );
}
