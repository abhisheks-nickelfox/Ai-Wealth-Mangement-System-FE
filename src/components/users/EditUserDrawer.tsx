import { useState, useEffect, useMemo } from 'react';
import { Save01, Plus, Trash01 } from '@untitled-ui/icons-react';
import SlideOver from '../ui/SlideOver';
import MultiSelect from '../ui/MultiSelect';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import InlineAddPanel from '../ui/InlineAddPanel';
import type { User } from '../../lib/api';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../../lib/constants';
import { useUser, useUpdateUser } from '../../hooks/useUsers';
import { useSkills, useCreateSkill } from '../../hooks/useSkills';
import { useMemberRoles, useCreateMemberRole } from '../../hooks/useMemberRoles';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkillEntry {
  id:         string;
  experience: string;
}

interface EditUserDrawerProps {
  user:    User | null;
  open:    boolean;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

// ── EditUserDrawer ─────────────────────────────────────────────────────────────

export default function EditUserDrawer({ user, open, onClose, onSaved }: EditUserDrawerProps) {
  // Form state
  const [name,            setName]            = useState('');
  const [roles,           setRoles]           = useState<string[]>([]);
  const [status,          setStatus]          = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedSkills,  setSelectedSkills]  = useState<SkillEntry[]>([]);
  const [error,           setError]           = useState('');
  const [skillErrors,     setSkillErrors]     = useState<Record<string, boolean>>({});

