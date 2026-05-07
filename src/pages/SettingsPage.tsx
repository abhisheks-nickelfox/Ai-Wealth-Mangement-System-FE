import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import {
  Mail01,
  Trash01,
  Edit01,
  Plus,
  HelpCircle,
  Eye,
  EyeOff,
} from '@untitled-ui/icons-react';
import { changePasswordSchema } from '../validations/auth.validations';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import ImageCropModal from '../components/ui/ImageCropModal';
import FileUpload from '../components/ui/FileUpload';
import Checkbox from '../components/ui/Checkbox';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import SettingsRow from '../components/ui/SettingsRow';
import SlideOver from '../components/ui/SlideOver';
import { useAuth } from '../context/AuthContext';
import { profileApi, authApi } from '../lib/api';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill, useSetSkillMembers } from '../hooks/useSkills';
import { useOrgSettings, useUploadOrgLogo } from '../hooks/useOrgSettings';
import { useUsers } from '../hooks/useUsers';
import { useTaskTypes, useCreateTaskType, useUpdateTaskType, useDeleteTaskType } from '../hooks/useTaskTypes';
import type { User, Skill, TaskType } from '../lib/api';
import AddSkillsModal from '../components/users/AddSkillsModal';
import type { LocalSkill } from '../components/users/AddSkillsModal';

// ── Tab types ─────────────────────────────────────────────────────────────────

type MainTab  = 'personal' | 'organization' | 'projects';
type OrgSubTab = 'details' | 'skills';

// ── Constants ─────────────────────────────────────────────────────────────────

const TWO_FA_METHODS: { id: 'app' | 'email'; label: string }[] = [
  { id: 'app',   label: 'Authentication App' },
  { id: 'email', label: 'Email' },
];


const TAG_COLORS = [
  '#9B5CFF', '#F04438', '#A3E635', '#22C55E', '#14B8A6', '#3B82F6', '#F97316', '#FB7185',
  '#EC4899', '#1E293B', '#0F766E', '#1D4ED8', '#7C3AED', '#38BDF8', '#84CC16', '#EAB308',
];

// ── Tab bar ───────────────────────────────────────────────────────────────────

