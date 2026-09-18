import { Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";

type Column = {
  key: string;
  title: string;
};

type DataTableProps = {
  columns: Column[];
};

export default function DataTable({
  columns,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-5 py-4 text-left text-sm font-semibold text-slate-700"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="border-t border-slate-200">
            <td className="px-5 py-4">
              <div className="h-14 w-20 rounded-lg bg-slate-200"></div>
            </td>

            <td className="px-5 py-4 font-medium">
              Summer Promotion 2026
            </td>

            <td className="px-5 py-4">
              02 Aug 2026
            </td>

            <td className="px-5 py-4">
              <StatusBadge status="Active" />
            </td>

            <td className="px-5 py-4">
              <div className="flex justify-end gap-2">
                <button className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100">
                  <Pencil size={16} />
                </button>

                <button className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}