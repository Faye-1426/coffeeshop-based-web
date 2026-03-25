import { Search } from "lucide-react";

type SearchMenuBarProps = {
  value: string;
  onChange: (next: string) => void;
};

export default function SearchMenuBar({
  value,
  onChange,
}: SearchMenuBarProps) {
  return (
    <div className="mt-4">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
          size={18}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search menu…"
          className="w-full rounded-full bg-white/90 border border-neutral-200/80 px-11 py-3 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-500 shadow-sm outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600/30 transition"
          aria-label="Search menu"
        />
      </div>
    </div>
  );
}

