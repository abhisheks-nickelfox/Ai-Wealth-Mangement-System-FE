import { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from '@untitled-ui/icons-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function buildPageNumbers(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (page >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', page - 1, page, page + 1, '...', total];
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-4 border-t border-[#E9EAEB]">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1.5 bg-white border border-[#E9EAEB] text-sm font-semibold text-[#414651] px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 disabled:text-[#A4A7AE] disabled:cursor-not-allowed transition-colors"
      >
        <ArrowLeft width={18} height={18} />
        Previous
      </button>

      <div className="flex items-center gap-0.5">
        {pageNumbers.map((page, i) => (
          <button
            key={typeof page === 'number' ? page : `ellipsis-${i}`}
            onClick={() => typeof page === 'number' && onChange(page)}
            disabled={page === '...'}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors
              ${page === currentPage
                ? 'bg-[#FAFAFA] text-[#414651]'
                : page === '...'
                ? 'text-[#717680] cursor-default'
                : 'text-[#717680] hover:bg-gray-50'}
            `}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-1.5 bg-white border border-[#D5D7DA] text-sm font-semibold text-[#414651] px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 disabled:text-[#A4A7AE] disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ArrowRight width={18} height={18} />
      </button>
    </div>
  );
}
