import type { FC, ReactNode } from 'react';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
}

export const SidebarItem: FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
}) => {
  return (
    <div
      className={`group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors select-none ${
        active
          ? 'bg-black text-white'
          : 'text-gray-800 hover:bg-gray-100/80 hover:text-gray-900'
      }`}
    >
      <span
        className={`flex items-center justify-center shrink-0 ${
          active ? 'text-white' : 'text-gray-800 group-hover:text-gray-900'
        }`}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
};

export default SidebarItem;
