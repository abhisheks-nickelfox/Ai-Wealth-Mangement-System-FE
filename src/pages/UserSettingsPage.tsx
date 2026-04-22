import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Edit02, Trash01, Plus, ChevronRight } from '@untitled-ui/icons-react';
import { useUser, useUpdateUser } from '../hooks/useUsers';
import { useMemberRoles } from '../hooks/useMemberRoles';
import { useSkills } from '../hooks/useSkills';
import { profileApi } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Toast from '../components/ui/Toast';
import FileUpload from '../components/ui/FileUpload';
import ImageCropModal from '../components/ui/ImageCropModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const KNOWN_PERMISSIONS = [
  { key: 'create_projects',        label: 'Project Creation' },
  { key: 'create_tasks',           label: 'Task Creation' },
  { key: 'view_global_timesheet',  label: 'Global timesheet' },
];

const EXPERIENCE_OPTIONS = [
  '0-2 Years',
  '2-5 Years',
  '5 Years',
  '5-10 Years',
  '10+ Years',
];

// ── Local types ───────────────────────────────────────────────────────────────

interface LocalSkill {
  id: string;
  name: string;
  experience: string | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionRow({ label, sublabel, children }: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8 py-6 border-b border-gray-100">
      <div className="w-52 shrink-0 pt-0.5">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sublabel && <p className="text-sm text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls =
  'border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent w-full';

const selectCls =
  'border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent w-full appearance-none';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserSettingsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUser(id);
  const { data: memberRoles = [], isLoading: rolesLoading } = useMemberRoles();
  const { data: skillCatalog = [] } = useSkills();
  const updateUser = useUpdateUser();

  // ── Form state ────────────────────────────────────────────────────────────────
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [memberRole,   setMemberRole]   = useState('');
  const [status,       setStatus]       = useState<'Active' | 'invited' | 'Disabled'>('Active');
  const [permissions,  setPermissions]  = useState<string[]>([]);
  const [localSkills,  setLocalSkills]  = useState<LocalSkill[]>([]);
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);

  // ── Avatar upload state ───────────────────────────────────────────────────────
  const [cropSrc,      setCropSrc]      = useState<string | null>(null);
  const [croppedUrl,   setCroppedUrl]   = useState<string | null>(null);

  // ── Skill form state ──────────────────────────────────────────────────────────
  const [addingSkill,     setAddingSkill]     = useState(false);
  const [newSkillId,      setNewSkillId]      = useState('');
  const [newSkillName,    setNewSkillName]    = useState('');
  const [newSkillExp,     setNewSkillExp]     = useState('');
  const [editingSkillId,  setEditingSkillId]  = useState<string | null>(null);
  const [editSkillExp,    setEditSkillExp]    = useState('');

