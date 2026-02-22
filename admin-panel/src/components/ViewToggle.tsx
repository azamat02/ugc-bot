export type ViewMode = "cards" | "table";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
      <button
        onClick={() => onChange("cards")}
        className={`px-3 py-1.5 text-sm transition-colors ${
          view === "cards"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>
      <button
        onClick={() => onChange("table")}
        className={`px-3 py-1.5 text-sm transition-colors ${
          view === "table"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
