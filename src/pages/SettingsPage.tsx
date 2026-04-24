import { useState, useEffect } from 'react';
import {
  Mail01,
  Trash01,
  Edit01,
  Plus,
  X,
  HelpCircle,
} from '@untitled-ui/icons-react';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import ImageCropModal from '../components/ui/ImageCropModal';
import FileUpload from '../components/ui/FileUpload';
import Checkbox from '../components/ui/Checkbox';
import { useAuth } from '../context/AuthContext';
import { skillsApi, profileApi } from '../lib/api';
import { useSkills, useCreateSkill, useDeleteSkill } from '../hooks/useSkills';
import type { User, Skill } from '../lib/api';

// ── Tab types ─────────────────────────────────────────────────────────────────

type MainTab  = 'personal' | 'organization' | 'projects';
type OrgSubTab = 'details' | 'skills';

// ── Constants ─────────────────────────────────────────────────────────────────

const TWO_FA_METHODS: { id: 'app' | 'email'; label: string }[] = [
  { id: 'app',   label: 'Authentication App' },
  { id: 'email', label: 'Email' },
];

const EXPERIENCE_OPTIONS = ['0-2 Years', '2-5 Years', '5 Years', '5-10 Years', '10+ Years'];

const TAG_COLORS = [
  '#9B5CFF', '#F04438', '#A3E635', '#22C55E', '#14B8A6', '#3B82F6', '#F97316', '#FB7185',
  '#EC4899', '#1E293B', '#0F766E', '#1D4ED8', '#7C3AED', '#38BDF8', '#84CC16', '#EAB308',
];

// ── Shared layout helpers ─────────────────────────────────────────────────────

function SectionDivider({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="py-5 border-b border-[#E9EAEB]">
      <h3 className="text-sm font-semibold text-[#181D27]">{title}</h3>
      {sub && <p className="text-sm text-[#535862] mt-0.5">{sub}</p>}
    </div>
  );
}

function FormRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-8 py-5 border-b border-[#E9EAEB]">
      <div className="w-[280px] shrink-0">
        <p className="text-sm font-medium text-[#414651]">{label}</p>
        {sub && <p className="text-sm text-[#717680] mt-0.5">{sub}</p>}
      </div>
      <div className="w-[512px] shrink-0">{children}</div>
    </div>
  );
}

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

// ── Add Skill panel ───────────────────────────────────────────────────────────

interface AddSkillPanelProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddSkillPanel({ onClose, onCreated }: AddSkillPanelProps) {
  const createSkill = useCreateSkill();
  const [skillType,   setSkillType]   = useState('');
  const [description, setDescription] = useState('');
  const [color,       setColor]       = useState(TAG_COLORS[0]);
  const [error,       setError]       = useState('');

  async function handleCreate() {
    const name = skillType.trim();
    if (!name) { setError('Skill type is required.'); return; }
    setError('');
    try {
      await createSkill.mutateAsync({ name, category: color });
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#E9EAEB]">
          <div>
            <h2 className="text-lg font-semibold text-[#181D27]">Add a Skill</h2>
            <p className="text-sm text-[#535862] mt-0.5">Organize work by creating and managing skills.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] transition-colors">
            <X width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Skill Type */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Skill Type</label>
            <Input
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
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

          {/* Tag Color */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-3">Select Tag Color</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-[#7F56D9] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {skillType && (
            <div>
              <label className="block text-sm font-medium text-[#414651] mb-1.5">Preview</label>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: color + '22', color: color }}
              >
                {skillType}
              </span>
            </div>
          )}

          {/* Team with Skill */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-3">Team with Skill</label>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[0,1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                ))}
              </div>
              <button className="w-8 h-8 rounded-full border border-[#D5D7DA] flex items-center justify-center text-[#717680] hover:bg-gray-50 transition-colors">
                <Plus width={14} height={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E9EAEB] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleCreate} loading={createSkill.isPending} size="md">
            Create
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Skill Management table ────────────────────────────────────────────────────

