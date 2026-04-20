import { useState } from 'react';
import { FilterLines, SearchLg, X } from '@untitled-ui/icons-react';
import Avatar from '../components/ui/Avatar';

// ── Types ──────────────────────────────────────────────────────────────────────

interface InboxItem {
  id: string;
  name: string;
  avatar?: string;
  timeAgo: string;
  action: string;
  linkText: string;
  tags: string[];
  unread: boolean;
  online?: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INBOX_ITEMS: InboxItem[] = [
  {
    id: '1',
    name: 'Phoenix Baker',
    timeAgo: 'Just now',
    action: 'Added 3 labels to the project',
    linkText: 'Marketing site redesign',
    tags: ['Design', 'Product', 'Marketing'],
    unread: true,
    online: false,
  },
  {
    id: '2',
    name: 'Lana Steiner',
    timeAgo: '2 mins ago',
    action: 'Invited',
    linkText: 'Alisa Hester',
    tags: ['Design', 'Product', 'Marketing'],
    unread: true,
    online: true,
  },
  {
    id: '3',
    name: 'Demi Wikinson',
    timeAgo: '2 mins ago',
    action: 'Invited',
    linkText: 'Alisa Hester',
    tags: ['Design', 'Product', 'Marketing'],
    unread: true,
    online: true,
  },
  {
    id: '4',
    name: 'Candice Wu',
    timeAgo: '3 hours ago',
    action: 'Commented in',
    linkText: 'Marketing site redesign',
    tags: ['Design', 'Product', 'Marketing'],
    unread: true,
    online: false,
  },
  {
    id: '5',
    name: 'Candice Wu',
    timeAgo: '3 hours ago',
    action: 'Was added to',
    linkText: 'Marketing site redesign',
    tags: ['Design', 'Product', 'Marketing'],
    unread: false,
    online: false,
  },
  {
    id: '6',
    name: 'Natali Craig',
    timeAgo: '6 hours ago',
    action: 'Added 3 labels to the project',
    linkText: 'Marketing site redesign',
    tags: ['Design', 'Product', 'Marketing'],
    unread: false,
    online: true,
  },
  {
    id: '7',
    name: 'Natali Craig',
    timeAgo: '6 hours ago',
    action: 'Invited',
    linkText: 'Lana Steiner',
    tags: ['Design', 'Product', 'Marketing'],
    unread: false,
    online: true,
  },
];

const CLIENTS = [
  'Ancora',
  'Accelerated Wealth Partners',
  'Azimuth Capital',
  'Badgley Phelps',
  'Brand Asset Management',
  'Coastal Bridge Advisors',
  'Fairway Wealth',
  'Focus Partners Wealth',
  'FPW | Bordeaux Wealth',
  'ICON Wealth',
  'IDA Wealth',
  'Kovitz',
  'Family Office Partners',
  'The Fiduciary Group',
  'Portfolio Strategy Group',
  'SagePoint Capital Partners',
  'SCS Financial',
];

// ── Filter panel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
}

