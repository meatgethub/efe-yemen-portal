'use client';
export default function AdminExport() {
  return (
    <div>
      <h1>تصدير البيانات</h1>
      <a className="btn btn-ghost" href="/admin">→ لوحة الإدارة</a>
      <div className="card">
        <p>يُصدَّر ملف CSV بترميز UTF-8 (يُفتح في Excel) ويشمل الحقول المصرّح بها فقط. التصدير متاح لمدير النظام ومدير البرنامج.</p>
        <p><a className="btn btn-primary" href="/api/admin/export">تنزيل كل الطلبات (CSV)</a></p>
        <p className="small">لتصدير برنامج محدد: <span dir="ltr">/api/admin/export?programId=PROGRAM_ID</span></p>
      </div>
    </div>
  );
}