  // Inline add panels
  const [showRoleForm,  setShowRoleForm]  = useState(false);
  const [roleAddError,  setRoleAddError]  = useState('');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillAddError, setSkillAddError] = useState('');

  // TanStack Query hooks
  const { data: liveUser }                                   = useUser(user?.id ?? '');
  const { data: memberRoles = [], isLoading: memberRolesLoading } = useMemberRoles();
  const { data: skills = [],      isLoading: skillsLoading }      = useSkills();
  const updateUser       = useUpdateUser();
  const createMemberRole = useCreateMemberRole();
  const createSkill      = useCreateSkill();

  const isMember = roles.includes('member');

  // Sync form state when drawer opens or liveUser changes
  useEffect(() => {
    if (!open) return;
    const u = liveUser ?? user;
    if (!u) return;
    setName(u.name);
    setRoles([u.role]);
    setStatus([u.status]);
    setSelectedSkills(
      u.skills.map((s) => ({
        id:         s.id,
        experience: (s as typeof s & { experience?: string | null }).experience ?? '',
      })),
    );
    setError('');
    setSkillErrors({});
    setShowRoleForm(false);
    setShowSkillForm(false);
  }, [open, liveUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set member role selection after catalogs + live user are both ready
  useEffect(() => {
    const u = liveUser ?? user;
    if (!u || memberRolesLoading) return;
    if (u.member_role) {
      const match = memberRoles.find((r) => r.name === u.member_role);
      setSelectedRoleIds(match ? [match.id] : []);
    } else {
      setSelectedRoleIds([]);
    }
  }, [liveUser, memberRoles, memberRolesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skill helpers ───────────────────────────────────────────────────────────

  // Called by MultiSelect when the set of selected skill IDs changes
  function handleSkillIdsChange(ids: string[]) {
    setSelectedSkills((prev) => {
      // Keep existing entries (preserve experience already set)
      const kept   = prev.filter((e) => ids.includes(e.id));
      const keptIds = new Set(kept.map((e) => e.id));
      // Add entries for newly added skill IDs with blank experience
      const added  = ids.filter((id) => !keptIds.has(id)).map((id) => ({ id, experience: '' }));
      return [...kept, ...added];
    });
    // Clear errors for deselected skills
    setSkillErrors((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((id) => { if (!ids.includes(id)) delete next[id]; });
      return next;
    });
  }

  function setExperience(skillId: string, exp: string) {
    setSelectedSkills((prev) =>
      prev.map((e) => (e.id === skillId ? { ...e, experience: exp } : e)),
    );
    if (exp) setSkillErrors((prev) => { const n = { ...prev }; delete n[skillId]; return n; });
  }

  function removeSkill(skillId: string) {
    setSelectedSkills((prev) => prev.filter((e) => e.id !== skillId));
    setSkillErrors((prev) => { const n = { ...prev }; delete n[skillId]; return n; });
  }

  // ── Catalog add handlers ────────────────────────────────────────────────────

  async function handleAddRole(vals: Record<string, string>) {
    if (!vals.name?.trim()) { setRoleAddError('Role name is required'); return; }
    setRoleAddError('');
    try {
      const created = await createMemberRole.mutateAsync(vals.name.trim());
      setSelectedRoleIds((p) => [...p, created.id]);
      setShowRoleForm(false);
    } catch (e) { setRoleAddError((e as Error).message); }
  }

  async function handleAddSkill(vals: Record<string, string>) {
    if (!vals.name?.trim()) { setSkillAddError('Skill name is required'); return; }
    setSkillAddError('');
    try {
      const created = await createSkill.mutateAsync({ name: vals.name.trim(), category: vals.category?.trim() || undefined });
      setSelectedSkills((p) => [...p, { id: created.id, experience: '' }]);
      setShowSkillForm(false);
    } catch (e) { setSkillAddError((e as Error).message); }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const u = liveUser ?? user;
    if (!u) return;
    if (!name.trim() || roles.length === 0 || status.length === 0) {
      setError('Name, role and status are required.');
      return;
    }

    // Validate that every selected skill has an experience level
    const missing: Record<string, boolean> = {};
    selectedSkills.forEach((e) => { if (!e.experience) missing[e.id] = true; });
    if (Object.keys(missing).length > 0) {
      setSkillErrors(missing);
      setError('Please enter an experience level for each skill.');
      return;
    }

    const memberRoleName = isMember && selectedRoleIds.length > 0
      ? memberRoles.find((r) => r.id === selectedRoleIds[0])?.name
      : undefined;

    setError('');
    setSkillErrors({});
    try {
      const updated = await updateUser.mutateAsync({
        id: u.id,
        payload: {
          name:        name.trim(),
          role:        roles[0] as 'admin' | 'member',
          member_role: memberRoleName ?? (isMember ? undefined : ''),
          status:      status[0] as User['status'],
          skills_with_experience: selectedSkills.map((e) => ({
            skill_id:   e.id,
            experience: e.experience || null,
          })),
        },
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ── Option lists ────────────────────────────────────────────────────────────

  const memberRoleOptions = useMemo(
    () => memberRoles.map((r) => ({ value: r.id, label: r.name })),
    [memberRoles],
  );
  const skillOptions = useMemo(
    () => skills.map((s) => ({
      value: s.id,
      label: s.category ? `${s.name} (${s.category})` : s.name,
    })),
    [skills],
  );

  const selectedSkillIds = selectedSkills.map((e) => e.id);
  const displayUser      = liveUser ?? user;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Edit team member"
      subtitle={displayUser ? `Updating ${displayUser.name}'s profile` : undefined}
    >
      {displayUser && (
        <div className="flex flex-col gap-5">

          {/* Avatar preview */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#F2F4F7]">
            <Avatar name={displayUser.name} size="lg" />
            <div>
              <p className="text-sm font-semibold text-[#181D27]">{displayUser.name}</p>
              <p className="text-sm text-[#717680]">{displayUser.email}</p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />

          {/* Status */}
          <MultiSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(vals) => { if (vals.length > 0) setStatus(vals.slice(-1)); }}
            columns={1}
          />

          {/* System Role */}
          <MultiSelect
            label="Role"
            options={ROLE_OPTIONS}
            value={roles}
            onChange={(vals) => { if (vals.length > 0) setRoles(vals.slice(-1)); }}
            columns={1}
          />

          {/* Member Role — visible when role = member */}
          {isMember && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#414651]">
                Member Role
                <span className="ml-1 text-[#717680] font-normal">(job title)</span>
              </label>
              {memberRolesLoading ? (
                <p className="text-sm text-[#717680]">Loading…</p>
              ) : (
                <MultiSelect
                  placeholder="Select a role"
                  options={memberRoleOptions}
                  value={selectedRoleIds}
                  onChange={setSelectedRoleIds}
                  columns={1}
                  searchable
                  searchPlaceholder="Search roles…"
                />
              )}
              {!showRoleForm ? (
                <button type="button" onClick={() => setShowRoleForm(true)}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6941C6] hover:text-[#53389E] font-medium">
                  <Plus width={13} height={13} /> Add new role
                </button>
              ) : (
                <InlineAddPanel
                  title="New member role"
                  fields={[{ key: 'name', placeholder: 'Role name *' }]}
                  error={roleAddError} saving={createMemberRole.isPending}
                  onSave={handleAddRole}
                  onCancel={() => { setShowRoleForm(false); setRoleAddError(''); }}
                />
              )}
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#414651]">Skills</label>
            {skillsLoading ? (
              <p className="text-sm text-[#717680]">Loading…</p>
            ) : (
              <MultiSelect
                placeholder="Select skills"
                options={skillOptions}
                value={selectedSkillIds}
                onChange={handleSkillIdsChange}
                columns={2}
                showBadges
                searchable
                searchPlaceholder="Search skills…"
              />
            )}

            {/* Per-skill experience rows */}
            {selectedSkills.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {selectedSkills.map((entry) => {
                  const skill   = skills.find((s) => s.id === entry.id);
                  const hasError = skillErrors[entry.id];
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                        hasError ? 'border-red-300 bg-red-50' : 'border-[#E9EAEB] bg-[#FAFAFA]'
                      }`}
                    >
                      {/* Skill name */}
                      <span className="text-sm font-medium text-[#181D27] flex-1 truncate">
                        {skill?.name ?? entry.id}
                      </span>

                      {/* Experience input */}
                      <input
                        type="text"
                        value={entry.experience}
                        onChange={(e) => setExperience(entry.id, e.target.value)}
                        placeholder="e.g. 2-5 years"
                        className={`text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E77ED] bg-white transition-colors w-32 ${
                          hasError
                            ? 'border-red-300 text-red-600'
                            : 'border-[#D5D7DA] text-[#414651]'
                        }`}
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeSkill(entry.id)}
                        className="p-1 rounded hover:bg-red-100 text-[#717680] hover:text-red-600 transition-colors shrink-0"
                        aria-label={`Remove ${skill?.name}`}
                      >
                        <Trash01 width={14} height={14} />
                      </button>
                    </div>
                  );
                })}
                {Object.keys(skillErrors).length > 0 && (
                  <p className="text-xs text-red-600">
                    Experience level is required for all selected skills.
                  </p>
                )}
              </div>
            )}

            {!showSkillForm ? (
              <button type="button" onClick={() => setShowSkillForm(true)}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6941C6] hover:text-[#53389E] font-medium">
                <Plus width={13} height={13} /> Add new skill
              </button>
            ) : (
              <InlineAddPanel
                title="New skill"
                fields={[
                  { key: 'name',     placeholder: 'Skill name *' },
                  { key: 'category', placeholder: 'Category (optional)' },
                ]}
                error={skillAddError} saving={createSkill.isPending}
                onSave={handleAddSkill}
                onCancel={() => { setShowSkillForm(false); setSkillAddError(''); }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-[#F2F4F7]">
            <button type="button" onClick={handleSave} disabled={updateUser.isPending}
              className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
              <Save01 width={16} height={16} />
              {updateUser.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#D5D7DA] text-[#414651] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
              Cancel
            </button>
          </div>

        </div>
      )}
    </SlideOver>
  );
}
