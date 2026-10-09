// تحقق من بيانات الطلب في الخادم (لا نعتمد على تحقق المتصفح وحده).
import { ALLOWED_EXT, MAX_FILE_MB } from './constants.js';

export function validateApplicationInput(body, program) {
  const errors = {};
  const req = (v) => v === undefined || v === null || String(v).trim() === '';
  if (req(body.fullName) || String(body.fullName).trim().length < 3) errors.fullName = 'اكتب الاسم الكامل (3 أحرف على الأقل).';
  if (!body.channel || !['phone', 'email'].includes(body.channel)) errors.channel = 'اختر وسيلة التواصل: هاتف أو بريد إلكتروني.';
  if (req(body.address)) errors.address = 'اكتب رقم الهاتف أو البريد الإلكتروني.';
  const age = Number(body.age);
  if (!age || age < 15 || age > 60) errors.age = 'اكتب العمر رقماً بين 15 و60.';
  if (req(body.city)) errors.city = 'اختر المدينة / مكان الإقامة.';
  if (req(body.education)) errors.education = 'اختر المستوى التعليمي.';
  if (req(body.employment)) errors.employment = 'اختر الحالة العملية.';
  if (req(body.motivation) || String(body.motivation).trim().length < 20) errors.motivation = 'اكتب دافعك باختصار (20 حرفاً على الأقل).';
  if (req(body.availability)) errors.availability = 'وضّح مدى تفرغك لحضور التدريب.';
  if (!body.consent) errors.consent = 'يجب الموافقة على سياسة الخصوصية لإرسال الطلب.';
  // أسئلة خاصة بالبرنامج
  const custom = program?.formConfig?.customQuestions || [];
  for (const q of custom) {
    if (q.required && req(body.customAnswers?.[q.id])) errors['custom_' + q.id] = 'هذا السؤال مطلوب: ' + q.label;
  }
  // مستندات مطلوبة
  const docs = program?.formConfig?.requiredDocuments || [];
  for (const d of docs) {
    if (d.required && !(body.documents || []).some((x) => x.slotId === d.id)) errors['doc_' + d.id] = 'المستند مطلوب: ' + d.label;
  }
  return errors;
}

export function checkFileMeta(name, sizeBytes, mime) {
  const ext = String(name).split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return `نوع الملف غير مقبول. الأنواع المقبولة: ${ALLOWED_EXT.join('، ')}.`;
  if (sizeBytes > MAX_FILE_MB * 1024 * 1024) return `حجم الملف كبير. الحد الأقصى ${MAX_FILE_MB} ميجابايت.`;
  return null;
}
