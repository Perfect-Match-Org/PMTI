import type { Axis } from "./deck";

/** Per-player metric that decides who gets which half of the type. */
export type RoleMetric = Axis | "sharper" | "steadier";

export type DuoType = {
  id: string;
  /** "Place A & Place B": each player is one half. */
  name: string;
  nickname: string;
  tagline: string;
  halves: [{ name: string; line: string }, { name: string; line: string }];
  /** The player higher on `by` gets `halves[higherGets]`. */
  role: { by: RoleMetric; higherGets: 0 | 1 };
} & (
  | { kind: "corner"; lean: Record<Axis, 1 | -1> }
  | { kind: "opposite"; axis: Axis }
  | { kind: "earned" }
);

const corner = (E: 1 | -1, P: 1 | -1, H: 1 | -1) => ({ kind: "corner" as const, lean: { E, P, H } });

export const DUO_TYPES: DuoType[] = [
  {
    id: "lynah-lindseth",
    name: "Lynah & Lindseth",
    nickname: "The Athletes",
    tagline: "Your love language is a shared workout calendar.",
    halves: [
      { name: "Lynah", line: "the hype, first to scream at the hockey game" },
      { name: "Lindseth", line: "the steady climber, checks the gear, gets you to the top" },
    ],
    role: { by: "E", higherGets: 0 },
    ...corner(1, 1, -1),
  },
  {
    id: "slope-mcgraw",
    name: "Libe Slope & McGraw Tower",
    nickname: "The Romantics",
    tagline: "Sunset, booked a week in advance.",
    halves: [
      { name: "Libe Slope", line: "plans the perfect moment, knows when golden hour hits" },
      { name: "McGraw Tower", line: "brings the soundtrack, writes the long texts" },
    ],
    role: { by: "H", higherGets: 1 },
    ...corner(1, 1, 1),
  },
  {
    id: "slopeday-stpattys",
    name: "Slope Day & St. Patty's",
    nickname: "The Partiers",
    tagline: "Plans? You have a vibe.",
    halves: [
      { name: "Slope Day", line: "the main event, gets everyone outside" },
      { name: "St. Patty's", line: "keeps it going well past when it should've ended" },
    ],
    role: { by: "E", higherGets: 0 },
    ...corner(1, -1, -1),
  },
  {
    id: "stewart-cascadilla",
    name: "Stewart Park & Cascadilla",
    nickname: "The Wanderers",
    tagline: "Let's just walk and see where we end up.",
    halves: [
      { name: "Stewart Park", line: "wide open, “let's see where the day goes”" },
      { name: "Cascadilla", line: "the one who asks the real questions, every walk ends in a real talk" },
    ],
    role: { by: "H", higherGets: 1 },
    ...corner(1, -1, 1),
  },
  {
    id: "rose-becker",
    name: "Rose & Becker",
    nickname: "The Homebodies",
    tagline: "Sunday is for baking and a color-coded grocery list.",
    halves: [
      { name: "Rose", line: "the host, plans the menu" },
      { name: "Becker", line: "shows up with ingredients, does the dishes" },
    ],
    role: { by: "P", higherGets: 0 },
    ...corner(-1, 1, -1),
  },
  {
    id: "olin-uris",
    name: "Olin & Uris",
    nickname: "The Academics",
    tagline: "Study date. Actually studying. Then three hours on free will.",
    halves: [
      { name: "Olin", line: "snacks, schedule, the reason you both pass" },
      { name: "Uris", line: "the Harry Potter library, wanders into big ideas" },
    ],
    role: { by: "P", higherGets: 0 },
    ...corner(-1, 1, 1),
  },
  {
    id: "cinema-ctb",
    name: "Cornell Cinema & CTB",
    nickname: "The Night Owls",
    tagline: "A 9pm movie turns into a late-night CTB run.",
    halves: [
      { name: "Cornell Cinema", line: "picks the movie, falls asleep halfway" },
      { name: "CTB", line: "“should we get food?” at exactly the right moment" },
    ],
    role: { by: "E", higherGets: 1 },
    ...corner(-1, -1, -1),
  },
  {
    id: "beebe-gardens",
    name: "Beebe Lake & the Botanic Gardens",
    nickname: "The Whimsical",
    tagline: "Sunset walks and theories about what the ducks are thinking.",
    halves: [
      { name: "Beebe Lake", line: "the dreamer, the conversation goes wherever they go" },
      { name: "the Botanic Gardens", line: "the noticer, points out the small things" },
    ],
    role: { by: "H", higherGets: 0 },
    ...corner(-1, -1, 1),
  },
  {
    id: "levelb-alleycat",
    name: "Level B & Alley Cat Cafe",
    nickname: "Fire & Ice",
    tagline: "One of you wants to go out. One of you wants to pet a cat.",
    halves: [
      { name: "Level B", line: "“one more stop”" },
      { name: "Alley Cat Cafe", line: "warm drink, soft landing" },
    ],
    role: { by: "E", higherGets: 0 },
    kind: "opposite",
    axis: "E",
  },
  {
    id: "syllabus-snowday",
    name: "The Syllabus & the Snow Day",
    nickname: "Plan & Plot Twist",
    tagline: "One of you has a plan. The other is why it changes.",
    halves: [
      { name: "The Syllabus", line: "knows what's due before it's assigned" },
      { name: "The Snow Day", line: "cancels plans in the best way (rare, beloved)" },
    ],
    role: { by: "P", higherGets: 0 },
    kind: "opposite",
    axis: "P",
  },
  {
    id: "sun-dairybar",
    name: "The Daily Sun & the Dairy Bar",
    nickname: "Words & Ice Cream",
    tagline: "One of you writes the paragraph. The other brings ice cream.",
    halves: [
      { name: "The Daily Sun", line: "says it, in long form" },
      { name: "The Dairy Bar", line: "shows it, with a cone" },
    ],
    role: { by: "H", higherGets: 0 },
    kind: "opposite",
    axis: "H",
  },
  {
    id: "founders",
    name: "A.D. White & Ezra Cornell",
    nickname: "The Dream Team",
    tagline: "You basically founded this relationship together.",
    halves: [
      { name: "A.D. White", line: "the vision" },
      { name: "Ezra Cornell", line: "“any person, any study”, makes it happen" },
    ],
    role: { by: "H", higherGets: 0 },
    kind: "earned",
  },
  {
    id: "prelims-finals",
    name: "Prelims & Finals",
    nickname: "On-and-Off",
    tagline: "High stakes, no sleep, and somehow you keep coming back.",
    halves: [
      { name: "Prelims", line: "starts the drama" },
      { name: "Finals", line: "ends it (for now)" },
    ],
    role: { by: "steadier", higherGets: 0 },
    kind: "earned",
  },
  {
    id: "cornell-harvard",
    name: "Cornell vs. Harvard",
    nickname: "The Competitors",
    tagline: "Every game night ends in a rematch.",
    halves: [
      { name: "Cornell", line: "obviously the winner" },
      { name: "Harvard", line: "thinks they're the winner" },
    ],
    role: { by: "sharper", higherGets: 0 },
    kind: "earned",
  },
];

export function duoType(id: string): DuoType | undefined {
  return DUO_TYPES.find((t) => t.id === id);
}
