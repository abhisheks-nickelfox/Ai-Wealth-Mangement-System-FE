import { useState } from 'react';
import TabBar from '../ui/TabBar';
import { ChatTab } from '../chat/ChatTab';

type ActivityTab = 'recent' | 'files' | 'notes';

const ACTIVITY_TABS: { id: ActivityTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

const EMPTY_MESSAGES: Record<ActivityTab, { icon: string; text: string }> = {
  recent: { icon: '💬', text: 'No messages yet. Start the conversation.' },
  files:  { icon: '📎', text: 'No files or links attached yet.' },
  notes:  { icon: '📝', text: 'No notes added yet.' },
};

function EmptyActivityState({ tab }: { tab: ActivityTab }) {
  const { icon, text } = EMPTY_MESSAGES[tab];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
      <p className="text-[13px] text-[#717680]">{text}</p>
    </div>
  );
}

export default function TaskActivityPanel({ taskId }: { taskId: string }) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');

  return (
    <aside
      className="w-[380px] shrink-0 flex flex-col border-l border-[#E9EAEB] bg-[#FAFAFA] h-full"
      aria-label="Activity panel"
    >
      <div className="border-b border-[#E9EAEB] px-4 shrink-0 bg-white">
        <TabBar
          tabs={ACTIVITY_TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as ActivityTab)}
        />
      </div>

      {activeTab === 'recent' ? (
        <ChatTab scope="task" scopeId={taskId} />
      ) : (
        <EmptyActivityState tab={activeTab} />
      )}
    </aside>
  );
}
