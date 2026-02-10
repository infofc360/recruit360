'use client';

import { useState, useMemo } from 'react';
import { College, CoachRole, AppMode } from '@/types/college';
import { classifyCoachRole, filterCoachesByRoles, buildMailtoLinks } from '@/lib/coachUtils';

interface EmailModalProps {
  colleges: College[];
  onClose: () => void;
  mode: AppMode;
}

const ROLE_LABELS: Record<CoachRole, string> = {
  head: 'Head Coaches',
  assistant: 'Assistant Coaches',
  associate: 'Associate Head Coaches',
};

export default function EmailModal({ colleges, onClose, mode }: EmailModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<CoachRole[]>(['head', 'assistant', 'associate']);
  const [subject, setSubject] = useState('Recruiting Inquiry');
  const [copied, setCopied] = useState(false);

  const toggleRole = (role: CoachRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filteredEmails = useMemo(() => {
    const emails: string[] = [];
    for (const college of colleges) {
      if (mode === 'ecnl') {
        // ECNL: include all emails directly
        for (const coach of college.coaches) {
          if (coach.email) emails.push(coach.email);
        }
      } else {
        const coaches = filterCoachesByRoles(college.coaches, selectedRoles);
        for (const coach of coaches) {
          if (coach.email) emails.push(coach.email);
        }
      }
    }
    return [...new Set(emails)];
  }, [colleges, selectedRoles, mode]);

  const roleCounts = useMemo(() => {
    const counts: Record<CoachRole, number> = { head: 0, assistant: 0, associate: 0 };
    for (const college of colleges) {
      for (const coach of college.coaches) {
        if (coach.email) {
          counts[classifyCoachRole(coach.title)]++;
        }
      }
    }
    return counts;
  }, [colleges]);

  const mailtoLinks = useMemo(() => {
    return buildMailtoLinks(filteredEmails, subject);
  }, [filteredEmails, subject]);

  const handleCopyEmails = async () => {
    await navigator.clipboard.writeText(filteredEmails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'ecnl' ? 'Email Clubs' : 'Email Coaches'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* School/club count */}
          <p className="text-sm text-gray-500 mb-4">
            {colleges.length} {mode === 'ecnl' ? 'club' : 'school'}{colleges.length !== 1 ? 's' : ''} selected
          </p>

          {/* Coach role filters — hidden in ECNL mode */}
          {mode !== 'ecnl' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Include coaches:
              </label>
              <div className="space-y-2">
                {(Object.keys(ROLE_LABELS) as CoachRole[]).map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {ROLE_LABELS[role]}
                      <span className="text-gray-400 ml-1">({roleCounts[role]})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Subject line */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Subject line:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Recipients count */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{filteredEmails.length}</span> recipient{filteredEmails.length !== 1 ? 's' : ''}
              {mailtoLinks.length > 1 && (
                <span className="text-amber-600">
                  {' '}(split into {mailtoLinks.length} batches due to email client limits)
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {mailtoLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {mailtoLinks.length > 1 ? `Open Batch ${i + 1}` : 'Open in Email Client'}
              </a>
            ))}

            <button
              onClick={handleCopyEmails}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy All Emails'}
            </button>
          </div>

          {filteredEmails.length === 0 && (
            <p className="mt-4 text-sm text-amber-600">
              {mode === 'ecnl'
                ? 'No contact emails available for the selected clubs.'
                : 'No coaches match the selected roles. Try selecting different coach types.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
