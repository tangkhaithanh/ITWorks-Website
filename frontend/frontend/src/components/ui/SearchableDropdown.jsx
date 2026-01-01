import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export default function SearchableDropdown({
                                               name,
                                               value,
                                               onChange,
                                               options = [],
                                               placeholder = "Chọn...",
                                               searchPlaceholder = "Tìm kiếm...",
                                               maxWidth = "350px",
                                           }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    // close when click outside
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((o) => String(o.value) === String(value));

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-2xl
                   flex items-center justify-between text-sm text-slate-700
                   hover:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    className="absolute top-[110%] left-0 bg-white border border-slate-200
                     rounded-xl shadow-xl z-50 overflow-hidden"
                    style={{ width: maxWidth }}
                >
                    {/* Search */}
                    <div className="p-2 border-b bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg
                           focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-[250px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">
                                Không tìm thấy
                            </div>
                        )}

                        {filteredOptions.map((opt) => {
                            const active = String(opt.value) === String(value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange({
                                            target: { name, value: opt.value },
                                        });
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm cursor-pointer flex gap-2
                    ${active ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"}`}
                                >
                                    <div className={`w-4 ${active ? "opacity-100" : "opacity-0"}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="whitespace-normal leading-tight">
                    {opt.label}
                  </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
