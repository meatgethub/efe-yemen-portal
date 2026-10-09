import { readDB } from '../../lib/db';
export const dynamic = 'force-dynamic';
export default function Help() {
  const db = readDB();
  return (
    <div>
      <h1>المساعدة والتواصل</h1>
      <section className="card" aria-labelledby="faq">
        <h2 id="faq">أسئلة شائعة</h2>
        {db.faqs.map((f, i) => (
          <details key={i} style={{ marginBottom: 8 }}>
            <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
      <section className="card">
        <h2>تواصل معنا</h2>
        <p><span className="sample-tag">بيانات تجريبية — تُستبدل ببيانات معتمدة من EFE-Yemen</span></p>
        <dl className="kv">
          <dt>الهاتف</dt><dd dir="ltr">{db.contact.phone}</dd>
          <dt>البريد</dt><dd dir="ltr">{db.contact.email}</dd>
          <dt>العنوان</dt><dd>{db.contact.address}</dd>
          <dt>الدوام</dt><dd>{db.contact.hours}</dd>
        </dl>
        <p className="small">المرجع الرسمي: <a href="https://www.efe.org/network/efe-yemen">صفحة EFE-Yemen على موقع الشبكة</a></p>
      </section>
    </div>
  );
}