function MainTabBar({ active, onChange }: { active: MainTab; onChange: (t: MainTab) => void }) {
  const tabs: { id: MainTab; label: string }[] = [
    { id: 'personal',      label: 'Personal Info'     },
    { id: 'organization',  label: 'Organization Info' },
    { id: 'projects',      label: 'Project Settings'  },
  ];
  return (
    <div className="flex gap-1 border-b border-[#E9EAEB]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            active === t.id
              ? 'border-[#7F56D9] text-[#7F56D9]'
              : 'border-transparent text-[#535862] hover:text-[#181D27]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function OrgSubTabBar({ active, onChange }: { active: OrgSubTab; onChange: (t: OrgSubTab) => void }) {
  return (
    <div className="flex gap-2 mt-6 mb-6">
      {(['details', 'skills'] as OrgSubTab[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            active === t
              ? 'border-[#7F56D9] text-[#7F56D9] bg-white'
              : 'border-[#E9EAEB] text-[#414651] bg-white hover:border-[#9E77ED]'
          }`}
        >
          {t === 'details' ? 'Organisation details' : 'Skills'}
        </button>
      ))}
    </div>
  );
}

// ── Shared: skill/task-type panel body ───────────────────────────────────────

function SkillPanelFooter({ onClose, onSubmit, loading, submitLabel }: {
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <Button onClick={onSubmit} loading={loading} size="md">
        {submitLabel}
      </Button>
    </div>
  );
}

// ── Add Skill panel ───────────────────────────────────────────────────────────

interface AddSkillPanelProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddSkillPanel({ onClose, onCreated }: AddSkillPanelProps) {
  const createSkill    = useCreateSkill();
  const setSkillMembers = useSetSkillMembers();
  const { data: allUsers = [] } = useUsers();

  const [skillType,   setSkillType]   = useState('');
  const [description, setDescription] = useState('');
  const [color,       setColor]       = useState(TAG_COLORS[0]);
  const [memberIds,   setMemberIds]   = useState<string[]>([]);
  const [showPicker,  setShowPicker]  = useState(false);
  const [error,       setError]       = useState('');

  const isBusy = createSkill.isPending || setSkillMembers.isPending;
  const selectedMembers  = allUsers.filter((u: User) => memberIds.includes(u.id));
  const availableMembers = allUsers.filter((u: User) => !memberIds.includes(u.id));

  function toggleMember(id: string) {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleCreate() {
    const name = skillType.trim();
    if (!name) { setError('Skill type is required.'); return; }
    setError('');
    try {
      const created = await createSkill.mutateAsync({ name, description, color });
      if (memberIds.length > 0) {
        await setSkillMembers.mutateAsync({ id: created.id, user_ids: memberIds });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Add a Skill"
      subtitle="Organize work by creating and managing skills."
      width="max-w-lg"
      footer={<SkillPanelFooter onClose={onClose} onSubmit={handleCreate} loading={isBusy} submitLabel="Create" />}
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Skill Type</label>
          <Input
            value={skillType}
            onChange={(e) => { setSkillType(e.target.value); if (error) setError(''); }}
            placeholder="e.g. Website Design"
            error={error || undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            rows={5}
            className="w-full px-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9E77ED] resize-none placeholder:text-[#9DA4AE]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Select Tag Color</label>
          <ColorPicker selected={color} onChange={setColor} />
        </div>

        {skillType && (
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Preview</label>
            <TagPreview name={skillType} color={color} />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Team with Skill</label>
          <div className="flex items-center gap-2 flex-wrap">
            <MemberAvatarStack members={selectedMembers} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="w-8 h-8 rounded-full border border-[#D5D7DA] flex items-center justify-center text-[#717680] hover:bg-gray-50 transition-colors"
              >
                <Plus width={14} height={14} />
              </button>
              {showPicker && (
                <div className="absolute left-0 top-10 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg w-56 max-h-52 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="text-xs text-[#717680] px-3 py-2">All members added</p>
                  ) : (
                    availableMembers.map((u: User) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { toggleMember(u.id); setShowPicker(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#181D27] hover:bg-gray-50 transition-colors"
                      >
                        <Avatar src={u.avatar_url ?? undefined} name={u.name} size="xs" />
                        <span className="truncate">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedMembers.map((u: User) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleMember(u.id)}
                className="flex items-center gap-1 text-xs text-[#535862] bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full px-2 py-1 transition-colors"
                title={`Remove ${u.name}`}
              >
                {u.name} ×
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

// ── Edit Skill panel ──────────────────────────────────────────────────────────

interface EditSkillPanelProps {
  skill: Skill;
  onClose: () => void;
}

function EditSkillPanel({ skill, onClose }: EditSkillPanelProps) {
  const updateSkill     = useUpdateSkill();
  const setSkillMembers = useSetSkillMembers();
  const { data: allUsers = [] } = useUsers();

  const [name,        setName]        = useState(skill.name);
  const [description, setDescription] = useState(skill.description ?? '');
  const [color,       setColor]       = useState(skill.color ?? TAG_COLORS[0]);
  const [memberIds,   setMemberIds]   = useState<string[]>((skill.members ?? []).map((m) => m.id));
  const [showPicker,  setShowPicker]  = useState(false);
  const [error,       setError]       = useState('');

  const isBusy = updateSkill.isPending || setSkillMembers.isPending;
  const selectedMembers  = allUsers.filter((u: User) => memberIds.includes(u.id));
  const availableMembers = allUsers.filter((u: User) => !memberIds.includes(u.id));

  function toggleMember(id: string) {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!name.trim()) { setError('Skill name is required.'); return; }
    setError('');
    try {
      await updateSkill.mutateAsync({
        id: skill.id,
        payload: { name: name.trim(), description: description.trim() || undefined, color },
      });
      await setSkillMembers.mutateAsync({ id: skill.id, user_ids: memberIds });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Edit Skill"
      subtitle="Update the skill name, description or colour."
      width="max-w-lg"
      footer={<SkillPanelFooter onClose={onClose} onSubmit={handleSave} loading={isBusy} submitLabel="Save changes" />}
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Skill Type</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            placeholder="e.g. Website Design"
            error={error || undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this skill covers…"
            rows={5}
            className="w-full px-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9E77ED] resize-none placeholder:text-[#9DA4AE]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Select Tag Color</label>
          <ColorPicker selected={color} onChange={setColor} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Preview</label>
          <TagPreview name={name || skill.name} color={color} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Team with Skill</label>
          <div className="flex items-center gap-2 flex-wrap">
            <MemberAvatarStack members={selectedMembers} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="w-8 h-8 rounded-full border border-[#D5D7DA] flex items-center justify-center text-[#717680] hover:bg-gray-50 transition-colors"
              >
                <Plus width={14} height={14} />
              </button>
              {showPicker && (
                <div className="absolute left-0 top-10 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg w-56 max-h-52 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="text-xs text-[#717680] px-3 py-2">All members added</p>
                  ) : (
                    availableMembers.map((u: User) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { toggleMember(u.id); setShowPicker(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#181D27] hover:bg-gray-50 transition-colors"
                      >
                        <Avatar src={u.avatar_url ?? undefined} name={u.name} size="xs" />
                        <span className="truncate">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedMembers.map((u: User) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleMember(u.id)}
                className="flex items-center gap-1 text-xs text-[#535862] bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full px-2 py-1 transition-colors"
                title={`Remove ${u.name}`}
              >
                {u.name} ×
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

// ── Shared: color picker ──────────────────────────────────────────────────────

function ColorPicker({ selected, onChange }: { selected: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${
            selected === c ? 'ring-2 ring-offset-2 ring-[#7F56D9] scale-110' : 'hover:scale-105'
          }`}
          style={{ backgroundColor: c }}
          aria-label={`Select color ${c}`}
        />
      ))}
    </div>
  );
}

