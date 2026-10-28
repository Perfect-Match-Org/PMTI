"use client";

type Props = {
  label: string;
  options: string[];
  value: number | null;
  onChange: (index: number) => void;
  layout?: "stack" | "pair" | "scale";
};

const GRID = { stack: "grid-cols-1", pair: "grid-cols-2", scale: "grid-cols-7" };

export function Choices({ label, options, value, onChange, layout = "stack" }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-2 ${GRID[layout]}`}>
      {options.map((option, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={`choice ${layout === "scale" ? "choice-dot" : ""} ${layout === "pair" ? "text-center" : ""}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
