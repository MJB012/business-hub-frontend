// components/SearchBar.tsx
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}: SearchBarProps) {
  const hasMargin = /\bm[btyxs]?-\d/.test(className);

  return (
    <div className={`relative ${hasMargin ? "" : "mb-6"} ${className}`}>
      <Search
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-2.5 h-[42px] border border-gray-200 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition"
      />
    </div>
  );
}
