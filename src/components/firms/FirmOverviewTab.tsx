import { useState } from 'react';
import { ChevronDown, Edit01, Trash01 } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import iconDropbox  from '../../assets/quick-links/icon-dropbox.svg';
import iconReports  from '../../assets/quick-links/icon-reports.svg';
import iconHubspot  from '../../assets/quick-links/icon-hubspot.svg';
import iconPhone    from '../../assets/contact-icons/icon-phone.svg';
import iconMail     from '../../assets/contact-icons/icon-mail.svg';
import iconCalendar from '../../assets/contact-icons/icon-calendar.svg';
import type { Firm, User } from '../../lib/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface FirmDetailsTabProps {
  firm: Firm;
  users: User[];
}

// ── Mock chat messages (grouped: before "Today" separator and after) ──────────

export const MESSAGES_BEFORE: { id: number; sender: string; time: string; text: string; isSelf: boolean }[] = [
  { id: 1, sender: 'You',           time: 'Thursday 11:41am', text: 'Awesome! Thanks.',                                   isSelf: true  },
  { id: 2, sender: 'Demi Wilkinson', time: 'Thursday 11:44am', text: 'Good timing—was just looking at this.',              isSelf: false },
];

export const MESSAGES_TODAY: { id: number; sender: string; time: string; text: string; isSelf: boolean }[] = [
  { id: 3, sender: 'Phoenix Baker',  time: 'Friday 2:20pm',    text: 'Hey Olivia, can you please review the latest design?', isSelf: false },
  { id: 4, sender: 'You',            time: 'Friday 2:20pm',    text: "Sure thing, I'll have a look today.",                isSelf: true  },
];

// ── Reusable contact row (avatar + name/role + phone/mail/calendar) ───────────

export interface ContactRowProps {
  name: string;
  role?: string | null;
  avatarSrc?: string;
  phone?: string | null;
  email?: string | null;
}

