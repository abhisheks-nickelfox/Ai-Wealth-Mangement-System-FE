import { CheckIcon } from './icons';

interface StatusCircleProps {
  read: boolean;
  cleared?: boolean;
}

export default function StatusCircle({ read, cleared }: StatusCircleProps) {
  if (cleared) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#12B76A] flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>
    );
  }
  if (!read) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#2E90FA] flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border-2 border-[#D0D5DD] shrink-0" />
  );
}
