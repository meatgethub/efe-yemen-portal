import { verify } from './auth.js';

export function staffFromRequest(req) {
  const t = req.cookies.get('efe_staff')?.value;
  if (!t) return null;
  const d = verify(t);
  if (!d || d.kind !== 'staff') return null;
  return d;
}

export const PERMS = {
  admin: ['programs.write', 'applications.write', 'decisions', 'notify', 'export', 'activity', 'enrollment'],
  program_manager: ['programs.write', 'applications.write', 'decisions', 'notify', 'export', 'enrollment'],
  reviewer: ['applications.review']
};

export function can(role, perm) {
  return (PERMS[role] || []).includes(perm);
}

export const ROLE_LABELS = { admin: 'مدير', program_manager: 'مدير برنامج', reviewer: 'مراجع' };
