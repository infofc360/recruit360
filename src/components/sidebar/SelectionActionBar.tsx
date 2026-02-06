'use client';

interface SelectionActionBarProps {
  count: number;
  onEmail: () => void;
  onClear: () => void;
}

export default function SelectionActionBar({ count, onEmail, onClear }: SelectionActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between shadow-lg">
      <span className="text-sm font-medium text-gray-700">
        {count} school{count !== 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={onEmail}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Send Email
        </button>
      </div>
    </div>
  );
}
