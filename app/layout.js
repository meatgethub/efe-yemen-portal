import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

export const metadata = {
  title: 'بوابة التدريب والتسجيل | EFE-Yemen',
  description: 'بوابة عربية للبرامج التدريبية والتقديم ومتابعة الطلبات — EFE-Yemen (عدن). نسخة عرض ثابتة.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a className="skip-link" href="#main">تخطَّ إلى المحتوى</a>
        <div className="demo-strip" role="note">
          نسخة عرض ثابتة: البيانات تُحفظ في متصفحك فقط ولا تُرسَل إشعارات فعلية — النسخة الكاملة ذات الخادم في فرع full-server
        </div>
        <header className="topbar">
          <div className="topbar-inner">
            <Link className="brand" href="/" aria-label="الصفحة الرئيسية لبوابة EFE-Yemen">
              <Image src="/efe-yemen-portal/logo-efe-yemen.png" alt="شعار مؤسسة التعليم من أجل التوظيف – اليمن" width={200} height={95} className="brand-logo" priority />
              <span>
                بوابة التدريب والتسجيل — EFE-Yemen (عدن)
                <small>محتوى تجريبي موسوم • جميع المواعيد بتوقيت عدن (Asia/Aden)</small>
              </span>
            </Link>
            <nav className="nav" aria-label="التنقل الرئيسي">
              <Link href="/">البرامج</Link>
              <Link href="/dashboard">طلباتي</Link>
              <Link href="/enrollment">التسجيل</Link>
              <Link href="/help">المساعدة</Link>
              <Link href="/admin">الإدارة</Link>
            </nav>
          </div>
        </header>
        <main id="main" className="container">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <strong>مؤسسة التعليم من أجل التوظيف — اليمن (EFE-Yemen)</strong>
            <br />
            تأسست 2008 بهدف ربط الشباب اليمني بالوظائف والدخل (حسب صفحة الشبكة الرسمية).
            جميع البرامج المعروضة <strong>محتوى تجريبي موسوم</strong>.{' '}
            <Link href="/privacy">سياسة الخصوصية والموافقة</Link> • <Link href="/help">اتصل بنا</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
