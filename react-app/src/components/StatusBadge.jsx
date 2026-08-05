const STYLES = {
  Pending: "bg-brand-soft text-brand-ink",
  Preparing: "bg-blue-100 text-blue-900",
  Ready: "bg-green-100 text-green-900",
  Served: "border border-gray-200 bg-surface-2 text-muted",
  Cancelled: "bg-red-100 text-red-900",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${STYLES[status] || ""}`}
    >
      <span className="h-[7px] w-[7px] rounded-full bg-current" />
      {status}
    </span>
  );
}
