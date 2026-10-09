import './globals.css';

export const metadata = {
  title: 'بوابة التدريب والتسجيل | EFE-Yemen',
  description: 'بوابة عربية للبرامج التدريبية والتقديم ومتابعة الطلبات وإدارة التسجيل — EFE-Yemen (عدن).'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a className="skip-link" href="#main">تخطَّ إلى المحتوى</a>
        <div className="demo-strip" role="note">
          وضع تجريبي موسوم: رموز التحقق والإشعارات للعرض فقط ولا تُرسَل فعلياً — راجع صفحة المساعدة وإعدادات الإنتاج في README
        </div>
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="/" aria-label="الصفحة الرئيسية لبوابة EFE-Yemen">
              <img src="/logo-efe-yemen.png" alt="شعار مؤسسة التعليم من أجل التوظيف – اليمن" className="brand-logo" />
              <span>
                بوابة التدريب والتسجيل — EFE-Yemen (عدن)
                <small>محتوى تجريبي موسوم حتى تعتمد EFE-Yemen البيانات النهائية • المرجع: efe.org/network/efe-yemen</small>
              </span>
            </a>
            <nav className="nav" aria-label="التنقل الرئيسي">
              <a href="/">البرامج</a>
              <a href="/dashboard">طلباتي</a>
              <a href="/enrollment">التسجيل</a>
              <a href="/help">المساعدة</a>
              <a href="/admin">الإدارة</a>
            </nav>
          </div>
        </header>
        <main id="main" className="container">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <strong>مؤسسة التعليم من أجل التوظيف — اليمن (EFE-Yemen)</strong>
            <br />
            تأسست 2008 بهدف ربط الشباب اليمني بالوظائف والدخل عبر شراكات القطاع الخاص وتدريب موجه حسب الطلب (حسب صفحة الشبكة الرسمية).
            جميع البرامج والمواعيد المعروضة هنا <strong>محتوى تجريبي موسوم</strong> وقابل للتحرير من لوحة الطاقم.
            جميع المواعيد النهائية <strong>بتوقيت عدن (Asia/Aden)</strong>.{' '}
            <a href="/privacy">سياسة الخصوصية والموافقة</a> • <a href="/help">اتصل بنا</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
