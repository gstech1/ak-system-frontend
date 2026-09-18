type StatusBadgeProps = {
  status: "Active" | "Inactive";
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}