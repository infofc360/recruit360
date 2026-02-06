import { Coach, CoachRole } from '@/types/college';

export function classifyCoachRole(title: string): CoachRole {
  const t = title.toLowerCase();
  if (t.includes('associate head') || t.includes('associate hd')) return 'associate';
  if (t.includes('head coach') || t === 'head' || t.includes('hd coach')) return 'head';
  return 'assistant';
}

export function filterCoachesByRoles(coaches: Coach[], roles: CoachRole[]): Coach[] {
  return coaches.filter(c => roles.includes(classifyCoachRole(c.title)));
}

const MAX_MAILTO_LENGTH = 1900;

export function buildMailtoLinks(
  emails: string[],
  subject: string
): string[] {
  const uniqueEmails = [...new Set(emails.filter(e => e && e.includes('@')))];
  if (uniqueEmails.length === 0) return [];

  const links: string[] = [];
  let batch: string[] = [];
  let currentLength = 0;
  const encodedSubject = encodeURIComponent(subject);
  const baseLength = `mailto:?subject=${encodedSubject}&bcc=`.length;

  for (const email of uniqueEmails) {
    const addedLength = batch.length > 0 ? email.length + 1 : email.length; // +1 for comma
    if (currentLength + addedLength + baseLength > MAX_MAILTO_LENGTH && batch.length > 0) {
      links.push(`mailto:?subject=${encodedSubject}&bcc=${batch.join(',')}`);
      batch = [];
      currentLength = 0;
    }
    batch.push(email);
    currentLength += addedLength;
  }

  if (batch.length > 0) {
    links.push(`mailto:?subject=${encodedSubject}&bcc=${batch.join(',')}`);
  }

  return links;
}
