/** Three dots bouncing in turn: someone is still typing or choosing. Takes the text color. */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <i key={i} className="typing-dot block size-1.5 rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
