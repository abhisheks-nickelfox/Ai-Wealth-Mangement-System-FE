import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus01, Plus } from '@untitled-ui/icons-react';
import MultiSelect from '../components/ui/MultiSelect';
import InlineAddPanel from '../components/ui/InlineAddPanel';
import { ROLE_OPTIONS } from '../lib/constants';
import { useCreateUser } from '../hooks/useUsers';
import { useSkills, useCreateSkill } from '../hooks/useSkills';
import { useMemberRoles, useCreateMemberRole } from '../hooks/useMemberRoles';

type SystemRole = 'admin' | 'member' | 'project_manager';

// ── AddUserPage ───────────────────────────────────────────────────────────────

export default function AddUserPage() {
  const navigate = useNavigate();

  // Form state
  const [name,             setName]             = useState('');
  const [email,            setEmail]            = useState('');
  const [roles,            setRoles]            = useState<SystemRole[]>([]);
  const [selectedRoleIds,  setSelectedRoleIds]  = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Inline add panels
  const [showRoleForm,  setShowRoleForm]  = useState(false);
  const [roleAddError,  setRoleAddError]  = useState('');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillAddError, setSkillAddError] = useState('');

  // Submit error
  const [error, setError] = useState('');

  const isMember = roles.includes('member');

  // TanStack Query hooks
  const { data: memberRoles = [], isLoading: memberRolesLoading } = useMemberRoles();
  const { data: skills = [],      isLoading: skillsLoading }      = useSkills();
  const createUser       = useCreateUser();
  const createMemberRole = useCreateMemberRole();
  const createSkill      = useCreateSkill();

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleAddRole(vals: Record<string, string>) {
    if (!vals.name?.trim()) { setRoleAddError('Role name is required'); return; }
    setRoleAddError('');
    try {
      const created = await createMemberRole.mutateAsync(vals.name.trim());
      setSelectedRoleIds((prev) => [...prev, created.id]);
      setShowRoleForm(false);
    } catch (err) {
      setRoleAddError((err as Error).message);
    }
  }

  async function handleAddSkill(vals: Record<string, string>) {
    if (!vals.name?.trim()) { setSkillAddError('Skill name is required'); return; }
    setSkillAddError('');
    try {
      const created = await createSkill.mutateAsync({
        name: vals.name.trim(),
        category: vals.category?.trim() || undefined,
      });
      setSelectedSkillIds((prev) => [...prev, created.id]);
      setShowSkillForm(false);
    } catch (err) {
      setSkillAddError((err as Error).message);
    }
  }

  async function handleInvite() {
    if (!name.trim() || !email.trim() || roles.length === 0) {
      setError('Name, email and role are required.');
      return;
    }

    // Resolve selected member role name (first selected)
    const memberRoleName = isMember && selectedRoleIds.length > 0
      ? memberRoles.find((r) => r.id === selectedRoleIds[0])?.name
      : undefined;

    setError('');
    try {
      await createUser.mutateAsync({
        name:        name.trim(),
        email:       email.trim(),
        role:        roles[0],
        member_role: memberRoleName,
        skill_ids:   selectedSkillIds,
        status:      'invited',
      });
      navigate('/users', { state: { toastMessage: 'User invited successfully' } });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const addPageInputCls = 'w-full bg-white border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-base text-[#181D27] placeholder-[#717680] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent';

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-2xl">

        <h1 className="text-2xl font-semibold text-[#181D27] mb-8">Add a new user</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#414651]">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Team member" className={addPageInputCls} />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#414651]">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com" className={addPageInputCls} />
          </div>



          {/* System Role */}
          <MultiSelect
            label="Role"
            placeholder="Select role"
            options={ROLE_OPTIONS}
            value={roles}
            onChange={(vals) => setRoles(vals as SystemRole[])}
            columns={1}
          />

          {/* Member Role — visible only when system role = member */}
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
                  placeholder="Select or add a role"
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
                  <Plus width={14} height={14} />
                  Add new role to catalog
                </button>
              ) : (
                <InlineAddPanel
                  title="New member role"
                  fields={[{ key: 'name', placeholder: 'Role name *', required: true }]}
                  error={roleAddError}
                  saving={createMemberRole.isPending}
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
              <p className="text-sm text-[#717680]">Loading skills…</p>
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
                <Plus width={14} height={14} />
                Add new skill to catalog
              </button>
            ) : (
              <InlineAddPanel
                title="New skill"
                fields={[
                  { key: 'name',     placeholder: 'Skill name *',       required: true },
                  { key: 'category', placeholder: 'Category (optional)' },
                ]}
                error={skillAddError}
                saving={createSkill.isPending}
                onSave={handleAddSkill}
                onCancel={() => { setShowSkillForm(false); setSkillAddError(''); }}
              />
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleInvite}
            disabled={createUser.isPending}
            className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus01 width={18} height={18} />
            {createUser.isPending ? 'Sending invite…' : 'Invite'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#D5D7DA] text-[#414651] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>

      </div>
    </main>
  );
}
