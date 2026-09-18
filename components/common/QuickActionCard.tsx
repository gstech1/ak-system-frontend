import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function QuickActionCard({
  title,
  description,
  href,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-emerald-500 hover:shadow-lg"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-all group-hover:bg-emerald-600">
        <ArrowUpRight
          size={20}
          className="text-slate-600 group-hover:text-white"
        />
      </div>
    </Link>
  );
}