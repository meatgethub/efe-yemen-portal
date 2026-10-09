// ثوابت مشتركة — عربية فقط في الواجهة
export const TIMEZONE = 'Asia/Aden';
export const TIMEZONE_LABEL = 'بتوقيت عدن (Asia/Aden)';

export const STATUS_LABELS = {
  draft: 'مسودة',
  submitted: 'تم التقديم',
  under_review: 'قيد المراجعة',
  shortlisted: 'القائمة المختصرة',
  waitlisted: 'قائمة الانتظار',
  accepted: 'مقبول',
  rejected: 'لم يتم الاختيار',
  enrolled: 'مؤكد التسجيل',
  declined: 'معتذر عن المقعد'
};

export const STATUS_DESCRIPTIONS = {
  draft: 'لم يُرسَل بعد. يمكنك إكماله وإرساله قبل الموعد النهائي.',
  submitted: 'استلمنا طلبك وسيبدأ فريق المراجعة بدراسته.',
  under_review: 'طلبك قيد الدراسة من قبل المراجعين.',
  shortlisted: 'تم اختيارك ضمن القائمة المختصرة. تابع الرسائل للخطوة التالية.',
  waitlisted: 'أنت في قائمة الانتظار. سنتصل بك عند توفر مقعد.',
  accepted: 'تم قبولك! أكّد مقعدك قبل الموعد الموضح.',
  rejected: 'لم يتم اختيارك هذه المرة. يمكنك التقديم على برامج أخرى.',
  enrolled: 'تم تأكيد تسجيلك. تابع الجدول والتعليمات.',
  declined: 'سجلنا اعتذارك عن المقعد. شكراً لإبلاغنا.'
};

export const AVAILABILITY_LABELS = {
  open: 'التقديم مفتوح',
  upcoming: 'يفتح قريباً',
  closed: 'التقديم مغلق'
};

export const LOCATIONS = ['عدن', 'صنعاء', 'تعز', 'حضرموت (المكلا)', 'الحديدة', 'عن بُعد'];
export const FIELDS = ['تقنية المعلومات', 'الطاقة الشمسية', 'الأعمال وريادة الأعمال', 'المهارات الحياتية والتوظيف', 'المحاسبة والإدارة', 'الصحة', 'الخياطة والتجزئة'];
export const DELIVERY = ['حضوري', 'عن بُعد', 'مدمج'];
export const EDUCATION_LEVELS = ['ثانوية عامة أو أقل', 'دبلوم', 'بكالوريوس', 'دراسات عليا'];
export const EMPLOYMENT = ['عاطل عن العمل', 'طالب', 'عمل جزئي', 'عمل كامل', 'عمل حر'];

export const MAX_FILE_MB = 5;
export const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];
export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

export function programAvailability(p, now = new Date()) {
  if (p.status === 'archived') return 'closed';
  if (p.status === 'draft') return 'upcoming';
  if (p.status === 'closed') return 'closed';
  // published: حسب التواريخ
  try {
    if (p.applicationDeadline) {
      const d = new Date(p.applicationDeadline);
      if (!isNaN(d) && d < now) return 'closed';
    }
    if (p.applicationOpenDate) {
      const o = new Date(p.applicationOpenDate);
      if (!isNaN(o) && o > now) return 'upcoming';
    }
  } catch {}
  return 'open';
}

export function formatDateAr(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ar-YE', {
      timeZone: TIMEZONE,
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(d);
  } catch { return iso; }
}

export function formatDateTimeAr(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ar-YE', {
      timeZone: TIMEZONE,
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  } catch { return iso; }
}