const SKILLS_PER_PAGE = 6;

function SkillManagement() {
  const { data: skills = [], isLoading, refetch } = useSkills();
  const deleteSkill = useDeleteSkill();
  const [showAdd,  setShowAdd]  = useState(false);
  const [page,     setPage]     = useState(1);

  const totalPages = Math.max(1, Math.ceil(skills.length / SKILLS_PER_PAGE));
  const paginated  = skills.slice((page - 1) * SKILLS_PER_PAGE, page * SKILLS_PER_PAGE);

  async function handleDelete(id: string) {
    if (!confirm('Delete this skill? This cannot be undone.')) return;
    await deleteSkill.mutateAsync(id).catch(() => {});
  }

  // Pagination numbers (e.g. 1 2 3 ... 8 9 10)
  function pageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const arr: (number | '...')[] = [1, 2, 3, '...'];
    for (let i = Math.max(4, totalPages - 2); i <= totalPages; i++) arr.push(i);
    return arr;
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
            const color = skill.category ?? TAG_COLORS[0];
            const isHex = color.startsWith('#');
            return (
              <div
                key={skill.id}
                className="grid grid-cols-[200px_1fr_180px_160px_72px] items-center px-4 py-4 border-b border-[#E9EAEB] last:border-b-0 bg-white hover:bg-gray-50/50 transition-colors"
              >
                {/* Skill badge */}
                <div>
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={
                      isHex
                        ? { backgroundColor: color + '22', color }
                        : {}
                    }
                  >
                    {skill.name}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[#535862] pr-4 line-clamp-1">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>

                {/* Members with skill — placeholder avatars */}
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {[0,1,2].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 shrink-0" />
                    ))}
                  </div>
                  <span className="text-xs text-[#535862] ml-1">+5</span>
                </div>

                {/* On going usage */}
                <span className="text-sm font-semibold text-[#6941C6]">
                  — Tasks
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => handleDelete(skill.id)}
                    disabled={deleteSkill.isPending}
                    className="p-1.5 rounded-lg text-[#717680] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`Delete ${skill.name}`}
                  >
                    <Trash01 width={16} height={16} />
                  </button>
                  <button
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

        {/* Pagination */}
        {skills.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#E9EAEB]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#414651] border border-[#D5D7DA] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers().map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-sm text-[#717680]">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === n
                        ? 'bg-[#F9F5FF] text-[#7F56D9]'
                        : 'text-[#535862] hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#414651] border border-[#D5D7DA] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add skill drawer */}
      {showAdd && (
        <AddSkillPanel
          onClose={() => setShowAdd(false)}
          onCreated={() => { refetch(); setPage(1); }}
        />
      )}
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
  const [allSkills,  setAllSkills]  = useState<Skill[]>([]);

  // Personal form state
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [selectedSkills, setSelectedSkills] = useState<{ id: string; experience: string | null }[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editExp,        setEditExp]        = useState('');

  // Avatar
  const [cropSrc,         setCropSrc]         = useState<string | null>(null);
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 2FA
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email' | null>(null);

  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authUser) return;
    setProfile(authUser as User);
    setFirstName(authUser.first_name ?? authUser.name.split(' ')[0] ?? '');
    setLastName(authUser.last_name ?? authUser.name.split(' ').slice(1).join(' ') ?? '');
    setAvatarUrl(authUser.avatar_url ?? null);
    setSelectedSkills(
      (authUser.skills ?? []).map((s: Skill) => ({
        id: s.id,
        experience: (s as Skill & { experience?: string | null }).experience ?? null,
      })),
    );
    skillsApi.list()
      .then(setAllSkills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authUser]);

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
      setToastMsg('Profile updated successfully');
      setShowToast(true);
      refreshUser().catch(() => {});
    } catch (err) {
      setToastMsg((err as Error).message);
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  }

  function toggleSkill(id: string) {
    setSelectedSkills((prev) =>
      prev.find((s) => s.id === id)
        ? prev.filter((s) => s.id !== id)
        : [...prev, { id, experience: null }],
    );
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
        <div className="px-8 pb-12">

          <SectionDivider
            title="Personal info"
            sub="Update your photo and personal details here."
          />

          {/* Name */}
          <FormRow label="Name">
            <div className="flex gap-4">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="flex-1" />
              <Input value={lastName}  onChange={(e) => setLastName(e.target.value)}  placeholder="Last name"  className="flex-1" />
            </div>
          </FormRow>

          {/* Email */}
          <FormRow label="Email address" sub="This is your current email address.">
            <Input
              value={profile?.email ?? authUser?.email ?? ''}
              readOnly
              leftIcon={<Mail01 width={16} height={16} />}
              className="bg-gray-50 text-[#717680] cursor-not-allowed"
            />
          </FormRow>

          {/* Photo */}
          <FormRow label="Your photo" sub="This will be displayed on your profile.">
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
          </FormRow>

          {/* System role */}
          <FormRow label="System role" sub="Your access level in the platform.">
            <div className="flex items-center gap-2 px-3 py-2.5 border border-[#D5D7DA] rounded-lg bg-gray-50">
              <span className="text-sm text-[#717680] capitalize">
                {(profile?.role ?? authUser?.role ?? '').replace('_', ' ')}
              </span>
              <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4EBFF] text-[#6941C6] capitalize">
                {(profile?.role ?? authUser?.role ?? '').replace('_', ' ')}
              </span>
            </div>
          </FormRow>

          {/* Save */}
          <div className="flex gap-3 pt-5 pl-[312px]">
            <button
              onClick={() => {
                if (!profile) return;
                setFirstName(profile.first_name ?? profile.name.split(' ')[0] ?? '');
                setLastName(profile.last_name ?? profile.name.split(' ').slice(1).join(' ') ?? '');
                setSelectedSkills(profile.skills.map((s) => ({
                  id: s.id,
                  experience: (s as Skill & { experience?: string | null }).experience ?? null,
                })));
                setEditingSkillId(null);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button onClick={handleSave} loading={saving} size="md">Save changes</Button>
          </div>

          {/* 2FA */}
          <FormRow
            label="Two-factor authentication"
            sub="Keep your account secure by enabling 2FA via email or authenticator app."
          >
            <div className="border border-[#E9EAEB] rounded-xl overflow-hidden">
              <div className="flex">
                {/* Left stepper */}
                <div className="w-44 shrink-0 px-5 py-6 border-r border-[#E9EAEB] flex flex-col gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7F56D9] flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#7F56D9]">Choose method</span>
                  </div>
                  <div className="ml-4 w-px h-8 bg-[#E9EAEB]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#D5D7DA] flex items-center justify-center shrink-0 bg-white">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D5D7DA]" />
                    </div>
                    <span className="text-sm font-medium text-[#717680]">Verify code</span>
                  </div>
                </div>

                {/* Right method selection */}
                <div className="flex-1 px-6 py-6">
                  <p className="text-sm font-semibold text-[#181D27] mb-4">Choose an authentication method</p>
                  <div className="flex flex-col gap-3">
                    {TWO_FA_METHODS.map((m) => {
                      const checked = twoFAMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                            checked ? 'border-[#7F56D9] bg-[#F9F5FF]' : 'border-[#E9EAEB] bg-white hover:border-[#9E77ED]'
                          }`}
                        >
                          <Checkbox checked={checked} onChange={() => setTwoFAMethod(checked ? null : m.id)} />
                          <span className="text-sm font-medium text-[#414651]">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {twoFAMethod && (
                    <div className="mt-5"><Button size="md">Next</Button></div>
                  )}
                </div>
              </div>
            </div>
          </FormRow>

          {/* My skills */}
          <FormRow label="Skills" sub="Add skills to help your team understand your expertise.">
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {selectedSkills.map(({ id, experience }) => {
                  const skill = allSkills.find((s) => s.id === id);
                  if (!skill) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E9EAEB] rounded-xl shadow-sm">
                      <div className="w-9 h-9 rounded-lg bg-[#F9F5FF] flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5l2.472 4.5H16.5l-3.986 3.375 1.514 5.25L9 12l-5.028 2.625 1.514-5.25L1.5 6h5.028L9 1.5z"
                            fill="#7F56D9" fillOpacity="0.15" stroke="#7F56D9" strokeWidth="1.25" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">{skill.name}</p>
                        {editingSkillId === id ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <select
                              value={editExp}
                              onChange={(e) => setEditExp(e.target.value)}
                              className="text-xs border border-[#D5D7DA] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#9E77ED]"
                            >
                              <option value="">No experience</option>
                              {EXPERIENCE_OPTIONS.map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                setSelectedSkills((prev) =>
                                  prev.map((s) => s.id === id ? { ...s, experience: editExp || null } : s),
                                );
                                setEditingSkillId(null);
                              }}
                              className="text-xs text-[#7F56D9] font-medium hover:underline"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-[#717680]">{experience ?? 'Add experience'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => { setEditingSkillId(id); setEditExp(experience ?? ''); }}
                          className="p-1 rounded hover:bg-gray-100 text-[#717680] transition-colors"
                        >
                          <Edit01 width={14} height={14} />
                        </button>
                        <button
                          onClick={() => toggleSkill(id)}
                          className="p-1 rounded hover:bg-red-50 text-[#717680] hover:text-red-600 transition-colors"
                        >
                          <Trash01 width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {allSkills
                .filter((s) => !selectedSkills.find((x) => x.id === s.id))
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSkill(s.id)}
                    className="px-3 py-1.5 text-sm font-medium text-[#414651] bg-white border border-[#E9EAEB] rounded-full hover:border-[#7F56D9] hover:text-[#7F56D9] hover:bg-[#F9F5FF] transition-colors"
                  >
                    + {s.name}
                  </button>
                ))}
              {allSkills.length === 0 && (
                <p className="text-sm text-[#717680]">No skills available.</p>
              )}
            </div>
          </FormRow>

        </div>
      )}

      {/* ── Organization Info ─────────────────────────────────────────────────── */}
      {mainTab === 'organization' && (
        <div className="px-8 pb-12">
          <div className="py-5 border-b border-[#E9EAEB]">
            <h2 className="text-lg font-semibold text-[#181D27]">Organisation info</h2>
            <p className="text-sm text-[#535862] mt-0.5">Update your organisation details here.</p>
          </div>

          <OrgSubTabBar active={orgSubTab} onChange={setOrgSubTab} />

          {orgSubTab === 'details' && (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F4EBFF] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2L13.5 7H19L14.7 10.5 16.4 16 11 13 5.6 16 7.3 10.5 3 7H8.5L11 2Z"
                    fill="#7F56D9" fillOpacity="0.2" stroke="#7F56D9" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#181D27]">Coming soon</p>
              <p className="text-sm text-[#717680] max-w-sm">
                Organisation details configuration will be available in a future update.
              </p>
            </div>
          )}

          {orgSubTab === 'skills' && <SkillManagement />}
        </div>
      )}

      {/* ── Project Settings ──────────────────────────────────────────────────── */}
      {mainTab === 'projects' && (
        <div className="px-8 py-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F4EBFF] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="3" fill="#7F56D9" fillOpacity="0.15" stroke="#7F56D9" strokeWidth="1.5"/>
              <path d="M7 11h8M7 7h8M7 15h5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#181D27]">Coming soon</p>
          <p className="text-sm text-[#717680] max-w-sm">
            Project settings configuration will be available in a future update.
          </p>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <Toast message={toastMsg} subtitle="" onClose={() => setShowToast(false)} />
      )}

      {/* Avatar crop modal */}
      {cropSrc && (
        <ImageCropModal src={cropSrc} onSave={handleCropComplete} onCancel={() => setCropSrc(null)} />
      )}
    </main>
  );
}
