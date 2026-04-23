import type { UserStatus } from '../../types';
import { CheckCircle } from '@untitled-ui/icons-react';
import arrowRight from '../../assets/arrow-right.png';

interface StatusBadgeProps {
  status: UserStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1 bg-[#ECFDF3] border border-[#ABEFC6] text-[#067647] text-xs font-medium px-2 py-0.5 rounded-full">
        Active
        <CheckCircle className="w-3 h-3" aria-hidden="true" />
        <img src={arrowRight} alt="" className="w-3 h-3 object-contain" aria-hidden="true" />
      </span>
    );
  }
  if (status === 'invited') {
    return (
      <span className="bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708] text-xs font-medium px-2 py-0.5 rounded-full">
        invited
      </span>
    );
  }
  return (
    <span className="bg-[#FAFAFA] border border-[#E9EAEB] text-[#414651] text-xs font-medium px-1.5 py-0.5 rounded-md">
      Disabled
    </span>
  );
}