export function ContactRow({ name, role, avatarSrc, phone, email }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3 mt-2.5">
      <Avatar name={name} src={avatarSrc} size="sm" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#7c3aed] truncate">{name}</p>
        {role && <p className="text-[12px] text-[#6b7280] truncate mt-0.5">{role}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <a
          href={phone ? `tel:${phone}` : '#'}
          onClick={!phone ? (e) => e.preventDefault() : undefined}
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Call"
        >
          <img src={iconPhone} alt="" width={13} height={13} />
        </a>
        <a
          href={email ? `mailto:${email}` : '#'}
          onClick={!email ? (e) => e.preventDefault() : undefined}
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Email"
        >
          <img src={iconMail} alt="" width={13} height={13} />
        </a>
        <button
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Schedule meeting"
        >
          <img src={iconCalendar} alt="" width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

// ── Double-check SVG ──────────────────────────────────────────────────────────

export function DoubleCheck() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
      <path d="M1 5L4.5 8.5L10 2" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5L9.5 8.5L15 2" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Coming soon placeholder ───────────────────────────────────────────────────

export function ComingSoon() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-[#A4A7AE]">Coming soon</p>
    </div>
  );
}

// ── OverviewTab ───────────────────────────────────────────────────────────────

export function OverviewTab({ firm, users, onEditFirm, onDeleteFirm }: FirmDetailsTabProps & { onEditFirm: () => void; onDeleteFirm: () => void }) {
  const [commTab,     setCommTab]     = useState<'communications' | 'requests'>('communications');
  const [actionsOpen, setActionsOpen] = useState(false);

  const accountManager = users.find((u) => u.id === firm.account_manager_id) ?? null;
  const firmHref = firm.website
    ? (firm.website.startsWith('http') ? firm.website : `https://${firm.website}`)
    : '#';

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-white">

      {/* ── Left: main content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-10 py-6 min-w-0">

        {/* Firm header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Initials — 36×36 */}
            {firm.logo_url ? (
              <img
                src={firm.logo_url}
                alt={firm.name}
                className="w-9 h-9 rounded-lg object-cover border border-[#e5e7eb] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[#3538CD]">{firm.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span
              className="font-bold text-[#0f172a]"
              style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
            >
              {firm.name}
            </span>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="border border-[#e5e7eb] rounded-lg px-3.5 py-[7px] text-[13px] font-medium text-[#0f172a] bg-white flex items-center gap-2"
            >
              Actions
              <ChevronDown width={14} height={14} aria-hidden="true" />
            </button>
            <DropdownMenu
              open={actionsOpen}
              onClose={() => setActionsOpen(false)}
              align="right"
              items={[
                {
                  label: 'Edit firm',
                  icon: <Edit01 width={14} height={14} className="text-[#6b7280]" aria-hidden="true" />,
                  onClick: () => { setActionsOpen(false); onEditFirm(); },
                },
                {
                  label: 'Delete firm',
                  icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                  onClick: () => { setActionsOpen(false); onDeleteFirm(); },
                  variant: 'danger',
                },
              ]}
            />
          </div>
        </div>

        {/* About this firm */}
        <p className="text-[12.5px] font-semibold text-[#0f172a] mt-3.5 mb-1.5">About this firm</p>
        <p className="text-[13px] leading-[1.55] text-[#6b7280] max-w-[540px]">
          {firm.description || 'No description provided.'}
        </p>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 mt-[30px] mb-[18px]">
          {(['communications', 'requests'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCommTab(t)}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg cursor-pointer transition-colors ${
                commTab === t
                  ? 'bg-[#f3f4f6] text-[#0f172a]'
                  : 'text-[#6b7280] hover:text-[#0f172a]'
              }`}
            >
              {t === 'communications' ? 'Communications' : 'Requests'}
            </button>
          ))}
        </div>

        {/* Chat area */}
        {commTab === 'communications' ? (
          <div className="flex flex-col gap-[22px]">
            {/* Messages before today */}
            {MESSAGES_BEFORE.map((msg) => (
              msg.isSelf ? (
                /* "me" message — right-aligned */
                <div key={msg.id} className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium text-[#6b7280]">{msg.sender}</span>
                    <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    <DoubleCheck />
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* "them" message — left-aligned */
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={msg.sender} size="sm" />
                    <span
                      className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]"
                      style={{ width: 10, height: 10 }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#f4f5f7] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-[#0f172a]">{msg.sender}</span>
                      <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              )
            ))}

            {/* "Today" day separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#eef0f3]" />
              <span className="text-[12.5px] text-[#6b7280] font-medium">Today</span>
              <div className="flex-1 h-px bg-[#eef0f3]" />
            </div>

            {/* Messages today */}
            {MESSAGES_TODAY.map((msg) => (
              msg.isSelf ? (
                <div key={msg.id} className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium text-[#6b7280]">{msg.sender}</span>
                    <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    <DoubleCheck />
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={msg.sender} size="sm" />
                    <span
                      className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]"
                      style={{ width: 10, height: 10 }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#f4f5f7] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-[#0f172a]">{msg.sender}</span>
                      <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#9ca3af]">No requests yet.</p>
        )}
      </div>

      {/* ── Right sidebar — exactly 320px ────────────────────────────────── */}
      <aside className="w-[420px] shrink-0 overflow-y-auto overflow-x-hidden px-8 py-6">

        {/* Card 1 — firm details */}
        <div className="border border-[#e5e7eb] rounded-[12px] bg-white" style={{ padding: '18px 18px 20px' }}>

          {/* Location */}
          {firm.location && (
            <div style={{ marginBottom: 14 }}>
              <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Location</p>
              <div className="flex items-center gap-2 text-[13px] text-[#0f172a]">
                <span aria-hidden="true">🌏</span>
                <span>{firm.location}</span>
              </div>
            </div>
          )}

          {/* Website */}
          {firm.website && (
            <div style={{ marginBottom: 14 }}>
              <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Website</p>
              <a
                href={firmHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#7c3aed] hover:underline max-w-full overflow-hidden"
              >
                <span className="truncate">{firm.website.replace(/^https?:\/\//, '')}</span>
                {/* External link arrow (12px) */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}

          {/* Point of Contact */}
          <div style={{ marginBottom: 14 }}>
            <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Point of Contact</p>
            {firm.contact_name ? (
              <ContactRow
                name={firm.contact_name}
                role={firm.contact_role}
                phone={firm.contact_phone}
                email={firm.contact_email}
              />
            ) : (
              <p className="text-[12px] text-[#9ca3af] mt-1">Not set</p>
            )}
          </div>

          {/* MW Accounts Manager — last field, no bottom margin */}
          <div>
            <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">MW Accounts Manager</p>
            {accountManager ? (
              <ContactRow
                name={
                  accountManager.first_name && accountManager.last_name
                    ? `${accountManager.first_name} ${accountManager.last_name}`
                    : accountManager.name
                }
                role={accountManager.member_role}
                avatarSrc={accountManager.avatar_url ?? undefined}
                email={accountManager.email}
              />
            ) : (
              <p className="text-[12px] text-[#9ca3af] mt-1">Not assigned</p>
            )}
          </div>
        </div>

        {/* Card 2 — Quick Links */}
        <div className="border border-[#e5e7eb] rounded-[12px] bg-white mt-4" style={{ padding: '18px 18px 20px' }}>
          <p className="text-[13px] font-semibold text-[#0f172a] mb-3.5">Quick Links</p>

          {/* DropBox */}
          <button className="w-full flex items-center gap-3 text-left group">
            <img src={iconDropbox} alt="Dropbox" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">DropBox</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">Access files and assets</p>
            </div>
          </button>

          {/* Reports */}
          <button className="w-full flex items-center gap-3 text-left group mt-3.5">
            <img src={iconReports} alt="Reports" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">Reports</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">View and Analyse</p>
            </div>
          </button>

          {/* Hubspot */}
          <button className="w-full flex items-center gap-3 text-left group mt-3.5">
            <img src={iconHubspot} alt="HubSpot" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">Hubspot</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">Access Client hubspot</p>
            </div>
          </button>
        </div>

      </aside>
    </div>
  );
}
