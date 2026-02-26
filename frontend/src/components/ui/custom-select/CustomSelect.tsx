import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "./CustomSelect.css";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomSelect: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Выбрать...",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`custom-select ${open ? "open" : ""}`} ref={ref}>
      <button
        className={`select-trigger ${!selectedOption ? "placeholder" : ""}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="select-label">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`select-arrow ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="select-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`select-option ${option.value === value ? "selected" : ""}`}
              onClick={() => handleSelect(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