// ── Shared: tag badge preview ─────────────────────────────────────────────────

function TagPreview({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color + '22', color }}
    >
      {name}
    </span>
  );
}

// ── Shared: member avatar stack ───────────────────────────────────────────────

function MemberAvatarStack({ members, max = 5 }: { members: { id: string; name: string; avatar_url: string | null }[]; max?: number }) {
  const visible = members.slice(0, max);
  const extra   = members.length - visible.length;
  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {visible.length > 0
          ? visible.map((m) => (
              <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shrink-0">
                <Avatar src={m.avatar_url ?? undefined} name={m.name} size="xs" />
              </div>
            ))
          : [0, 1, 2].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 shrink-0" />
            ))
        }
      </div>
      {extra > 0 && <span className="text-xs text-[#535862] ml-1">+{extra}</span>}
    </div>
  );
}

// ── Shared: pagination ────────────────────────────────────────────────────────

function pageNumbers(_page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const arr: (number | '...')[] = [1, 2, 3, '...'];
  for (let i = Math.max(4, totalPages - 2); i <= totalPages; i++) arr.push(i);
  return arr;
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#E9EAEB]">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#414651] border border-[#D5D7DA] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        ← Previous
      </button>
      <div className="flex items-center gap-1">
        {pageNumbers(page, totalPages).map((n, i) =>
          n === '...' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-[#717680]">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === n ? 'bg-[#F9F5FF] text-[#7F56D9]' : 'text-[#535862] hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#414651] border border-[#D5D7DA] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

// ── Task Type Management ──────────────────────────────────────────────────────

const TASK_TYPES_PER_PAGE = 6;

interface TaskTypePanelProps {
  taskType?: TaskType;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function TaskTypePanel({ taskType, open, onClose, onSaved }: TaskTypePanelProps) {
  const isEdit = !!taskType;
  const createTaskType = useCreateTaskType();
  const updateTaskType = useUpdateTaskType();
  const { data: allUsers = [] } = useUsers();

  const [name,        setName]        = useState(taskType?.name ?? '');
  const [description, setDescription] = useState(taskType?.description ?? '');
  const [color,       setColor]       = useState(taskType?.color ?? TAG_COLORS[0]);
  const [memberIds,   setMemberIds]   = useState<string[]>(taskType?.members.map((m) => m.id) ?? []);
  const [showPicker,  setShowPicker]  = useState(false);
  const [error,       setError]       = useState('');

  const isBusy = createTaskType.isPending || updateTaskType.isPending;

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Task type name is required.'); return; }
    setError('');
    try {
      if (isEdit) {
        await updateTaskType.mutateAsync({
          id: taskType.id,
          payload: { name: trimmed, description: description.trim() || undefined, color, member_ids: memberIds },
        });
      } else {
        await createTaskType.mutateAsync({
          name: trimmed,
          description: description.trim() || undefined,
          color,
          member_ids: memberIds,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const selectedMembers = allUsers.filter((u: User) => memberIds.includes(u.id));
  const availableMembers = allUsers.filter((u: User) => !memberIds.includes(u.id));

  function toggleMember(id: string) {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Task Type' : 'Create A Task Type'}
      subtitle={isEdit ? 'Update the task type name, description or colour.' : 'Redesign of untitledui.com'}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} loading={isBusy} size="md">
            {isEdit ? 'Save changes' : 'Create'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Task Type Name</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            placeholder="e.g. Website Design"
            error={error || undefined}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            rows={5}
            className="w-full px-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9E77ED] resize-none placeholder:text-[#9DA4AE]"
          />
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Select Tag Color</label>
          <ColorPicker selected={color} onChange={setColor} />
        </div>

        {/* Preview */}
        {name && (
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Preview</label>
            <TagPreview name={name} color={color} />
          </div>
        )}

        {/* Default Team */}
        <div>
          <label className="block text-sm font-medium text-[#414651] mb-3">Default Team</label>
          <div className="flex items-center gap-2 flex-wrap">
            <MemberAvatarStack members={selectedMembers} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="w-8 h-8 rounded-full border border-[#D5D7DA] flex items-center justify-center text-[#717680] hover:bg-gray-50 transition-colors"
              >
                <Plus width={14} height={14} />
              </button>
              {showPicker && (
                <div className="absolute left-0 top-10 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg w-56 max-h-52 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="text-xs text-[#717680] px-3 py-2">All members added</p>
                  ) : (
                    availableMembers.map((u: User) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { toggleMember(u.id); setShowPicker(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#181D27] hover:bg-gray-50 transition-colors"
                      >
                        <Avatar src={u.avatar_url ?? undefined} name={u.name} size="xs" />
                        <span className="truncate">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedMembers.map((u: User) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleMember(u.id)}
                className="flex items-center gap-1 text-xs text-[#535862] bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full px-2 py-1 transition-colors"
                title={`Remove ${u.name}`}
              >
                {u.name} ×
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

function TaskTypeManagement() {
  const { data: taskTypes = [], isLoading, refetch } = useTaskTypes();
  const deleteTaskType = useDeleteTaskType();

  const [panelOpen,     setPanelOpen]     = useState(false);
  const [editingType,   setEditingType]   = useState<TaskType | null>(null);
  const [page,          setPage]          = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(taskTypes.length / TASK_TYPES_PER_PAGE));
  const paginated  = taskTypes.slice((page - 1) * TASK_TYPES_PER_PAGE, page * TASK_TYPES_PER_PAGE);

  function openCreate() { setEditingType(null); setPanelOpen(true); }
  function openEdit(tt: TaskType) { setEditingType(tt); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEditingType(null); }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    await deleteTaskType.mutateAsync(pendingDelete.id).catch(() => {});
    setPendingDelete(null);
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#181D27]">Task Type Management</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7F56D9] text-white text-sm font-semibold hover:bg-[#6941C6] transition-colors"
        >
          <Plus width={16} height={16} />
          Create A Task Type
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#E9EAEB] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[200px_1fr_180px_160px_72px] items-center px-4 py-3 bg-gray-50 border-b border-[#E9EAEB]">
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">Task Type</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#535862] uppercase tracking-wider">
            Description <HelpCircle width={14} height={14} className="text-[#9DA4AE]" />
          </span>
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">Default Team</span>
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">Usage</span>
          <span />
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-sm text-[#717680] text-center">Loading…</div>
        ) : taskTypes.length === 0 ? (
          <div className="px-4 py-8 text-sm text-[#717680] text-center">
            No task types yet. Click "Create A Task Type" to get started.
          </div>
        ) : (
          paginated.map((tt) => {
            const color = tt.color ?? TAG_COLORS[0];
            return (
              <div
                key={tt.id}
                className="grid grid-cols-[200px_1fr_180px_160px_72px] items-center px-4 py-4 border-b border-[#E9EAEB] last:border-b-0 bg-white hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <TagPreview name={tt.name} color={color} />
                </div>
                <p className="text-sm text-[#535862] pr-4 line-clamp-1">
                  {tt.description || 'No description available.'}
                </p>
                <MemberAvatarStack members={tt.members} max={3} />
                <span className="text-sm font-semibold text-[#6941C6]">
                  {String(tt.task_count).padStart(2, '0')} Tasks
                </span>
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => setPendingDelete({ id: tt.id, name: tt.name })}
                    disabled={deleteTaskType.isPending}
                    className="p-1.5 rounded-lg text-[#717680] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`Delete ${tt.name}`}
                  >
                    <Trash01 width={16} height={16} />
                  </button>
                  <button
                    onClick={() => openEdit(tt)}
                    className="p-1.5 rounded-lg text-[#717680] hover:text-[#7F56D9] hover:bg-[#F9F5FF] transition-colors"
                    aria-label={`Edit ${tt.name}`}
                  >
                    <Edit01 width={16} height={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {/* Add / Edit panel — key forces remount so useState initialises fresh */}
      <TaskTypePanel
        key={editingType?.id ?? 'new'}
        open={panelOpen}
        taskType={editingType ?? undefined}
        onClose={closePanel}
        onSaved={() => { refetch(); if (!editingType) setPage(1); }}
      />

      {/* Delete confirmation */}
      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete task type?"
        description={
          <>
            <span className="font-medium text-[#181D27]">{pendingDelete?.name}</span>
            {' '}will be removed. Existing tickets linked to this type will have their type cleared. This action cannot be undone.
          </>
        }
        deleting={deleteTaskType.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// ── Skill Management table ────────────────────────────────────────────────────

const SKILLS_PER_PAGE = 6;

function SkillManagement() {
  const { data: skills = [], isLoading, refetch } = useSkills();
  const deleteSkill = useDeleteSkill();
  const [showAdd,          setShowAdd]          = useState(false);
  const [editingSkill,     setEditingSkill]     = useState<Skill | null>(null);
  const [page,             setPage]             = useState(1);
  const [pendingDelete,    setPendingDelete]    = useState<{ id: string; name: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(skills.length / SKILLS_PER_PAGE));
  const paginated  = skills.slice((page - 1) * SKILLS_PER_PAGE, page * SKILLS_PER_PAGE);

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    await deleteSkill.mutateAsync(pendingDelete.id).catch(() => {});
    setPendingDelete(null);
  }

  return (
    <div className="relative">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#181D27]">Skill Management</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7F56D9] text-white text-sm font-semibold hover:bg-[#6941C6] transition-colors"
        >
          <Plus width={16} height={16} />
          Add a skill
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#E9EAEB] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[200px_1fr_180px_160px_72px] items-center px-4 py-3 bg-gray-50 border-b border-[#E9EAEB]">
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">Skill Type</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#535862] uppercase tracking-wider">
            Description <HelpCircle width={14} height={14} className="text-[#9DA4AE]" />
          </span>
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">Members with Skill</span>
          <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">On going usage</span>
          <span />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-sm text-[#717680] text-center">Loading…</div>
        ) : skills.length === 0 ? (
          <div className="px-4 py-8 text-sm text-[#717680] text-center">
            No skills yet. Click "Add a skill" to get started.
          </div>
        ) : (
          paginated.map((skill: Skill) => {
            const color = skill.color ?? TAG_COLORS[0];
            return (
              <div
                key={skill.id}
                className="grid grid-cols-[200px_1fr_180px_160px_72px] items-center px-4 py-4 border-b border-[#E9EAEB] last:border-b-0 bg-white hover:bg-gray-50/50 transition-colors"
              >
                {/* Skill badge */}
                <div>
                  <TagPreview name={skill.name} color={color} />
                </div>

                {/* Description */}
                <p className="text-sm text-[#535862] pr-4 line-clamp-1">
                  {skill.description || 'No description available.'}
                </p>

                {/* Members with skill */}
                <div>
                  <MemberAvatarStack members={skill.members ?? []} max={3} />
                </div>

                {/* On going usage */}
                <span className="text-sm font-semibold text-[#6941C6]">
                  — Tasks
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => setPendingDelete({ id: skill.id, name: skill.name })}
                    disabled={deleteSkill.isPending}
                    className="p-1.5 rounded-lg text-[#717680] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`Delete ${skill.name}`}
                  >
                    <Trash01 width={16} height={16} />
                  </button>
                  <button
                    onClick={() => setEditingSkill(skill)}
                    className="p-1.5 rounded-lg text-[#717680] hover:text-[#7F56D9] hover:bg-[#F9F5FF] transition-colors"
                    aria-label={`Edit ${skill.name}`}
                  >
                    <Edit01 width={16} height={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {/* Add skill drawer */}
      {showAdd && (
        <AddSkillPanel
          onClose={() => setShowAdd(false)}
          onCreated={() => { refetch(); setPage(1); }}
        />
      )}

      {/* Edit skill drawer */}
      {editingSkill && (
        <EditSkillPanel
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
        />
      )}

      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete skill?"
        description={
          <>
            <span className="font-medium text-[#181D27]">{pendingDelete?.name}</span>
            {' '}will be removed from the catalog and unassigned from all team members. This action cannot be undone.
          </>
        }
        deleting={deleteSkill.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user: authUser, refreshUser } = useAuth();

  const [mainTab,    setMainTab]    = useState<MainTab>('personal');
  const [orgSubTab,  setOrgSubTab]  = useState<OrgSubTab>('skills');
  const [profile,    setProfile]    = useState<User | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [showToast,  setShowToast]  = useState(false);
  const [toastMsg,   setToastMsg]   = useState('');
  const [toastType,  setToastType]  = useState<'success' | 'error'>('success');

  function notify(msg: string, type: 'success' | 'error' = 'success') {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  }
  const { data: allSkills = [] } = useSkills();

  // Personal form state
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [selectedSkills, setSelectedSkills] = useState<LocalSkill[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editExp,        setEditExp]        = useState('');
  const [showAddSkillsModal, setShowAddSkillsModal] = useState(false);

  // Avatar
  const [cropSrc,         setCropSrc]         = useState<string | null>(null);
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Org logo
  const { data: orgSettings } = useOrgSettings();
  const uploadOrgLogo = useUploadOrgLogo();
  const [orgLogoCropSrc,    setOrgLogoCropSrc]    = useState<string | null>(null);
  const [orgLogoUrl,        setOrgLogoUrl]        = useState<string | null>(null);
  const [uploadingOrgLogo,  setUploadingOrgLogo]  = useState(false);

  // 2FA
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email' | null>(null);

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPwd,     setShowCurrentPwd]     = useState(false);
  const [showNewPwd,         setShowNewPwd]         = useState(false);
  const [showConfirmPwd,     setShowConfirmPwd]     = useState(false);


  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authUser) return;
    setProfile(authUser as User);
    setFirstName(authUser.first_name ?? authUser.name.split(' ')[0] ?? '');
    setLastName(authUser.last_name ?? authUser.name.split(' ').slice(1).join(' ') ?? '');
    setAvatarUrl(authUser.avatar_url ?? null);
    setSelectedSkills(
      (authUser.skills ?? []).map((s: Skill) => ({
        id:         s.id,
        name:       s.name,
        experience: (s as Skill & { experience?: string | null }).experience ?? null,
      })),
    );
    setLoading(false);
  }, [authUser]);

  // ── Sync org logo from query data (initial load only) ───────────────────────

  useEffect(() => {
    if (orgSettings?.logo_url && !orgLogoUrl) {
      setOrgLogoUrl(orgSettings.logo_url);
    }
  }, [orgSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Org logo handlers ────────────────────────────────────────────────────────

  function handleOrgLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadingOrgLogo(true);
      try {
        const result = await uploadOrgLogo.mutateAsync(dataUrl);
        setOrgLogoUrl(result.logo_url);
        notify('Logo updated successfully');
      } catch (err) {
        notify((err as Error).message, 'error');
      } finally {
        setUploadingOrgLogo(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleOrgLogoCropComplete(dataUrl: string) {
    setOrgLogoCropSrc(null);
    setUploadingOrgLogo(true);
    try {
      const result = await uploadOrgLogo.mutateAsync(dataUrl);
      setOrgLogoUrl(result.logo_url);
      notify('Logo updated successfully');
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setUploadingOrgLogo(false);
    }
  }

  // ── Avatar ───────────────────────────────────────────────────────────────────

  function handleAvatarFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropComplete(dataUrl: string) {
    setCropSrc(null);
    if (!authUser) return;
    setUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(authUser.id, dataUrl);
      setAvatarUrl(dataUrl);
      refreshUser().catch(() => {});
    } catch (err) {
      console.error('[SettingsPage] avatar save failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Save personal info ────────────────────────────────────────────────────────

  async function handleSave() {
    if (!authUser) return;
    const invalidExp = selectedSkills.filter((s) => {
      if (!s.experience) return false;
      const n = Number(s.experience);
      return isNaN(n) || n < 1 || n > 50;
    });
    if (invalidExp.length > 0) {
      notify('Invalid experience — must be a number between 1 and 50.', 'error');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updated = await profileApi.update(authUser.id, {
        name:       fullName,
        first_name: firstName.trim() || undefined,
        last_name:  lastName.trim()  || undefined,
        skills_with_experience: selectedSkills.map((s) => ({
          skill_id:   s.id,
          experience: s.experience,
        })),
      });
      setProfile(updated);
      notify('Profile updated successfully');
      refreshUser().catch(() => {});
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function removeSkill(id: string) {
    setSelectedSkills((prev) => prev.filter((s) => s.id !== id));
    if (editingSkillId === id) setEditingSkillId(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-[#717680]">Loading…</p>
      </main>
    );
  }

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.name
    : authUser?.name ?? '';

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white">

      {/* Page header + tabs */}
      <div className="px-8 pt-8 pb-0 border-b border-[#E9EAEB]">
        <h1 className="text-2xl font-semibold text-[#181D27] mb-1">Settings</h1>
        <p className="text-sm text-[#535862] mb-5">
          Manage your profile and organisation settings here.
        </p>
        <MainTabBar active={mainTab} onChange={setMainTab} />
      </div>

      {/* ── Personal Info ──────────────────────────────────────────────────────── */}
      {mainTab === 'personal' && (
        <div className="px-16 pt-6 pb-6">

          {/* Section header with Change Password button */}
          <div className="flex items-start justify-between py-3 border-b border-[#E9EAEB]">
            <div>
              <h3 className="text-sm font-semibold text-[#181D27]">Personal info</h3>
              <p className="text-sm text-[#535862] mt-0.5">Update your photo and personal details here.</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors shrink-0"
            >
              Change Password
            </button>
          </div>

          {/* Name */}
          <SettingsRow label="Name" required>
            <div className="flex gap-6 w-full">
              <div className="flex-1"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" /></div>
              <div className="flex-1"><Input value={lastName}  onChange={(e) => setLastName(e.target.value)}  placeholder="Last name"  /></div>
            </div>
          </SettingsRow>

          {/* Email */}
          <SettingsRow label="Email address" sub="This is your current email address." required>
            <Input
              value={profile?.email ?? authUser?.email ?? ''}
              readOnly
              leftIcon={<Mail01 width={16} height={16} />}
              className="bg-gray-50 text-[#717680] cursor-not-allowed"
            />
          </SettingsRow>

          {/* Photo */}
          <SettingsRow label="Your photo" sub="This will be displayed on your profile." required helpText="SVG, PNG, JPG or GIF (max. 2MB)">
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <Avatar src={avatarUrl ?? undefined} name={displayName} size="lg" className="w-16 h-16" />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <FileUpload accept="image/png,image/jpeg,image/gif,image/webp" maxSizeMB={2} onFile={handleAvatarFile} />
              </div>
            </div>
          </SettingsRow>

          {/* Role */}
          <SettingsRow label="Role" sub="Your access level in the platform.">
            <div className="flex items-center px-3 py-2.5 border border-[#D5D7DA] rounded-lg bg-gray-50">
              <span className="text-sm text-[#414651] capitalize">
                {(profile?.role ?? authUser?.role ?? '').replace(/_/g, ' ')}
              </span>
            </div>
          </SettingsRow>

          {/* 2FA */}
          <SettingsRow label="Two-factor authentication" sub="Keep your account secure by enabling 2FA via email or authenticator app." wideContent>
            <div className="border border-[#E9EAEB] rounded-xl overflow-hidden max-w-[720px]">
              <div className="flex">
                {/* Left stepper */}
                <div className="w-44 shrink-0 px-5 py-6 flex flex-col justify-center gap-5">
                  {/* Step 1 — active */}
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-[#7F56D9] shadow-[0_0_0_2px_white,0_0_0_4px_#9E77ED] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <p className="text-sm font-semibold text-[#6941C6]">Choose method</p>
                  </div>
                  {/* Step 2 — inactive */}
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-white border-[1.5px] border-[#E9EAEB] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#D5D7DA]" />
                    </div>
                    <p className="text-sm font-semibold text-[#414651]">Verify code</p>
                  </div>
                </div>

                {/* Right method selection */}
                <div className="flex-1 px-6 py-6">
                  <p className="text-base font-semibold text-[#181D27] mb-4">Choose an authentication method</p>
                  <div className="flex flex-col gap-2">
                    {TWO_FA_METHODS.map((m) => {
                      const checked = twoFAMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setTwoFAMethod(checked ? null : m.id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            checked ? 'border-[#D5D7DA] bg-white' : 'border-[#D5D7DA] bg-white hover:border-[#9E77ED]'
                          }`}
                        >
                          <Checkbox checked={checked} onChange={() => setTwoFAMethod(checked ? null : m.id)} />
                          <span className="text-base text-[#181D27]">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4"><Button size="md">Next</Button></div>
                </div>
              </div>
            </div>
          </SettingsRow>

          {/* Skills */}
          <SettingsRow label="Skills" sub="Add skills to help your team understand your expertise.">
            <div className="flex flex-col gap-3">
              {/* Skill cards */}
              {selectedSkills.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedSkills.map(({ id, name, experience }) => (
                    <div key={id} className="flex items-start gap-3 px-4 py-3 bg-white border border-[#E9EAEB] rounded-xl drop-shadow-[0px_1px_1px_rgba(10,13,18,0.05)]">
                      <div className="min-w-0 flex-1">
                        {editingSkillId === id ? (
                          <>
                            <p className="text-base font-semibold text-[#414651]">{name}</p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={editExp}
                                  onChange={(e) => setEditExp(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                  placeholder="Years (1–50)"
                                  autoFocus
                                  className={`text-xs border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#9E77ED] w-28 ${
                                    editExp && Number(editExp) > 50 ? 'border-red-400 text-red-600' : 'border-[#D5D7DA]'
                                  }`}
                                />
                                <button
                                  onClick={() => {
                                    const n = Number(editExp);
                                    if (!editExp || isNaN(n) || n < 1 || n > 50) return;
                                    setSelectedSkills((prev) =>
                                      prev.map((s) => s.id === id ? { ...s, experience: editExp } : s),
                                    );
                                    setEditingSkillId(null);
                                  }}
                                  className="text-xs text-[#7F56D9] font-medium hover:underline"
                                >
                                  Save
                                </button>
                                <button onClick={() => setEditingSkillId(null)} className="text-xs text-[#717680] hover:underline">
                                  Cancel
                                </button>
                              </div>
                              {editExp && Number(editExp) > 50 && (
                                <p className="text-[10px] text-red-500">Invalid, max 50 years</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-semibold text-[#414651] whitespace-nowrap">{name}</p>
                            <p className="text-sm text-[#535862] whitespace-nowrap">
                              {experience ? `${experience} yr${Number(experience) === 1 ? '' : 's'} experience` : 'Add experience'}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => { setEditingSkillId(id); setEditExp(experience ?? ''); }}
                          className="p-1.5 rounded hover:bg-gray-100 text-[#717680] transition-colors"
                        >
                          <Edit01 width={14} height={14} />
                        </button>
                        <button
                          onClick={() => removeSkill(id)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#717680] hover:text-red-600 transition-colors"
                        >
                          <Trash01 width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add more skills button → opens modal */}
              <button
                type="button"
                onClick={() => setShowAddSkillsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-fit"
              >
                <Plus width={16} height={16} />
                Add more skills
              </button>
            </div>
          </SettingsRow>

          {/* Save / Cancel */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              onClick={() => {
                if (!profile) return;
                setFirstName(profile.first_name ?? profile.name.split(' ')[0] ?? '');
                setLastName(profile.last_name ?? profile.name.split(' ').slice(1).join(' ') ?? '');
                setSelectedSkills(
                  (profile.skills ?? []).map((s: Skill) => ({
                    id:         s.id,
                    name:       s.name,
                    experience: (s as Skill & { experience?: string | null }).experience ?? null,
                  })),
                );
                setEditingSkillId(null);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button onClick={handleSave} loading={saving} size="md">Save changes</Button>
          </div>

        </div>
      )}

      {/* ── Add Skills Modal ─────────────────────────────────────────────────── */}
      {showAddSkillsModal && (
        <AddSkillsModal
          skillCatalog={allSkills}
          initialSkills={selectedSkills}
          onClose={() => setShowAddSkillsModal(false)}
          onSave={(skills) => {
            setSelectedSkills(skills);
            setShowAddSkillsModal(false);
          }}
        />
      )}

      {/* ── Change Password Slide-Over ─────────────────────────────────────────── */}
      {showChangePassword && (
        <Formik
          initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          validationSchema={changePasswordSchema}
          onSubmit={async (values, { setFieldError, setSubmitting, resetForm }) => {
            try {
              await authApi.changePassword(values.currentPassword, values.newPassword);
              setShowChangePassword(false);
              resetForm();
              notify('Password changed successfully');
            } catch (err) {
              setFieldError('currentPassword', (err as Error).message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, submitForm }) => (
            <SlideOver
              open
              onClose={() => setShowChangePassword(false)}
              title="Change Password"
              subtitle="Choose a new password for your account."
              width="max-w-md"
              footer={
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button onClick={() => submitForm()} loading={isSubmitting} size="md">
                    Update password
                  </Button>
                </div>
              }
            >
              <Form className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#414651] mb-1.5">Current password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPwd ? 'text' : 'password'}
                      name="currentPassword"
                      placeholder="Enter current password"
                      value={values.currentPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.currentPassword && errors.currentPassword ? errors.currentPassword : undefined}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] hover:text-[#414651] transition-colors">
                      {showCurrentPwd ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#414651] mb-1.5">New password</label>
                  <div className="relative">
                    <Input
                      type={showNewPwd ? 'text' : 'password'}
                      name="newPassword"
                      placeholder="Min. 8 characters"
                      value={values.newPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.newPassword && errors.newPassword ? errors.newPassword : undefined}
                    />
                    <button type="button" onClick={() => setShowNewPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] hover:text-[#414651] transition-colors">
                      {showNewPwd ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#414651] mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPwd ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                    />
                    <button type="button" onClick={() => setShowConfirmPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] hover:text-[#414651] transition-colors">
                      {showConfirmPwd ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                    </button>
                  </div>
                </div>
              </Form>
            </SlideOver>
          )}
        </Formik>
      )}

      {/* ── Organization Info ─────────────────────────────────────────────────── */}
      {mainTab === 'organization' && (
        <div className="px-8 pb-6">
          <div className="py-5 border-b border-[#E9EAEB]">
            <h2 className="text-lg font-semibold text-[#181D27]">Organisation info</h2>
            <p className="text-sm text-[#535862] mt-0.5">Update your organisation details here.</p>
          </div>

          <OrgSubTabBar active={orgSubTab} onChange={setOrgSubTab} />

          {orgSubTab === 'details' && (
            <div className="py-5 border-b border-[#E9EAEB]">
              {/* Label row */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-[#181D27]">Upload logo</span>
                <span className="text-red-500 text-sm">*</span>
                <HelpCircle width={14} height={14} className="text-[#9DA4AE]" />
              </div>
              <p className="text-sm text-[#535862] mb-4">This will be displayed on your profile.</p>

              <div className="flex items-start gap-5 max-w-lg">
                {/* Current logo preview */}
                {orgLogoUrl && (
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="w-16 h-16 rounded-xl border border-[#E9EAEB] bg-white overflow-hidden flex items-center justify-center">
                      <img
                        src={orgLogoUrl}
                        alt="Organisation logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {uploadingOrgLogo && (
                      <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
                {/* Upload zone */}
                <div className="flex-1">
                  <FileUpload
                    accept="image/svg+xml,image/png,image/jpeg,image/gif"
                    maxSizeMB={0.8}
                    onFile={handleOrgLogoFile}
                  />
                </div>
              </div>
            </div>
          )}

          {orgSubTab === 'skills' && <SkillManagement />}
        </div>
      )}

      {/* ── Project Settings ──────────────────────────────────────────────────── */}
      {mainTab === 'projects' && (
        <div className="px-8 pb-6">
          <div className="py-5 border-b border-[#E9EAEB]">
            <h2 className="text-lg font-semibold text-[#181D27]">Project settings</h2>
            <p className="text-sm text-[#535862] mt-0.5">Update your project and task settings here.</p>
          </div>

          {/* Sub-tab — same pill style as OrgSubTabBar */}
          <div className="flex gap-2 mt-6 mb-6">
            <button className="px-4 py-2 text-sm font-medium rounded-lg border border-[#7F56D9] text-[#7F56D9] bg-white">
              Task types
            </button>
          </div>

          <TaskTypeManagement />
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <Toast message={toastMsg} type={toastType} onClose={() => setShowToast(false)} />
      )}

      {/* Avatar crop modal */}
      {cropSrc && (
        <ImageCropModal src={cropSrc} onSave={handleCropComplete} onCancel={() => setCropSrc(null)} />
      )}

      {/* Org logo crop modal */}
      {orgLogoCropSrc && (
        <ImageCropModal src={orgLogoCropSrc} onSave={handleOrgLogoCropComplete} onCancel={() => setOrgLogoCropSrc(null)} transparent />
      )}
    </main>
  );
}
