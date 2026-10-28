/** The game is one Cornell day; the screen's color follows the scene's clock time. */
export type DayPhase = "morning" | "afternoon" | "evening" | "night";

export function splitTime(time: string): { clock: string; meridiem: string } {
  const match = /^(\d{1,2}:\d{2})\s*(am|pm)$/i.exec(time.trim());
  return match ? { clock: match[1]!, meridiem: match[2]!.toLowerCase() } : { clock: time, meridiem: "" };
}

export function phaseOf(time: string): DayPhase {
  const { clock, meridiem } = splitTime(time);
  const hour12 = Number(clock.split(":")[0]) % 12;
  const hour = meridiem === "pm" ? hour12 + 12 : hour12;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}
