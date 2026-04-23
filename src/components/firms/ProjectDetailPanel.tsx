import { useState, useEffect } from 'react';
import { Link01, Copy01, HelpCircle, ChevronDown, Plus } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import type { User } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  memberIds: string[];
  firmName: string;
  firmAbbr: string;
}

type ProjectStatus = 'In progress' | 'To Do' | 'In Review' | 'Approved' | 'Completed';

interface ProjectDetailPanelProps {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail | null;
  users: User[];
  onSave?: (updated: ProjectDetail) => Promise<void>;
  onViewTask?: (projectId: string) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = [
  'To Do',
  'In progress',
  'In Review',
  'Approved',
  'Completed',
];

const STATUS_DOT: Record<ProjectStatus, string> = {
  'To Do':       'bg-[#A4A7AE]',
  'In progress': 'bg-[#17B26A]',
  'In Review':   'bg-[#F79009]',
  'Approved':    'bg-[#6941C6]',
  'Completed':   'bg-[#181D27]',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPanel({
  open,
  onClose,
  project,
  users,
  onSave,
  onViewTask,
}: ProjectDetailPanelProps) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [status,      setStatus]      = useState<ProjectStatus>('In progress');
  const [memberIds,   setMemberIds]   = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [showStatus,  setShowStatus]  = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);

  // Sync form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setStatus(project.status);
      setMemberIds(project.memberIds);
    }
  }, [project]);

  if (!project) return null;

  const shareLink = `${project.firmAbbr}.com/project/marketing-site`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = (id: string) =>
    setMemberIds((prev) => prev.filter((m) => m !== id));

  const addMember = (id: string) => {
    if (!memberIds.includes(id)) setMemberIds((prev) => [...prev, id]);
    setShowPicker(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({ ...project, name, description, status, memberIds });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const members      = users.filter((u) => memberIds.includes(u.id));
  const nonMembers   = users.filter((u) => !memberIds.includes(u.id));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${project.name} · ${project.firmAbbr}`}
      subtitle={`Redesign of ${project.firmAbbr}`}
      width="max-w-[420px]"
    >
      <div className="flex flex-col gap-5">

        {/* Share project */}
        <div>
          <p className="text-sm font-medium text-[#344054] mb-2">Share project</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[#717680] min-w-0">
              <Link01 width={14} height={14} className="shrink-0 text-[#A4A7AE]" />
              <span className="truncate text-[13px]">{shareLink}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D5D7DA] rounded-lg text-[13px] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors shrink-0"
            >
              <Copy01 width={13} height={13} />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

          {/* Name of project */}
          <Input
            label="Name of project"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-1.5 flex items-center gap-1">
              Description
              <HelpCircle width={13} height={13} className="text-[#A4A7AE]" />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A little about the company and the team that you'll be working with."
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
            />
          </div>

          {/* Project status */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-1.5">Project status</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStatus((v) => !v)}
                className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                <span className="flex-1 text-left">{status}</span>
                <ChevronDown width={15} height={15} className="text-[#717680] shrink-0" />
              </button>
              {showStatus && (
                <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setStatus(opt); setShowStatus(false); }}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                        status === opt ? 'text-[#6941C6] font-medium' : 'text-[#344054]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[opt]}`} />
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team members */}
          <div>
            <p className="text-sm font-semibold text-[#181D27] mb-0.5">Team members</p>
            <p className="text-xs text-[#717680] mb-3">The following are working on this project.</p>

            <div className="flex flex-col gap-3">
              {members.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar
                    name={user.name}
                    src={user.avatar_url ?? undefined}
                    size="sm"
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181D27] truncate">{user.name}</p>
                    <p className="text-xs text-[#717680] truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(user.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 shrink-0 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add team member */}
            <div className="relative mt-4">
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-[#344054] font-medium hover:text-[#181D27] transition-colors"
              >
                <span className="w-6 h-6 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors">
                  <Plus width={11} height={11} />
                </span>
                Add team member
              </button>

              {showPicker && nonMembers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 w-60 max-h-48 overflow-y-auto">
                  {nonMembers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addMember(u.id)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
                    >
                      <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" className="shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-[#344054] font-medium truncate">{u.name}</p>
                        <p className="text-xs text-[#717680] truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold text-[#344054] hover:text-[#181D27] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onViewTask?.(project.id)}
              className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-sm font-semibold transition-colors"
            >
              View Task
            </button>
          </div>
        </div>

      </div>
    </SlideOver>
  );
}
