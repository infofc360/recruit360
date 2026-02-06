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
      className={`border rounded-lg bg-white transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(college.id)}
      onMouseEnter={() => onHover(college.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {onToggleCheck && (
            <input
              type="checkbox"
              checked={isChecked ?? false}
              onChange={() => onToggleCheck(college.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
            />
          )}

          {/* Logo placeholder */}
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {college.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-blue-600 font-medium text-sm hover:underline truncate">
              {college.name}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {college.city}, {college.state}
              {distanceMiles != null && (
                <span className="text-amber-600 font-medium"> ({distanceMiles} mi)</span>
              )}
              {' '}&bull; {college.division}
            </p>
          </div>

          {/* Location icon */}
          <button
            className="text-gray-400 hover:text-blue-500 p-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(college.id);
            }}
            title="Show on map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Conference badge */}
        <div className="mt-2">
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
            {college.conference}
          </span>
        </div>
      </div>

      {/* Expandable section */}
      <div className="border-t border-gray-100">
        <button
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <span className="font-medium">Coaching Staff</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {college.coaches.map((coach, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-medium text-gray-800">{coach.name}</p>
                <p className="text-gray-500 text-xs">{coach.title}</p>
                <a
                  href={`mailto:${coach.email}`}
                  className="text-blue-600 text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {coach.email}
                </a>
              </div>
            ))}
            {college.website && (
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-blue-600 hover:underline mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Athletics Website →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