  // ── Toast state ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // ── Seed form when user loads ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? '');
    setLastName(user.last_name ?? '');
    setMemberRole(user.member_role ?? '');
    setStatus(user.status);
    setPermissions(user.permissions ?? []);
    setAvatarUrl(user.avatar_url ?? null);
    setLocalSkills(
      (user.skills ?? []).map((s) => ({
        id:         s.id,
        name:       s.name,
        experience: (s as { experience?: string | null }).experience ?? null,
      }))
    );
  }, [user]);

  // ── Permission toggle ─────────────────────────────────────────────────────────
  function togglePermission(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  // ── Skill management ──────────────────────────────────────────────────────────
  function removeSkill(skillId: string) {
    setLocalSkills((prev) => prev.filter((s) => s.id !== skillId));
  }

  function startEditSkill(skill: LocalSkill) {
    setEditingSkillId(skill.id);
    setEditSkillExp(skill.experience ?? '');
  }

  function saveEditSkill(skillId: string) {
    setLocalSkills((prev) =>
      prev.map((s) => s.id === skillId ? { ...s, experience: editSkillExp || null } : s)
    );
    setEditingSkillId(null);
  }

  function addSkill() {
    const catalogSkill = skillCatalog.find((s) => s.id === newSkillId);
    const name = catalogSkill?.name ?? newSkillName.trim();
    if (!name) return;

    const alreadyAdded = localSkills.some((s) => s.id === newSkillId || s.name.toLowerCase() === name.toLowerCase());
    if (alreadyAdded) return;

    const newEntry: LocalSkill = {
      id:         newSkillId || `temp-${Date.now()}`,
      name,
      experience: newSkillExp || null,
    };
    setLocalSkills((prev) => [...prev, newEntry]);
    setAddingSkill(false);
    setNewSkillId('');
    setNewSkillName('');
    setNewSkillExp('');
  }

  // ── Avatar flow ───────────────────────────────────────────────────────────────
  function handleFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  function handleCropSave(dataUrl: string) {
    setCroppedUrl(dataUrl);
    setAvatarUrl(dataUrl);
    setCropSrc(null);
  }

  // ── Save handler ──────────────────────────────────────────────────────────────
  async function handleSave() {
    let finalAvatarUrl = avatarUrl;

    if (croppedUrl && croppedUrl.startsWith('data:')) {
      try {
        const result = await profileApi.uploadAvatar(id, croppedUrl);
        finalAvatarUrl = result.avatar_url;
      } catch {
        // Falls back to data URL storage (local dev without bucket)
      }
    }

    // Only send skill_ids that exist in the catalog; temp IDs are excluded
    const skill_ids = localSkills
      .filter((s) => !s.id.startsWith('temp-'))
      .map((s) => s.id);

    try {
      await updateUser.mutateAsync({
        id,
        payload: {
          first_name:  firstName,
          last_name:   lastName,
          member_role: memberRole || undefined,
          status,
          permissions,
          skill_ids,
          avatar_url:  finalAvatarUrl ?? undefined,
        },
      });
      setToast({ message: 'Profile updated successfully' });
      setCroppedUrl(null);
    } catch (err) {
      setToast({ message: (err as Error).message, isError: true });
    }
  }

  // ── Unknown permissions (not in KNOWN_PERMISSIONS list) ───────────────────────
  const knownKeys = KNOWN_PERMISSIONS.map((p) => p.key);
  const unknownPerms = permissions.filter((p) => !knownKeys.includes(p));

  // ── Render states ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-600">{(error as Error)?.message ?? 'User not found'}</p>
      </main>
    );
  }

  const displayTitle = user.member_role ?? user.role;
  const displayAvatar = croppedUrl ?? avatarUrl ?? undefined;

  return (
    <>
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-8 py-8">

          {/* Breadcrumb + status */}
          <div className="relative flex items-center mb-6">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <Link to="/settings" className="hover:text-gray-700 transition-colors">
                Settings
              </Link>
              <ChevronRight width={14} height={14} className="text-gray-400 shrink-0" />
              <Link to="/users" className="hover:text-gray-700 transition-colors">
                Users
              </Link>
              <ChevronRight width={14} height={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-900 font-medium">{user.name}</span>
            </nav>

            {/* Status selector — floated to top-right of content column */}
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  status === 'Active'   ? 'bg-green-500' :
                  status === 'invited' ? 'bg-amber-400' :
                  'bg-gray-400'
                }`}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1"
              >
                <option value="Active">Active</option>
                <option value="invited">Invited</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>

          {/* User identity header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar
              src={displayAvatar}
              name={user.name}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-semibold text-[#181D27]">{user.name}</h1>
              <p className="text-sm text-gray-500 capitalize">{displayTitle}</p>
            </div>
          </div>

          {/* ── Form sections ── */}

          {/* Name */}
          <SectionRow label="Name" sublabel="*">
            <div className="flex gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={inputCls}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={inputCls}
              />
            </div>
          </SectionRow>

          {/* Email — read-only */}
          <SectionRow label="Email address" sublabel="*">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                ✉
              </span>
              <input
                type="email"
                value={user.email}
                readOnly
                className={`${inputCls} pl-8 bg-gray-50 text-gray-500 cursor-not-allowed`}
              />
            </div>
          </SectionRow>

          {/* Avatar */}
          <SectionRow
            label={`${firstName || user.first_name || user.name.split(' ')[0]} photo`}
            sublabel="This will be displayed on your profile."
          >
            <div className="flex gap-4 items-start">
              <Avatar
                src={displayAvatar}
                name={user.name}
                size="lg"
                className="shrink-0"
              />
              <div className="flex-1">
                <FileUpload
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  maxSizeMB={2}
                  onFile={handleFile}
                />
              </div>
            </div>
          </SectionRow>

          {/* Role (member_role) */}
          <SectionRow label="Role">
            {rolesLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— No role —</option>
                  {memberRoles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  ▾
                </span>
              </div>
            )}
          </SectionRow>

          {/* Skills */}
          <SectionRow label="Skills">
            <div className="flex flex-col gap-2">
              {localSkills.map((skill) =>
                editingSkillId === skill.id ? (
                  /* Inline edit row */
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 bg-white border border-[#D5D7DA] rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-[#181D27] flex-1">{skill.name}</span>
                    <select
                      value={editSkillExp}
                      onChange={(e) => setEditSkillExp(e.target.value)}
                      className="text-sm border border-[#D5D7DA] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E77ED]"
                    >
                      <option value="">No experience</option>
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveEditSkill(skill.id)}
                      className="text-xs font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] px-3 py-1.5 rounded-md transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSkillId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Skill card */
                  <div
                    key={skill.id}
                    className="flex items-center justify-between bg-white border border-[#E9EAEB] rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#181D27]">{skill.name}</p>
                      {skill.experience && (
                        <p className="text-sm text-gray-500 mt-0.5">{skill.experience} exp</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditSkill(skill)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors"
                        title="Edit experience"
                      >
                        <Edit02 width={15} height={15} />
                      </button>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-red-600 transition-colors"
                        title="Remove skill"
                      >
                        <Trash01 width={15} height={15} />
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Add skill form */}
              {addingSkill && (
                <div className="flex items-center gap-2 bg-white border border-[#D5D7DA] rounded-lg px-3 py-2">
                  {skillCatalog.length > 0 ? (
                    <select
                      value={newSkillId}
                      onChange={(e) => setNewSkillId(e.target.value)}
                      className="text-sm border border-[#D5D7DA] rounded-md px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-[#9E77ED]"
                    >
                      <option value="">Select skill…</option>
                      {skillCatalog
                        .filter((s) => !localSkills.some((ls) => ls.id === s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Skill name"
                      className="text-sm border border-[#D5D7DA] rounded-md px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-[#9E77ED]"
                    />
                  )}
                  <select
                    value={newSkillExp}
                    onChange={(e) => setNewSkillExp(e.target.value)}
                    className="text-sm border border-[#D5D7DA] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E77ED]"
                  >
                    <option value="">No experience</option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    onClick={addSkill}
                    className="text-xs font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] px-3 py-1.5 rounded-md transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingSkill(false);
                      setNewSkillId('');
                      setNewSkillName('');
                      setNewSkillExp('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {!addingSkill && (
                <button
                  onClick={() => setAddingSkill(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6941C6] hover:text-[#7F56D9] transition-colors mt-1 self-start"
                >
                  <Plus width={16} height={16} />
                  Add more skills
                </button>
              )}
            </div>
          </SectionRow>

          {/* Permissions */}
          <SectionRow label="Extra Permissions">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {KNOWN_PERMISSIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes(key)}
                    onChange={() => togglePermission(key)}
                    className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}

              {/* Unknown permissions not in the known list — still show them checked */}
              {unknownPerms.map((perm) => (
                <label key={perm} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => togglePermission(perm)}
                    className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{perm}</span>
                </label>
              ))}
            </div>
          </SectionRow>

          {/* Save */}
          <div className="pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateUser.isPending}
              className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {updateUser.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </div>
      </main>

      {/* Image crop modal — rendered outside the scrollable main */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onSave={handleCropSave}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          subtitle={toast.isError ? undefined : 'Changes saved to profile.'}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
