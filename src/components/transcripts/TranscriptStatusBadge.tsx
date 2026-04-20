import type { Transcript } from '../../lib/api';

export default function TranscriptStatusBadge({ transcript }: { transcript: Transcript }) {
  if (transcript.archived) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F5F5] text-[#757575] border border-[#BDBDBD]">
        Archived
      </span>
    );
  }
  if (transcript.source === 'fireflies' || transcript.source === 'api') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E3F2FD] text-[#1565C0] border border-[#64B5F6]">
        API
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D]">
      To Process
    </span>
  );
}
