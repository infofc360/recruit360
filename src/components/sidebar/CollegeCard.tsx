'use client';

import { useState } from 'react';
import { College } from '@/types/college';

interface CollegeCardProps {
  college: College;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  distanceMiles?: number;
  isChecked?: boolean;
  onToggleCheck?: (id: string) => void;
}

export default function CollegeCard({
  college,
  isSelected,
  onSelect,
  onHover,
  distanceMiles,
  isChecked,
  onToggleCheck,
}: CollegeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg bg-[#1a1a1a] transition-all cursor-pointer ${
        isSelected
          ? 'border-[#c8f000] shadow-[0_0_12px_rgba(200,240,0,0.15)]'
          : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
      }`}
      onClick={() => onSelect(college.id)}
      onMouseEnter={() => onHover(college.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {onToggleCheck && (
            <input
              type="checkbox"
              checked={isChecked ?? false}
              onChange={() => onToggleCheck(college.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-2.5 h-4 w-4 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-[#c8f000] cursor-pointer flex-shrink-0"
            />
          )}

          {/* Logo placeholder */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
            isSelected ? 'bg-[#c8f000] text-black' : 'bg-[#2a2a2a] text-[#c8f000]'
          }`}>
            {college.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">
              {college.name}
            </h3>
            <p className="text-[#888] text-xs mt-0.5">
              {college.division === 'ECNL'
                ? college.conference
                : `${college.city}, ${college.state}`}
              {distanceMiles != null && (
                <span className="text-[#c8f000] font-medium"> ({distanceMiles} mi)</span>
              )}
              {' '}&bull; {college.division}
            </p>
          </div>

          {/* Location icon */}
          <button
            className="text-[#555] hover:text-[#c8f000] p-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(college.id);
            }}
            title="Show on map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Conference badge */}
        <div className="mt-2 ml-12">
          <span className="inline-block bg-[#222] border border-[#2a2a2a] text-[#888] text-xs px-2 py-0.5 rounded">
            {college.conference}
          </span>
        </div>
      </div>

      {/* Expandable section */}
      <div className="border-t border-[#2a2a2a]">
        <button
          className="w-full px-3 py-2 flex items-center justify-between text-xs text-[#555] hover:text-[#888] hover:bg-[#1e1e1e] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <span className="font-medium">
            {college.division === 'ECNL' ? 'Club Contacts' : 'Coaching Staff'}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 bg-[#141414]">
            {college.division === 'ECNL' ? (
              college.coaches.length > 0 ? (
                college.coaches.map((coach, idx) => (
                  <a
                    key={idx}
                    href={`mailto:${coach.email}`}
                    className="block text-[#c8f000] text-xs hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {coach.email}
                  </a>
                ))
              ) : (
                <p className="text-[#555] text-xs">No contact emails available</p>
              )
            ) : (
              college.coaches.map((coach, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-white text-xs">{coach.name}</p>
                  <p className="text-[#555] text-xs">{coach.title}</p>
                  <a
                    href={`mailto:${coach.email}`}
                    className="text-[#c8f000] text-xs hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {coach.email}
                  </a>
                </div>
              ))
            )}
            {college.website && (
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-[#888] hover:text-[#c8f000] transition-colors mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                {college.division === 'ECNL' ? 'Visit Club Website' : 'Visit Athletics Website'} →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
