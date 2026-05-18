import { useState, useRef } from 'react';
import AvatarStack from './AvatarStack';
import AssigneePickerDropdown from './AssigneePickerDropdown';

interface PickerUser {
  id:           string;
  name:         string;
  avatar_url?:  string | null;
  member_role?: string | null;
  role?:        string;
}

interface InlineAssigneePickerProps {
  avatars:      { name: string; src?: string }[];
  users:        PickerUser[];
  selected:     string[];
  onToggle:     (uid: string) => void;
  max?:         number;
  multiSelect?: boolean;
  addAs?:       'button' | 'div';
  className?:   string;
}

export default function InlineAssigneePicker({
  avatars, users, selected, onToggle,
  max = 4, multiSelect = true, addAs, className = '',
}: InlineAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={anchorRef}
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      <AvatarStack
        avatars={avatars}
        max={max}
        showAddButton
        addAs={addAs}
        onAdd={() => setOpen((v) => !v)}
      />
      <AssigneePickerDropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef as React.RefObject<HTMLElement | null>}
        users={users}
        selected={selected}
        onToggle={onToggle}
        multiSelect={multiSelect}
      />
    </div>
  );
}
