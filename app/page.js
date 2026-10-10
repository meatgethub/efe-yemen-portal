'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import site from '../data/site.json';
import { getPrograms } from '../lib/static-store';
import { AVAILABILITY_LABELS, formatDateAr, TIMEZONE_LABEL } from '../lib/constants';

export default function Home() {
  const [f, setF] = useState({ q: '', loc: '', field: '', del: '', av: '' });
  const [tick, setTick] = useState(0);
  const all = useMemo(() => getPrograms(site), [tick]);
  useEffectTick(setTick);
  const locations = [...new Set(site.programs.map((p) => p.location))];
  const fields = [...new Set(site.programs.map((p) => p.field))];
  let list = all.filter((p) => !p.deleted);
  if (f.q) list = list.filter((p) => (p.title + ' ' + p.summary).includes(f.q));
  if (f.loc) list = list.filter((p) => p.location === f.loc);
  if (f.field) list = list.filter((p) => p.field === f.field);
  if (f.del) list = list.filter((p) => p.delivery === f.del);
  if (f.av) list = list.filter((p) => p._av === f.av);

  return (
    <div>
      <div className="notice warn" role="note"><strong>نسخة عرض ثابتة (GitHub Pages):</strong> التصفح والتجربة يعملان داخل متصفحك فقط. لا تُحفظ البيانات على خادم ولا تُرسَل إشعارات فعلية. للنسخة الكاملة (تحقق حقيقي وقاعدة بيانات) راجع فرع <span dir="ltr">full-server</span>.</div>
      <section className="card" aria-labelledby="hero">
        <h1 id="hero" style={{ margin: 0 }}>البرامج التدريبية المتاحة</h1>
        <p>ابحث عن البرنامج المناسب وقدّم طلبك مباشرة. جميع المواعيد <strong>{TIMEZONE_LABEL}</strong>.</p>
        <div className="toolbar" role="search" aria-label="بحث وتصفية البرامج">
          <input type="text" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="ابحث باسم البرنامج…" aria-label="بحث باسم البرنامج" />
          <select value={f.loc} onChange={(e) => setF({ ...f, loc: e.target.value })} aria-label="تصفية حسب الموقع">
            <option value="">كل المواقع</option>{locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} aria-label="تصفية حسب المجال">
            <option value="">كل المجالات</option>{fields.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select value={f.del} onChange={(e) => setF({ ...f, del: e.target.value })} aria-label="تصفية حسب طريقة التدريب">
            <option value="">حضوري / عن بُعد / مدمج</option>
            <option value="حضوري">حضوري</option><option value="عن بُعد">عن بُعد</option><option value="مدمج">مدمج</option>
          </select>
          <select value={f.av} onChange={(e) => setF({ ...f, av: e.target.value })} aria-label="تصفية حسب حالة التقديم">
            <option value="">مفتوح + قريباً + مغلق</option>
            <option value="open">التقديم مفتوح</option><option value="upcoming">يفتح قريباً</option><option value="closed">التقديم مغلق</option>
          </select>
          <button className="btn btn-ghost" onClick={() => setF({ q: '', loc: '', field: '', del: '', av: '' })}>مسح</button>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="notice info" role="status"><strong>لا توجد نتائج مطابقة.</strong><br />جرّب إزالة بعض الفلاتر أو البحث بكلمة مختلفة.</div>
      ) : (
        <div className="grid cols-2">
          {list.map((p) => (
            <article className="card" key={p.id} aria-label={p.title}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${p._av}`}>{AVAILABILITY_LABELS[p._av]}</span>
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
                  : <span className="small" role="note">{p._av === 'upcoming' ? 'سيُفتح التقديم قريباً.' : 'انتهى التقديم لهذه الدفعة.'}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
      <section className="card">
        <h2>لديك طلب سابق؟</h2>
        <p>ادخل رقم الهاتف أو البريد الإلكتروني لاستلام رمز تحقق تجريبي والوصول إلى طلباتك.</p>
        <Link className="btn btn-ghost" href="/dashboard">الانتقال إلى طلباتي</Link>
      </section>
    </div>
  );
}

import { useEffect } from 'react';
function useEffectTick(setTick) {
  useEffect(() => { setTick((t) => t + 1); }, []);
}
