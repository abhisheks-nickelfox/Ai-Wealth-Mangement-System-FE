import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit02, Trash01, Plus, HelpCircle, Mail01, XClose } from '@untitled-ui/icons-react';
import { useUser, useUpdateUser } from '../hooks/useUsers';
import { useSkills } from '../hooks/useSkills';
import { profileApi } from '../lib/api';
import { EXTRA_PERMISSIONS } from '../lib/constants';
import type { User, Skill } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Toast from '../components/ui/Toast';
import FileUpload from '../components/ui/FileUpload';
import ImageCropModal from '../components/ui/ImageCropModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import Badge from '../components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────────


const EXPERIENCE_OPTIONS = ['0-2 Years', '2-5 Years', '5 Years', '5-10 Years', '10+ Years'];
const RATE_FREQUENCIES   = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

interface LocalSkill {
  id: string;
  name: string;
  experience: string | null;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const selectCls =
  'border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent w-full appearance-none pr-8';

// ── SectionRow ────────────────────────────────────────────────────────────────
// Border on the outer div spans full content width.
// Inner flex is right-padded via inline style to align with Status block.

const ROW_RIGHT_PAD = 200;

function SectionRow({ label, sublabel, required, helpText, rightPad, children }: {
  label: string;
  sublabel?: string;
  required?: boolean;
  helpText?: string;
  rightPad?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100">
      <div className="flex gap-8 py-5" style={{ paddingRight: rightPad ?? ROW_RIGHT_PAD }}>
        <div className="w-[265px] shrink-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-gray-500 ml-0.5">*</span>}
            </p>
            {helpText && <HelpCircle width={14} height={14} className="text-gray-400 shrink-0" />}
          </div>
          {sublabel && <p className="text-sm text-gray-500 mt-0.5 leading-snug">{sublabel}</p>}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ── ChevronSelect — no reusable Select component exists yet ───────────────────

function ChevronSelect({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${selectCls} ${className}`} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
    </div>
  );
}

// ── AddSkillsModal ────────────────────────────────────────────────────────────

interface SkillRowEntry {
  rowId: string;
  skillId: string;
  experience: string;
}

function AddSkillsModal({
  skillCatalog,
  initialSkills,
  onClose,
  onSave,
}: {
  skillCatalog: Skill[];
  initialSkills: LocalSkill[];
  onClose: () => void;
  onSave: (skills: LocalSkill[]) => void;
}) {
  const [rows, setRows] = useState<SkillRowEntry[]>(
    initialSkills.length > 0
      ? initialSkills.map((s) => ({
          rowId: s.id,
          skillId: s.id.startsWith('temp-') ? '' : s.id,
          experience: s.experience ?? '',
        }))
      : [{ rowId: 'row-0', skillId: '', experience: '' }]
  );

  function updateRow(rowId: string, field: 'skillId' | 'experience', value: string) {
    setRows((prev) => prev.map((r) => r.rowId === rowId ? { ...r, [field]: value } : r));
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev);
  }

  function addRow() {
    setRows((prev) => [...prev, { rowId: `row-${Date.now()}`, skillId: '', experience: '' }]);
  }

  function handleSave() {
    const skills: LocalSkill[] = rows
      .filter((r) => r.skillId)
      .map((r) => {
        const catalog = skillCatalog.find((s) => s.id === r.skillId);
        return { id: r.skillId, name: catalog?.name ?? r.skillId, experience: r.experience || null };
      });
    onSave(skills);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white shadow-2xl w-[660px] max-w-[95vw] px-10 py-10">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XClose width={18} height={18} />
        </button>
        <h2 className="text-3xl font-bold text-[#181D27] mb-8">Add More Skills</h2>

        {/* Column headers */}
        <div className="grid mb-3" style={{ gridTemplateColumns: '1fr 1fr 40px', gap: '16px' }}>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            Skills <span className="text-gray-400">*</span>
            <HelpCircle width={15} height={15} className="text-[#7F56D9] ml-0.5" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            Experience <span className="text-gray-400">*</span>
            <HelpCircle width={15} height={15} className="text-[#7F56D9] ml-0.5" />
          </div>
          <div />
        </div>

        {/* Skill rows — fixed height for 3 rows, scrollable beyond that */}
        <div className="overflow-y-auto flex flex-col gap-4" style={{ maxHeight: '228px' }}>
          {rows.map((row) => (
            <div key={row.rowId} className="grid items-center shrink-0" style={{ gridTemplateColumns: '1fr 1fr 40px', gap: '16px' }}>
              <div className="relative">
                <select
                  value={row.skillId}
                  onChange={(e) => updateRow(row.rowId, 'skillId', e.target.value)}
                  className="border border-[#D5D7DA] rounded-lg px-4 py-3 text-sm text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-[#9E77ED] w-full appearance-none pr-9"
                >
                  <option value="">Select skill…</option>
                  {skillCatalog.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>

              <div className="relative">
                <select
                  value={row.experience}
                  onChange={(e) => updateRow(row.rowId, 'experience', e.target.value)}
                  className="border border-[#D5D7DA] rounded-lg px-4 py-3 text-sm text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-[#9E77ED] w-full appearance-none pr-9"
                >
                  <option value="">Select…</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>

              <button
                onClick={() => removeRow(row.rowId)}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <XClose width={15} height={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Add another + button always below the scroll area */}
        <button
          onClick={addRow}
          className="mt-4 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors block"
        >
          + Add another
        </button>

        <div className="flex justify-center mt-6">
          <Button variant="primary" onClick={handleSave} className="w-[60%] justify-center">
            Update &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── UserSettingsForm — state initialised from props, no useEffect ─────────────

function UserSettingsForm({ userId, user }: { userId: string; user: User }) {
  const { data: skillCatalog = [] } = useSkills();
  const updateUser = useUpdateUser();
  const isInvitedUser = user.status === 'invited';

  const [firstName,     setFirstName]     = useState(user.first_name ?? '');
  const [lastName,      setLastName]      = useState(user.last_name ?? '');
  const [role,          setRole]          = useState<'admin' | 'member' | 'project_manager'>(
    user.role === 'super_admin' ? 'admin' : user.role
  );
  const [status,        setStatus]        = useState<'Active' | 'invited' | 'Disabled'>(user.status);
  const [permissions,   setPermissions]   = useState<string[]>(user.permissions ?? []);
  const [localSkills,   setLocalSkills]   = useState<LocalSkill[]>(
    (user.skills ?? []).map((s) => ({
      id:         s.id,
      name:       s.name,
      experience: (s as { experience?: string | null }).experience ?? null,
    }))
  );
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(user.avatar_url ?? null);
  const [rateAmount,    setRateAmount]    = useState(user.rate_amount != null ? String(user.rate_amount) : '');
  const [rateFrequency, setRateFrequency] = useState<'Hourly' | 'Daily' | 'Weekly' | 'Monthly'>(user.rate_frequency ?? 'Weekly');

  const [cropSrc,    setCropSrc]    = useState<string | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [editingSkillId,  setEditingSkillId]  = useState<string | null>(null);
  const [editSkillExp,    setEditSkillExp]    = useState('');

  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function togglePermission(key: string, checked: boolean) {
    setPermissions((p) => checked ? [...p, key] : p.filter((k) => k !== key));
  }

  function removeSkill(id: string) { setLocalSkills((p) => p.filter((s) => s.id !== id)); }

  function startEditSkill(skill: LocalSkill) {
    setEditingSkillId(skill.id);
    setEditSkillExp(skill.experience ?? '');
  }

  function saveEditSkill(skillId: string) {
    setLocalSkills((p) => p.map((s) => s.id === skillId ? { ...s, experience: editSkillExp || null } : s));
    setEditingSkillId(null);
  }

  function handleFile(file: File) { setCropSrc(URL.createObjectURL(file)); }

  function handleCropSave(dataUrl: string) {
    setCroppedUrl(dataUrl);
    setAvatarUrl(dataUrl);
    setCropSrc(null);
  }

  async function handleSave() {
    if (rateAmount && parseFloat(rateAmount) > 99999999.99) {
      setToast({ message: 'Rate amount cannot exceed 99,999,999.99.', isError: true });
      return;
    }
    let finalAvatarUrl = avatarUrl;
    if (croppedUrl?.startsWith('data:')) {
      try { finalAvatarUrl = (await profileApi.uploadAvatar(userId, croppedUrl)).avatar_url; } catch { /* local dev fallback */ }
    }
    const skills_with_experience = localSkills
      .filter((s) => !s.id.startsWith('temp-'))
      .map((s) => ({ skill_id: s.id, experience: s.experience ?? null }));
    try {
      await updateUser.mutateAsync({
        id: userId,
        payload: {
          first_name:     firstName,
          last_name:      lastName,
          role,
          member_role:    '',
          status,
          permissions,
          skills_with_experience,
          avatar_url:     finalAvatarUrl ?? undefined,
          rate_amount:    rateAmount ? parseFloat(rateAmount) : null,
          rate_frequency: rateFrequency,
        },
      });
      setToast({ message: 'Profile updated successfully' });
      setCroppedUrl(null);
    } catch (err) {
      setToast({ message: (err as Error).message, isError: true });
    }
  }

  const displayAvatar = croppedUrl ?? avatarUrl ?? undefined;
  const displayTitle  = role.replace(/_/g, ' ');
  const photoLabel    = firstName || user.first_name || user.name.split(' ')[0];
  const statusOptions = isInvitedUser
    ? [{ value: 'invited', label: 'Invited' as const }]
    : [
        { value: 'Active', label: 'Active' as const },
        { value: 'Disabled', label: 'Disabled' as const },
      ];

  return (
    <>
      <div className="px-8 py-8 flex flex-col gap-6">

        {/* ── Header: name left, status right, border-b acts as section divider ── */}
        <div className="flex items-start justify-between pb-6 border-b border-gray-100">

          {/* Left: name + subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-[#181D27]">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{displayTitle}</p>
          </div>

          {/* Right: Status panel */}
          <div className="flex flex-col gap-1.5" style={{ width: 170 }}>
            <span className="text-sm font-medium text-gray-700">Status</span>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${
                status === 'Active' ? 'bg-green-500' : status === 'invited' ? 'bg-amber-400' : 'bg-gray-400'
              }`} />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                disabled={isInvitedUser}
                className="border border-[#D5D7DA] rounded-lg pl-7 pr-8 py-2.5 text-sm text-[#181D27] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#9E77ED] w-full appearance-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.value === status}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
          </div>
        </div>

        {/* ── Form: full-width so SectionRow borders span edge to edge ── */}
        <div>

          {/* Name */}
          <SectionRow label="Name" required>
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
          </SectionRow>

          {/* Email */}
          <SectionRow label="Email address" required>
            <Input
              type="email"
              value={user.email}
              readOnly
              leftIcon={<Mail01 width={16} height={16} />}
              className="bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </SectionRow>

          {/* Photo */}
          <SectionRow label={`${photoLabel} photo`} required helpText="x"
            sublabel="This will be displayed on your profile.">
            <div className="flex gap-4 items-start">
              <Avatar src={displayAvatar} name={user.name} size="lg" className="shrink-0" />
              <div className="flex-1">
                <FileUpload accept="image/svg+xml,image/png,image/jpeg,image/gif"
                  maxSizeMB={2} onFile={handleFile} />
              </div>
            </div>
          </SectionRow>

          {/* Role */}
          <SectionRow label="Role">
            <ChevronSelect value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="project_manager">Project Manager</option>
            </ChevronSelect>
          </SectionRow>

          {/* Cost */}
          <SectionRow label="Cost" rightPad={320}>
            <div className="flex gap-3">
              <div className="w-[600px]">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={rateAmount}
                  onChange={(e) => setRateAmount(e.target.value)}
                  placeholder="0"
                  leftIcon={<span className="text-sm font-medium text-gray-500">$</span>}
                />
              </div>
              <div className="w-[3  25px]">
                <ChevronSelect value={rateFrequency} onChange={(e) => setRateFrequency(e.target.value as 'Hourly' | 'Daily' | 'Weekly' | 'Monthly')}>
                  {RATE_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </ChevronSelect>
              </div>
            </div>
          </SectionRow>

          {/* Two-factor authentication */}
          <SectionRow label="Two-factor authentication">
            <div className="flex items-center h-10">
              <Badge variant="success">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  Enabled
                </span>
              </Badge>
            </div>
          </SectionRow>

          {/* Skills — 3-column card grid */}
          <SectionRow label="Skills">
            <div className="flex flex-col gap-3">
              {localSkills.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {localSkills.map((skill) =>
                    editingSkillId === skill.id ? (
                      <div key={skill.id}
                        className="flex flex-col gap-2 bg-white border border-[#D5D7DA] rounded-lg p-3">
                        <span className="text-sm font-medium text-[#181D27]">{skill.name}</span>
                        <select value={editSkillExp} onChange={(e) => setEditSkillExp(e.target.value)}
                          className="text-sm border border-[#D5D7DA] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E77ED]">
                          <option value="">No experience</option>
                          {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={() => saveEditSkill(skill.id)}
                            className="flex-1">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSkillId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div key={skill.id}
                        className="flex items-start justify-between bg-white border border-[#E9EAEB] rounded-lg px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#181D27] truncate">{skill.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {skill.experience ?? '—'} experience
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button onClick={() => startEditSkill(skill)}
                            className="p-1 rounded hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors">
                            <Edit02 width={14} height={14} />
                          </button>
                          <button onClick={() => removeSkill(skill.id)}
                            className="p-1 rounded hover:bg-gray-100 text-[#717680] hover:text-red-600 transition-colors">
                            <Trash01 width={14} height={14} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus width={14} height={14} />}
                onClick={() => setSkillsModalOpen(true)}
                className="self-start"
              >
                Add more skills
              </Button>
            </div>
          </SectionRow>

          {/* Extra Permissions */}
          <SectionRow label="Extra Permissions">
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-0.5">
              {EXTRA_PERMISSIONS.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  checked={permissions.includes(key)}
                  onChange={(checked) => togglePermission(key, checked)}
                  label={label}
                />
              ))}
            </div>
          </SectionRow>

          {/* Save */}
          <div className="pt-6 flex justify-end gap-3">
            <Button variant="secondary">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateUser.isPending}
            >
              Save changes
            </Button>
          </div>

        </div>{/* end form */}
      </div>{/* end px-8 py-8 */}

      {skillsModalOpen && (
        <AddSkillsModal
          skillCatalog={skillCatalog}
          initialSkills={localSkills}
          onClose={() => setSkillsModalOpen(false)}
          onSave={(skills) => { setLocalSkills(skills); setSkillsModalOpen(false); }}
        />
      )}
      {cropSrc && <ImageCropModal src={cropSrc} onSave={handleCropSave} onCancel={() => setCropSrc(null)} />}
      {toast && (
        <Toast message={toast.message} subtitle={toast.isError ? undefined : 'Changes saved to profile.'}
          onClose={() => setToast(null)} />
      )}
    </>
  );
}

// ── Page shell — handles loading, then mounts form ────────────────────────────

export default function EditUserSettingsPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUser(id);

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      navigate('/users', {
        replace: true,
        state: { toastMessage: 'User profile is no longer available' },
      });
    }
  }, [error, isLoading, navigate, user]);

  if (isLoading) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error || !user) {
    return null;
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white">
      <UserSettingsForm key={user.id} userId={id} user={user} />
    </main>
  );
}
