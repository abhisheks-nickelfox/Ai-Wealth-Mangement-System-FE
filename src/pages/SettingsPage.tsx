import { useState, useEffect } from 'react';
import {
  Mail01,
  Trash01,
  Edit01,
} from '@untitled-ui/icons-react';
import TabBar from '../components/ui/TabBar';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import ImageCropModal from '../components/ui/ImageCropModal';
import FileUpload from '../components/ui/FileUpload';
import Checkbox from '../components/ui/Checkbox';
import { useAuth } from '../context/AuthContext';
import { skillsApi, profileApi } from '../lib/api';
import type { User, Skill } from '../lib/api';

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'projects';

// ── 2FA Methods ───────────────────────────────────────────────────────────────

const TWO_FA_METHODS: { id: 'app' | 'email'; label: string }[] = [
  { id: 'app',   label: 'Authentication App' },
  { id: 'email', label: 'Email' },
];

// ── Section wrapper ───────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user: authUser, refreshUser } = useAuth();

  const [tab,         setTab]         = useState<Tab>('details');
  const [profile,     setProfile]     = useState<User | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showToast,   setShowToast]   = useState(false);
  const [toastMsg,    setToastMsg]    = useState('');
  const [allSkills,   setAllSkills]   = useState<Skill[]>([]);

  // Form state
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [memberRole,  setMemberRole]  = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Avatar
  const [cropSrc,     setCropSrc]     = useState<string | null>(null);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 2FA
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email' | null>(null);

  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authUser) return;

    // Populate form from auth context (full profile returned by GET /auth/me)
    setProfile(authUser as User);
    setFirstName(authUser.first_name ?? authUser.name.split(' ')[0] ?? '');
    setLastName(authUser.last_name ?? authUser.name.split(' ').slice(1).join(' ') ?? '');
    setMemberRole(authUser.member_role ?? '');
    setAvatarUrl(authUser.avatar_url ?? null);
    setSelectedIds((authUser.skills ?? []).map((s: Skill) => s.id));

    // Load skill catalog for the picker
    skillsApi.list()
      .then(setAllSkills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authUser]);

  // ── Avatar pick ──────────────────────────────────────────────────────────────

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

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!authUser) return;
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updated = await profileApi.update(authUser.id, {
        name:        fullName,
        first_name:  firstName.trim() || undefined,
        last_name:   lastName.trim()  || undefined,
        member_role: memberRole.trim() || undefined,
        skill_ids:   selectedIds,
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

  // ── Skill toggle ─────────────────────────────────────────────────────────────

  function toggleSkill(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
      {/* Page header */}
      <div className="px-8 pt-8 pb-0 border-b border-[#E9EAEB]">
        <h1 className="text-2xl font-semibold text-[#181D27] mb-1">Settings</h1>
        <p className="text-sm text-[#535862] mb-5">
          Manage your team members and their account permissions here.
        </p>

        {/* Tab strip */}
        <TabBar
          tabs={[
            { id: 'details',  label: 'My details'       },
            { id: 'projects', label: 'Project settings' },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as Tab)}
        />
      </div>

      {/* Content */}
      {tab === 'details' && (
        <div className="px-8 pb-12">

          {/* ── Personal info ──────────────────────────────────────────────── */}
          <SectionDivider
            title="Personal info"
            sub="Update your photo and personal details here."
          />

          {/* Name */}
          <FormRow label="Name">
            <div className="flex gap-4">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="flex-1"
              />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="flex-1"
              />
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
          <FormRow
            label="Your photo"
            sub="This will be displayed on your profile."
          >
            <div className="flex items-start gap-5">
              {/* Current avatar */}
              <div className="relative shrink-0">
                <Avatar
                  src={avatarUrl ?? undefined}
                  name={displayName}
                  size="lg"
                  className="w-16 h-16"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload zone */}
              <div className="flex-1">
                <FileUpload
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  maxSizeMB={2}
                  onFile={handleAvatarFile}
                />
              </div>
            </div>
          </FormRow>

          {/* System role (read-only) */}
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

          {/* Job title */}
          <FormRow label="Job title" sub="Your role or job title within the team.">
            <Input
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              placeholder="e.g. Product Designer"
            />
          </FormRow>

          {/* Save row */}
          <div className="flex gap-3 pt-5 pl-[312px]">
            <button
              onClick={() => {
                if (!profile) return;
                setFirstName(profile.first_name ?? profile.name.split(' ')[0] ?? '');
                setLastName(profile.last_name ?? profile.name.split(' ').slice(1).join(' ') ?? '');
                setMemberRole(profile.member_role ?? '');
                setSelectedIds(profile.skills.map((s) => s.id));
              }}
              className="px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button onClick={handleSave} loading={saving} size="md">
              Save changes
            </Button>
          </div>

          {/* ── Two-factor authentication ───────────────────────────────── */}
          <FormRow
            label="Two-factor authentication"
            sub="Keep your account secure by enabling 2FA via email or authenticator app."
          >
            {/* Card with vertical stepper on left + method selection on right */}
            <div className="border border-[#E9EAEB] rounded-xl overflow-hidden">
              <div className="flex">
                {/* Left — vertical stepper */}
                <div className="w-44 shrink-0 px-5 py-6 border-r border-[#E9EAEB] flex flex-col gap-0">
                  {/* Step 1 — active */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7F56D9] flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#7F56D9]">Choose method</span>
                  </div>

                  {/* Vertical connector */}
                  <div className="ml-4 w-px h-8 bg-[#E9EAEB]" />

                  {/* Step 2 — inactive */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#D5D7DA] flex items-center justify-center shrink-0 bg-white">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D5D7DA]" />
                    </div>
                    <span className="text-sm font-medium text-[#717680]">Verify code</span>
                  </div>
                </div>

                {/* Right — method selection */}
                <div className="flex-1 px-6 py-6">
                  <p className="text-sm font-semibold text-[#181D27] mb-4">
                    Choose an authentication method
                  </p>

                  <div className="flex flex-col gap-3">
                    {TWO_FA_METHODS.map((m) => {
                      const checked = twoFAMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'border-[#7F56D9] bg-[#F9F5FF]'
                              : 'border-[#E9EAEB] bg-white hover:border-[#9E77ED]'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onChange={() => setTwoFAMethod(checked ? null : m.id)}
                          />
                          <span className="text-sm font-medium text-[#414651]">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {twoFAMethod && (
                    <div className="mt-5">
                      <Button size="md">
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FormRow>

          {/* ── Skills ─────────────────────────────────────────────────────── */}
          <FormRow
            label="Skills"
            sub="Add skills to help your team understand your expertise."
          >
            {/* Selected skills as cards */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {selectedIds.map((id) => {
                  const skill = allSkills.find((s) => s.id === id);
                  if (!skill) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E9EAEB] rounded-xl shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#F9F5FF] flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5l2.472 4.5H16.5l-3.986 3.375 1.514 5.25L9 12l-5.028 2.625 1.514-5.25L1.5 6h5.028L9 1.5z"
                            fill="#7F56D9" fillOpacity="0.15" stroke="#7F56D9" strokeWidth="1.25" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">{skill.name}</p>
                        <p className="text-xs text-[#717680]">5 years</p>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          className="p-1 rounded hover:bg-gray-100 text-[#717680] transition-colors"
                          title="Edit"
                        >
                          <Edit01 width={14} height={14} />
                        </button>
                        <button
                          onClick={() => toggleSkill(id)}
                          className="p-1 rounded hover:bg-red-50 text-[#717680] hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash01 width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unselected skills as add pills */}
            <div className="flex flex-wrap gap-2">
              {allSkills
                .filter((s) => !selectedIds.includes(s.id))
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

      {tab === 'projects' && (
        <div className="px-8 py-12 text-sm text-[#717680]">
          Project settings coming soon.
        </div>
      )}

      {/* Success toast */}
      {showToast && (
        <Toast
          message={toastMsg}
          subtitle=""
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Avatar crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onSave={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </main>
  );
}
