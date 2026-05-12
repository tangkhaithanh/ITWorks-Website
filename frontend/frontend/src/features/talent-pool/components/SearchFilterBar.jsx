import { Search, FilterX } from "lucide-react";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SAVED", label: "Đã lưu" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "INTERESTED", label: "Quan tâm" },
  { value: "INTERVIEW_SCHEDULED", label: "Đã hẹn phỏng vấn" },
  { value: "NOT_INTERESTED", label: "Không phù hợp" },
  { value: "HIRED", label: "Đã tuyển" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả ưu tiên" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
];

export default function SearchFilterBar({ filters, onFilterChange, onReset }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={filters.search || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <SelectInput
        value={filters.status || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, status: e.target.value })
        }
        options={STATUS_OPTIONS}
        className="min-w-[140px]"
      />

      <SelectInput
        value={filters.priority || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, priority: e.target.value })
        }
        options={PRIORITY_OPTIONS}
        className="min-w-[140px]"
      />

      <input
        type="text"
        placeholder="Nhãn..."
        value={filters.tags || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, tags: e.target.value })
        }
        className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

      <Button
        size="sm"
        variant="outline"
        onClick={onReset}
        className="border-slate-200 text-slate-500"
      >
        <FilterX className="h-4 w-4" />
        Đặt lại
      </Button>
    </div>
  );
}