function FilterPanel({ open, onClose }: FilterPanelProps) {
  const [assignedToMe,  setAssignedToMe]  = useState(true);
  const [todayOverdue, setTodayOverdue]  = useState(true);
  const [clientSearch, setClientSearch]  = useState('');
  const [showAll,      setShowAll]       = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  function toggleClient(name: string) {
    setSelectedClients((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  const filtered = CLIENTS.filter((c) =>
    c.toLowerCase().includes(clientSearch.toLowerCase()),
  );
  const visible = showAll ? filtered : filtered.slice(0, 8);
  const remaining = filtered.length - 8;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#E9EAEB] shadow-xl transition-transform duration-300 ease-in-out w-[320px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#E9EAEB]">
          <div>
            <h2 className="text-base font-semibold text-[#181D27]">Filters</h2>
            <p className="text-xs text-[#717680] mt-0.5">Apply filters to table data.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#717680] hover:text-[#414651] hover:bg-gray-100 transition-colors"
          >
            <X width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Saved filter dropdown */}
          <div className="mb-5">
            <button className="w-full flex items-center justify-between px-3 py-2 border border-[#D5D7DA] rounded-lg text-sm text-[#717680] bg-white hover:bg-gray-50 transition-colors">
              <span>Select saved filter</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#717680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">Status</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedToMe}
                  onChange={(e) => setAssignedToMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#7F56D9] cursor-pointer"
                />
                <span className="text-sm text-[#414651]">Assigned to me</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={todayOverdue}
                  onChange={(e) => setTodayOverdue(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#7F56D9] cursor-pointer"
                />
                <span className="text-sm text-[#414651]">Today &amp; Overdue</span>
              </label>
            </div>
          </div>

          {/* Clients */}
          <div>
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">Clients</p>

            {/* Search */}
            <div className="flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2 bg-white mb-3">
              <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" />
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 text-sm text-[#181D27] placeholder-[#A4A7AE] bg-transparent outline-none"
              />
              <span className="text-[11px] text-[#A4A7AE] border border-[#E9EAEB] rounded px-1 py-0.5 leading-none">⌘K</span>
            </div>

            {/* Client list */}
            <div className="flex flex-col gap-1">
              {visible.map((client) => (
                <label key={client} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client)}
                    onChange={() => toggleClient(client)}
                    className="w-4 h-4 rounded accent-[#7F56D9] cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-[#414651] group-hover:text-[#181D27] transition-colors">
                    {client}
                  </span>
                </label>
              ))}
            </div>

            {/* Show more / less */}
            {!showAll && remaining > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-2 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                Show {remaining} more
              </button>
            )}
            {showAll && filtered.length > 8 && (
              <button
                onClick={() => setShowAll(false)}
                className="mt-2 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#E9EAEB]">
          <button
            onClick={() => {
              setAssignedToMe(false);
              setTodayOverdue(false);
              setSelectedClients([]);
              setClientSearch('');
            }}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Clear Filter
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

// ── Tag color map ─────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Design:    'bg-[#F4F3FF] border-[#D9D6FE] text-[#5925DC]',
  Product:   'bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]',
  Marketing: 'bg-[#F0F9FF] border-[#B9E6FE] text-[#026AA2]',
};

// ── Inbox item row ────────────────────────────────────────────────────────────

function InboxRow({ item }: { item: InboxItem }) {
  const isInvite = item.action.toLowerCase().includes('invited');

  return (
    <div className="flex items-start gap-5 px-6 py-5 border-b border-[#F2F4F7] hover:bg-[#FAFAFA] transition-colors cursor-pointer">
      {/* Avatar — 56px to match screenshot */}
      <div className="relative shrink-0">
        <Avatar name={item.name} size="lg" online={item.online} className="w-14 h-14" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        {/* Name + time */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-sm font-semibold text-[#181D27]">{item.name}</span>
          <span className="text-xs text-[#A4A7AE]">{item.timeAgo}</span>
        </div>

        {/* Action */}
        <p className="text-sm text-[#535862] mb-2">
          {isInvite ? (
            <>
              {item.action}{' '}
              <span className="inline-flex items-center bg-[#F4EBFF] text-[#6941C6] px-2 py-0.5 rounded-md text-sm font-medium cursor-pointer hover:bg-[#EDE3FF] transition-colors">
                {item.linkText}
              </span>
              {' '}to the team
            </>
          ) : (
            <>
              {item.action}{' '}
              <span className="inline-flex items-center bg-[#F4EBFF] text-[#6941C6] px-2 py-0.5 rounded-md text-sm font-medium cursor-pointer hover:bg-[#EDE3FF] transition-colors">
                {item.linkText}
              </span>
            </>
          )}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap mt-2.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${TAG_COLORS[tag] ?? 'bg-white border-[#D5D7DA] text-[#414651]'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white relative">

      {/* Page header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-5 border-b border-[#E9EAEB]">
        <div>
          <h1 className="text-2xl font-semibold text-[#181D27]">Inbox</h1>
          <p className="text-sm text-[#535862] mt-1">
            Manage your team members, roles, and access across projects.
          </p>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <FilterLines width={18} height={18} className="text-[#535862]" />
          Filter
        </button>
      </div>

      {/* Inbox list */}
      <div>
        {INBOX_ITEMS.map((item) => (
          <InboxRow key={item.id} item={item} />
        ))}
      </div>

      {/* Filter slide-over */}
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </main>
  );
}
