import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trash01,
  Edit01,
  Settings01,
  DotsVertical,
  UserPlus01,
  Send01,
  XClose,
} from '@untitled-ui/icons-react';
import SearchInput from '../components/ui/SearchInput';
import Toast from '../components/ui/Toast';
import StatusBadge from '../components/users/StatusBadge';
import SkillBadge from '../components/users/SkillBadge';
import Avatar from '../components/ui/Avatar';
import Pagination from '../components/ui/Pagination';
import Checkbox from '../components/ui/Checkbox';
import { useUsers, useDeleteUser, useResendInvite, useUpdateUser } from '../hooks/useUsers';
import { useClickOutside } from '../hooks/useClickOutside';
import type { UserStatus } from '../types';
import { EXTRA_PERMISSIONS } from '../lib/constants';

const PAGE_SIZE = 6;

function ExtraPermissionsPopup({
  userId,
  permissions,
  onClose,
}: {
  userId: string;
  permissions: string[];
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  async function toggle(key: string) {
    const next = permissions.includes(key)
      ? permissions.filter((p) => p !== key)
      : [...permissions, key];
    try {
      await updateUser.mutateAsync({ id: userId, payload: { permissions: next } });
    } catch {
      // silent — user stays open
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-30 w-56 rounded-2xl bg-white shadow-xl border border-[#E9EAEB] p-4"
    >
      <p className="text-sm font-bold text-[#181D27] mb-3">Extra Permissions</p>
      <div className="flex flex-col gap-3">
        {EXTRA_PERMISSIONS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
            <Checkbox
              checked={permissions.includes(key)}
              onChange={() => toggle(key)}
            />
            <span className="text-sm font-semibold text-[#181D27]">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function DeleteUserModal({
  userName,
  open,
  deleting,
  onCancel,
  onConfirm,
}: {
  userName: string;
  open: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={deleting ? undefined : onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3F2]">
              <Trash01 width={20} height={20} className="text-[#D92D20]" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="rounded-lg p-1 text-[#717680] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XClose width={18} height={18} />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-[#181D27]">Delete user?</h2>
          <p className="mt-2 text-sm leading-6 text-[#535862]">
            <span className="font-medium text-[#181D27]">{userName}</span> will be removed from your team.
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[#E9EAEB] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 text-sm font-semibold text-[#414651] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-lg bg-[#D92D20] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusMenu({
  userId,
  status,
  onUpdated,
}: {
  userId: string;
  status: UserStatus;
  onUpdated: (message: string) => void;
}) {
  const updateUser = useUpdateUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setOpen(false));

  if (status === 'invited') {
    return <StatusBadge status={status} />;
  }

  const statusOptions: Array<Extract<UserStatus, 'Active' | 'Disabled'>> = ['Active', 'Disabled'];

  async function handleStatusChange(nextStatus: Extract<UserStatus, 'Active' | 'Disabled'>) {
    if (nextStatus === status) return;

    try {
      await updateUser.mutateAsync({
        id: userId,
        payload: { status: nextStatus },
      });
      setOpen(false);
      onUpdated(`User status changed to ${nextStatus}`);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div ref={menuRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => !updateUser.isPending && setOpen((value) => !value)}
        disabled={updateUser.isPending}
        className={`rounded-full ${updateUser.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <StatusBadge status={status} />
      </button>

      {open && !updateUser.isPending && (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[132px] rounded-lg border border-[#E9EAEB] bg-white p-1 shadow-lg">
          {statusOptions.map((option) => {
            const isCurrent = option === status;

            return (
              <button
                key={option}
                type="button"
                disabled={isCurrent}
                onClick={() => handleStatusChange(option)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isCurrent
                    ? 'cursor-not-allowed bg-gray-50 text-[#A4A7AE]'
                    : 'text-[#414651] hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: users = [], isLoading: loading, error: fetchErrorObj } = useUsers();
  const fetchError = fetchErrorObj ? (fetchErrorObj as Error).message : '';
  const deleteUser   = useDeleteUser();
  const resendInvite = useResendInvite();

  const [selected,     setSelected]    = useState<Set<string>>(new Set());
  const [currentPage,  setCurrentPage] = useState(1);
  const [search,       setSearch]      = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(
    (location.state as { toastMessage?: string } | null)?.toastMessage ?? null
  );
  const [userPendingDelete, setUserPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [permissionsOpenFor, setPermissionsOpenFor] = useState<string | null>(null);

  // ── Search filter ─────────────────────────────────────────────────────────────
  const needle = search.trim().toLowerCase();
  const filteredUsers = needle
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle),
      )
    : users;

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageStart   = (currentPage - 1) * PAGE_SIZE;
  const pageMembers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const isAllSelected = pageMembers.length > 0 && pageMembers.every((m) => selected.has(m.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        pageMembers.forEach((m) => next.delete(m.id));
      } else {
        pageMembers.forEach((m) => next.add(m.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Resend invite ─────────────────────────────────────────────────────────────
  async function handleResendInvite(id: string) {
    try {
      await resendInvite.mutateAsync(id);
      setToastMessage('Invite resent successfully');
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  function promptDelete(id: string, name: string) {
    setUserPendingDelete({ id, name });
  }

  async function handleDeleteConfirm() {
    if (!userPendingDelete) return;

    try {
      await deleteUser.mutateAsync(userPendingDelete.id);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(userPendingDelete.id);
        return n;
      });
      setUserPendingDelete(null);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#181D27]">Team</h1>
          <p className="text-sm text-[#535862] mt-1">
            Manage your team members and their account permissions here.
          </p>
        </div>
        <button
          onClick={() => navigate('/users/new')}
          className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <UserPlus01 width={18} height={18} />
          Invite Team
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#E9EAEB] rounded-xl shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[#181D27] shrink-0">Team members</h2>
            {!loading && (
              <span className="bg-[#F9F5FF] border border-[#E9D7FE] text-[#6941C6] text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </span>
            )}
          </div>
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or email…"
            className="w-72"
          />
          <button className="text-[#717680] hover:text-[#414651] p-1 shrink-0">
            <DotsVertical width={20} height={20} />
          </button>
        </div>

        <div className="border-b border-[#E9EAEB] mt-5" />

        {/* Loading / error / table */}
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-[#717680]">Loading…</div>
        ) : fetchError ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">{fetchError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-[#E9EAEB]">
                  <th className="px-6 py-3 text-left w-[280px]">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isAllSelected} onChange={toggleAll} />
                      <span className="text-xs font-semibold text-[#717680]">Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left w-[120px]">
                    <span className="text-xs font-semibold text-[#717680]">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left w-[176px]">
                    <span className="text-xs font-semibold text-[#717680]">Role</span>
                  </th>
                  <th className="px-6 py-3 text-left w-[224px]">
                    <span className="text-xs font-semibold text-[#717680]">Email address</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-[#717680]">Skills</span>
                  </th>
                  <th className="px-6 py-3 w-[124px]" />
                </tr>
              </thead>
              <tbody>
                {pageMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#717680]">
                      {needle ? `No members match "${search}".` : 'No team members yet.'}
                    </td>
                  </tr>
                ) : (
                  pageMembers.map((user, idx) => {
                    const isEven    = idx % 2 === 0;
                    const isChecked = selected.has(user.id);
                    // For invited users the name is the email until onboarding is done
                    const displayName = (user.name && user.name !== user.email)
                      ? user.name
                      : user.email;
                    const displayRole = user.role.replace(/_/g, ' ');
                    const SKILL_PREVIEW = 3;
                    const visibleSkills = user.skills.slice(0, SKILL_PREVIEW);
                    const extraCount    = user.skills.length - SKILL_PREVIEW;
                    const rateDisplay = user.rate_amount
                      ? `$${user.rate_amount}/${user.rate_frequency ?? 'Weekly'}`
                      : '—';

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-[#E9EAEB] ${isEven ? 'bg-[#FDFDFD]' : 'bg-white'}`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4 h-[72px]">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onChange={() => toggleOne(user.id)} />
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar_url ?? undefined} name={displayName} />
                              <div>
                                <p className="text-sm font-medium text-[#181D27] whitespace-nowrap">
                                  {displayName}
                                </p>
                                <p className="text-sm text-[#535862] whitespace-nowrap">
                                  {rateDisplay}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusMenu
                            userId={user.id}
                            status={user.status}
                            onUpdated={setToastMessage}
                          />
                        </td>

                        {/* Role / Title */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#535862] whitespace-nowrap capitalize">
                            {displayRole}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#535862] whitespace-nowrap">{user.email}</p>
                        </td>

                        {/* Skills */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {visibleSkills.map((skill) => (
                              <SkillBadge key={skill.id} label={skill.name} />
                            ))}
                            {extraCount > 0 && (
                              <span className="bg-[#FAFAFA] border border-[#E9EAEB] text-[#414651] text-xs font-medium px-2 py-0.5 rounded-full">
                                +{extraCount}
                              </span>
                            )}
                            {user.skills.length === 0 && (
                              <span className="text-xs text-[#A4A7AE]">—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Resend invite — visible only for invited users */}
                            <button
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resendInvite.isPending}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.status === 'invited'
                                  ? 'hover:bg-gray-100 text-[#717680] hover:text-[#6941C6] disabled:opacity-40'
                                  : 'invisible pointer-events-none'
                              }`}
                              title="Resend invite"
                              aria-hidden={user.status !== 'invited'}
                            >
                              <Send01 width={16} height={16} />
                            </button>

                            {/* Extra Permissions popup */}
                            <div className="relative">
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors"
                                title="Extra permissions"
                                onClick={() =>
                                  setPermissionsOpenFor((prev) =>
                                    prev === user.id ? null : user.id
                                  )
                                }
                              >
                                <Settings01 width={16} height={16} />
                              </button>
                              {permissionsOpenFor === user.id && (
                                <ExtraPermissionsPopup
                                  userId={user.id}
                                  permissions={user.permissions ?? []}
                                  onClose={() => setPermissionsOpenFor(null)}
                                />
                              )}
                            </div>

                            {/* Edit — navigates to UserSettingsPage */}
                            <button
                              onClick={() => navigate(`/users/${user.id}/settings`)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors"
                              title="Edit user"
                            >
                              <Edit01 width={16} height={16} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => promptDelete(user.id, displayName)}
                              disabled={deleteUser.isPending}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-red-600 disabled:opacity-40 transition-colors"
                              title="Delete user"
                            >
                              <Trash01 width={16} height={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !fetchError && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        )}
      </div>

      {/* Success toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          subtitle="The team member has been notified by email."
          onClose={() => setToastMessage(null)}
        />
      )}

      <DeleteUserModal
        open={!!userPendingDelete}
        userName={userPendingDelete?.name ?? 'this user'}
        deleting={deleteUser.isPending}
        onCancel={() => setUserPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}
