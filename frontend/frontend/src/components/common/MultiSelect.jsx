import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function MultiSelect({
  label,
  name,
  options = [],
  value = [],
  onChange,
  placeholder = "-- Chọn --",
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // đảm bảo value luôn là mảng string
  const selectedValues = (value || []).map((v) => String(v));

  const toggleOption = (id) => {
    const idStr = String(id);
    let newValues;

    if (selectedValues.includes(idStr)) {
      newValues = selectedValues.filter((v) => v !== idStr);
    } else {
      newValues = [...selectedValues, idStr];
    }

    onChange({ target: { name, value: newValues } });
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(String(opt.id)))
    .map((opt) => opt.name);

  // FILTER OPTIONS THEO SEARCH
  const getFilteredOptions = () => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) =>
      opt.name.toLowerCase().includes(term)
    );
  };

  const filteredOptions = getFilteredOptions();

  // —— POSITION DROPDOWN ————————————————
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setDropdownStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
      zIndex: 999999,
    });
  };

  useEffect(() => {
    let focusTimer;

    if (open) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);

      // reset search và highlight khi mở
      setSearch("");
      setHighlightedIndex(options.length > 0 ? 0 : -1);

      // focus ô search
      focusTimer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
      if (focusTimer) clearTimeout(focusTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Adjust highlightedIndex khi search / options đổi
  useEffect(() => {
    if (!open) return;
    const visible = getFilteredOptions();
    if (visible.length === 0) {
      setHighlightedIndex(-1);
    } else if (highlightedIndex < 0 || highlightedIndex >= visible.length) {
      setHighlightedIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, options, open]);

  // —— CLOSE WHEN CLICK OUTSIDE ————————————————
  useEffect(() => {
    const handleClickOutside = (e) => {
      // click trong vùng label / button
      if (wrapperRef.current && wrapperRef.current.contains(e.target)) {
        return;
      }

      // click trong dropdown (portal)
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // —— KEYBOARD SUPPORT ————————————————
  const handleKeyDown = (e) => {
    const visible = getFilteredOptions();

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (visible.length === 0) return;
        setHighlightedIndex((prev) => {
          if (prev < 0) return 0;
          return (prev + 1) % visible.length;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (visible.length === 0) return;
        setHighlightedIndex((prev) => {
          if (prev < 0) return visible.length - 1;
          return (prev - 1 + visible.length) % visible.length;
        });
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (highlightedIndex >= 0 && highlightedIndex < visible.length) {
          const opt = visible[highlightedIndex];
          toggleOption(opt.id);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        if (open) setOpen(false);
        break;
      }
      default:
        break;
    }
  };

  // —— DROPDOWN UI ————————————————
  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white/98 border border-slate-200/80 rounded-xl shadow-xl shadow-slate-200/70 
                 max-h-72 overflow-auto backdrop-blur-sm"
    >
      {/* SEARCH BAR */}
      {options.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.5 15.5L19 19m-3.5-7.5a5 5 0 11-10 0 5 5 0 0110 0z"
                />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm..."
              className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded-md 
                         bg-white/90 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400
                         placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* NO DATA */}
      {options.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-400">
          Chưa có dữ liệu
        </div>
      )}

      {/* NO MATCH */}
      {options.length > 0 && filteredOptions.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-400">
          Không tìm thấy kết quả
        </div>
      )}

      {/* OPTIONS */}
      {filteredOptions.map((opt, index) => {
        const isSelected = selectedValues.includes(String(opt.id));
        const isActive = index === highlightedIndex;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggleOption(opt.id)}
            className={`w-full px-3 py-2.5 text-sm sm:text-base flex items-center gap-3 
                        transition-colors duration-150 text-slate-800
              ${
                isActive
                  ? "bg-blue-50 ring-1 ring-blue-100"
                  : isSelected
                  ? "bg-blue-50/70"
                  : "hover:bg-slate-50"
              }
              ${index === 0 ? "rounded-t-xl" : ""}
              ${
                index === filteredOptions.length - 1
                  ? "rounded-b-xl"
                  : ""
              }`}
          >
            {/* Checkbox giả bên trái */}
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-sm border text-[10px] shrink-0
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-300 bg-white text-transparent"
                }`}
            >
              ✓
            </span>

            {/* Tên option */}
            <span className="flex-1 text-left truncate">
              {opt.name}
            </span>

            {/* Tag nhỏ "Đã chọn" */}
            {isSelected && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                Đã chọn
              </span>
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  // —— INPUT / BUTTON UI ————————————————
  const renderSelectedPreview = () => {
    if (selectedLabels.length === 0) {
      return (
        <span className="text-slate-400">
          {placeholder}
        </span>
      );
    }

    const maxChips = 3;
    const chips = selectedLabels.slice(0, maxChips);
    const remaining = selectedLabels.length - maxChips;

    return (
      <div className="flex flex-wrap items-center gap-1">
        {chips.map((labelText) => (
          <span
            key={labelText}
            className="inline-flex items-center px-2 py-0.5 rounded-full 
                       bg-slate-100 text-sm font-medium text-slate-700 max-w-full truncate"
          >
            {labelText}
          </span>
        ))}
        {remaining > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
            +{remaining}
          </span>
        )}
      </div>
    );
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (selectedValues.length === 0) return;
    onChange({ target: { name, value: [] } });
  };

  return (
    <div className="space-y-1.5 relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[42px] px-3 py-2 pr-16 border rounded-xl bg-white/90 text-base
                     flex items-center justify-between
                     border-slate-300 hover:border-slate-400
                     focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500
                     transition-colors shadow-sm hover:shadow-md"
        >
          <div className="flex-1 min-w-0">
            <div className="truncate">{renderSelectedPreview()}</div>
          </div>
        </button>

        {/* CLEAR BUTTON (Xóa) */}
        {selectedValues.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-xs 
                       text-slate-400 hover:text-slate-600 px-1.5 py-0.5 
                       rounded-full hover:bg-slate-100 transition-colors"
          >
            Xóa
          </button>
        )}

        {/* ARROW ICON */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* HINT DƯỚI INPUT */}
      {selectedValues.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-[10px] text-slate-500">
            i
          </span>
          Đã chọn {selectedValues.length} mục
        </p>
      )}

      {/* Portal render dropdown ra ngoài body */}
      {createPortal(dropdown, document.body)}
    </div>
  );
}
