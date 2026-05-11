import { useState } from "react";
import { Search, FilterX } from "lucide-react";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "SAVED", label: "Saved" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "INTERESTED", label: "Interested" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "HIRED", label: "Hired" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export default function SearchFilterBar({ filters, onFilterChange, onReset }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
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

      <Button
        size="sm"
        variant="outline"
        onClick={onReset}
        className="border-slate-200 text-slate-500"
      >
        <FilterX className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
