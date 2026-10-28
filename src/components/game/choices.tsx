"use client";

type Props = {
  label: string;
  options: string[];
  value: number | null;
  onChange: (index: number) => void;
  columns?: 1 | 2 | 7;
};

export function Choices({ label, options, value, onChange, columns = 1 }: Props) {
  const grid = { 1: "grid-cols-1", 2: "grid-cols-2", 7: "grid-cols-7" }[columns];
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-2 ${grid}`}>
      {options.map((option, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={`rounded border px-3 py-2 text-left ${value === i ? "border-black bg-black text-white" : ""}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
