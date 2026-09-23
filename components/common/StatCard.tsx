import { ChevronRight } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
};

export default function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-50 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">
            {value}
          </h2>

          <p className="mt-3 text-xs font-medium text-slate-400">
            Current System Status
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 transition-all duration-300 group-hover:bg-emerald-600">
          <ChevronRight
            size={24}
            className="text-emerald-600 transition-colors duration-300 group-hover:text-white"
          />
        </div>
      </div>
    </div>
  );
}