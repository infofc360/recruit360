'use client';

import { useEffect, useRef } from 'react';
import { College } from '@/types/college';
import CollegeCard from './CollegeCard';

interface CollegeListProps {
  colleges: (College & { distanceMiles?: number })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  selectedCollegeIds?: Set<string>;
  onToggleCheck?: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export default function CollegeList({
  colleges,
  selectedId,
  onSelect,
  onHover,
  selectedCollegeIds,
  onToggleCheck,
  onSelectAll,
  onDeselectAll,
}: CollegeListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to selected college
  useEffect(() => {
    if (!selectedId || !listRef.current) return;

    const element = listRef.current.querySelector(`[data-college-id="${selectedId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{colleges.length}</span> Schools
        </p>
        {onToggleCheck && colleges.length > 0 && (
          <button
            onClick={() => {
              const allSelected = colleges.every(c => selectedCollegeIds?.has(c.id));
              if (allSelected) {
                onDeselectAll?.();
              } else {
                onSelectAll?.();
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {colleges.every(c => selectedCollegeIds?.has(c.id)) ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {colleges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No colleges match your filters</p>
          </div>
        ) : (
          colleges.map(college => (
            <div key={college.id} data-college-id={college.id}>
              <CollegeCard
                college={college}
                isSelected={selectedId === college.id}
                onSelect={onSelect}
                onHover={onHover}
                distanceMiles={college.distanceMiles}
                isChecked={selectedCollegeIds?.has(college.id)}
                onToggleCheck={onToggleCheck}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
