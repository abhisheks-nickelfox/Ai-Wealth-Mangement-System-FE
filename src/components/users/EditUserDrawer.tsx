import { useState, useEffect, useMemo } from 'react';
import { Save01, Plus } from '@untitled-ui/icons-react';
import SlideOver from '../ui/SlideOver';
import MultiSelect from '../ui/MultiSelect';
import Avatar from '../ui/Avatar';
import InlineAddPanel from '../ui/InlineAddPanel';
import type { User } from '../../lib/api';
import { ROLE_OPTIONS, STATUS_OPTIONS, inputCls } from '../../lib/constants';
import { useUser, useUpdateUser } from '../../hooks/useUsers';
import { useSkills, useCreateSkill } from '../../hooks/useSkills';
import { useMemberRoles, useCreateMemberRole } from '../../hooks/useMemberRoles';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditUserDrawerProps {
  user: User | null;
  open: boolean;
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
  const [selectedSkillIds,setSelectedSkillIds]= useState<string[]>([]);
  const [error,           setError]           = useState('');

  // Inline add panels
  const [showRoleForm,  setShowRoleForm]  = useState(false);
  const [roleAddError,  setRoleAddError]  = useState('');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillAddError, setSkillAddError] = useState('');

  // TanStack Query hooks
  const { data: liveUser } = useUser(user?.id ?? '');
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
    setRoles([u.role === 'super_admin' ? 'admin' : u.role]);
    setStatus([u.status]);
    setSelectedSkillIds(u.skills.map((s) => s.id));
    setError('');
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
      setSelectedSkillIds((p) => [...p, created.id]);
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

    const memberRoleName = isMember && selectedRoleIds.length > 0
      ? memberRoles.find((r) => r.id === selectedRoleIds[0])?.name
      : undefined;

    setError('');
    try {
      const updated = await updateUser.mutateAsync({
        id: u.id,
        payload: {
          name:        name.trim(),
          role:        roles[0] as 'admin' | 'member',
          member_role: memberRoleName ?? (isMember ? undefined : ''),
          status:      status[0] as User['status'],
          skill_ids:   selectedSkillIds,
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
    [memberRoles]
  );
  const skillOptions = useMemo(
    () => skills.map((s) => ({
      value: s.id,
      label: s.category ? `${s.name} (${s.category})` : s.name,
    })),
    [skills]
  );

  const displayUser = liveUser ?? user;

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

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#414651]">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name" className={inputCls} />
          </div>

          {/* Status */}
          <MultiSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            columns={1}
          />

          {/* System Role */}
          <MultiSelect
            label="Role"
            options={ROLE_OPTIONS}
            value={roles}
            onChange={setRoles}
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
                onChange={setSelectedSkillIds}
                columns={2}
                showBadges
                searchable
                searchPlaceholder="Search skills…"
              />
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
