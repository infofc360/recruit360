'use client';

interface SelectionActionBarProps {
  count: number;
  onEmail: () => void;
  onClear: () => void;
}

export default function SelectionActionBar({ count, onEmail, onClear }: SelectionActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 bg-[#111111] border-t border-[#2a2a2a] p-3 flex items-center justify-between">
      <span className="text-sm font-medium text-[#aaa]">
        {count} school{count !== 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-[#888] hover:text-white border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onEmail}
          className="px-3 py-1.5 text-sm text-black bg-[#c8f000] rounded-lg hover:bg-[#a0c000] font-medium transition-colors"
        >
          Send Email
        </button>
      </div>
    </div>
  );
}
