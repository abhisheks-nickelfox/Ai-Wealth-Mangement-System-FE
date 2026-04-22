import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trash01,
  Edit01,
  Settings01,
  DotsVertical,
  ArrowLeft,
  ArrowRight,
  UserPlus01,
  Send01,
} from '@untitled-ui/icons-react';
import Toast from '../components/ui/Toast';
import StatusBadge from '../components/users/StatusBadge';
import SkillBadge from '../components/users/SkillBadge';
import Avatar from '../components/ui/Avatar';
import EditUserDrawer from '../components/users/EditUserDrawer';
import type { User } from '../lib/api';
import { useUsers, useDeleteUser, useResendInvite } from '../hooks/useUsers';

const PAGE_SIZE = 6;

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: users = [], isLoading: loading, error: fetchErrorObj } = useUsers();
  const fetchError = fetchErrorObj ? (fetchErrorObj as Error).message : '';
  const deleteUser    = useDeleteUser();
  const resendInvite  = useResendInvite();

  const [selected,     setSelected]    = useState<Set<string>>(new Set());
  const [currentPage,  setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(
    (location.state as { toastMessage?: string } | null)?.toastMessage ?? null
  );
  const [editUser,     setEditUser]    = useState<User | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageStart   = (currentPage - 1) * PAGE_SIZE;
  const pageMembers = users.slice(pageStart, pageStart + PAGE_SIZE);

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

  // ── Edit saved ───────────────────────────────────────────────────────────────
  function handleUserSaved(_updated: User) {
    setToastMessage('Profile updated successfully');
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
  async function handleDelete(id: string) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser.mutateAsync(id);
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ── Page number pills ─────────────────────────────────────────────────────────
  function buildPageNumbers(page: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (page >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', page - 1, page, page + 1, '...', total];
  }

  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#181D27]">Team members</h2>
              {!loading && (
                <span className="bg-[#F9F5FF] border border-[#E9D7FE] text-[#6941C6] text-xs font-medium px-2 py-0.5 rounded-full">
                  {users.length} {users.length === 1 ? 'user' : 'users'}
                </span>
              )}
            </div>
          </div>
          <button className="text-[#717680] hover:text-[#414651] p-1">
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
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-[#717680]">Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left w-[120px]">
                    <span className="text-xs font-semibold text-[#717680]">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left w-[176px]">
                    <span className="text-xs font-semibold text-[#717680]">Role / Title</span>
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
                      No team members yet.
                    </td>
                  </tr>
                ) : (
                  pageMembers.map((user, idx) => {
                    const isEven   = idx % 2 === 0;
                    const isChecked = selected.has(user.id);
                    const displayRole = user.member_role ?? user.role;
                    const SKILL_PREVIEW = 3;
                    const visibleSkills = user.skills.slice(0, SKILL_PREVIEW);
                    const extraCount    = user.skills.length - SKILL_PREVIEW;

                    // Derive @handle from email local part
                    const handle = '@' + user.email.split('@')[0];

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-[#E9EAEB] ${isEven ? 'bg-[#FDFDFD]' : 'bg-white'}`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4 h-[72px]">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOne(user.id)}
                              className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer shrink-0"
                            />
                            <div className="flex items-center gap-3">
                              <Avatar name={user.name} />
                              <div>
                                <p className="text-sm font-medium text-[#181D27] whitespace-nowrap">
                                  {user.name}
                                </p>
                                <p className="text-sm text-[#535862] whitespace-nowrap">
                                  {handle}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={user.status} />
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

                        {/* Actions — fixed 4-slot row; resend is invisible when not applicable
                             so Settings + Edit + Delete stay pinned at the same position every row */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Slot 1: Resend invite — visible only for invited users */}
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

                            {/* Slot 2: Settings */}
                            <button
                              onClick={() => navigate(`/users/${user.id}/settings`)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors"
                              title="User settings"
                            >
                              <Settings01 width={16} height={16} />
                            </button>

                            {/* Slot 3: Edit */}
                            <button
                              onClick={() => setEditUser(user)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#717680] hover:text-[#414651] transition-colors"
                              title="Edit user"
                            >
                              <Edit01 width={16} height={16} />
                            </button>

                            {/* Slot 4: Delete */}
                            <button
                              onClick={() => handleDelete(user.id)}
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
          <div className="flex items-center justify-between px-6 pt-3 pb-4 border-t border-[#E9EAEB]">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 bg-white border border-[#E9EAEB] text-sm font-semibold text-[#414651] px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 disabled:text-[#A4A7AE] disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft width={18} height={18} />
              Previous
            </button>

            <div className="flex items-center gap-0.5">
              {pageNumbers.map((page, i) => (
                <button
                  key={typeof page === 'number' ? page : `ellipsis-${i}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === '...'}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors
                    ${page === currentPage
                      ? 'bg-[#FAFAFA] text-[#414651]'
                      : page === '...'
                      ? 'text-[#717680] cursor-default'
                      : 'text-[#717680] hover:bg-gray-50'}
                  `}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 bg-white border border-[#D5D7DA] text-sm font-semibold text-[#414651] px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 disabled:text-[#A4A7AE] disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight width={18} height={18} />
            </button>
          </div>
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

      {/* Edit slide-over */}
      <EditUserDrawer
        user={editUser}
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        onSaved={handleUserSaved}
      />
    </main>
  );
}
