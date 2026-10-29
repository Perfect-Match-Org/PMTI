/** What went wrong, in words, right where it happened. On navy it sits on white; on a white page, on blush. */
export function ErrorNote({ on = "navy", className = "", children }: { on?: "navy" | "white"; className?: string; children: React.ReactNode }) {
  return (
    <p role="alert" className={`rounded-2xl px-4 py-3 font-semibold text-red-deep ${on === "navy" ? "bg-white" : "bg-blush"} ${className}`}>
      {children}
    </p>
  );
}
