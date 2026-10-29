import "server-only";
import { cache } from "react";
import type postgres from "postgres";
import { z } from "zod";
import { slotsFor } from "@/game/answers";
import { answerSchema, readyPayloadSchema } from "@/game/schemas";
import type { Deck } from "@/game/deck";
import { CURRENT_DECK, getDeck } from "@/game/decks";
import { score, type Result } from "@/game/scoring";
import {
  checkMove,
  derive,
  viewFor,
  type Mode,
  type MoveRow,
  type PlayerInfo,
  type RoomView,
  type TextRow,
  type TextSlot,
} from "@/game/engine";
import { sql, type Db } from "./db";
import { embed, toVector } from "./embed";
import { vibeMatch, type TextRef } from "./similarity";

type RoomRow = {
  id: string;
  code: string;
  hostId: string;
  guestId: string | null;
  mode: Mode;
  deckId: string;
  seq: number;
  createdAt: Date;
  endedAt: Date | null;
  kicked: string[];
  result: Result | null;
};

export class RoomError extends Error {
  constructor(
    public status: 400 | 403 | 404 | 409 | 410,
    message: string
  ) {
    super(message);
  }
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export async function createRoom(hostId: string, mode: Mode): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const rows = await sql`
      insert into rooms (code, host_id, mode, deck_id)
      values (${code}, ${hostId}, ${mode}, ${CURRENT_DECK.id})
      on conflict (code) do nothing
      returning code`;
    if (rows.length) return code;
  }
  throw new Error("Could not allocate a room code");
}

async function findRoom(db: Db, code: string, lock = false): Promise<RoomRow> {
  const [room] = lock
    ? await db<RoomRow[]>`select * from rooms where code = ${code} for update`
    : await db<RoomRow[]>`select * from rooms where code = ${code}`;
  if (!room) throw new RoomError(404, "No game with that code.");
  return room;
}

function deckOf(room: RoomRow): Deck {
  const deck = getDeck(room.deckId);
  if (!deck) throw new RoomError(410, "This game used a version that no longer exists. Start a new one.");
  return deck;
}

const isPlayer = (room: RoomRow, userId: string) => userId === room.hostId || userId === room.guestId;

/** A room nobody joined within a day is over. Once both are in, the game has no deadline. */
const expired = (room: RoomRow) => !room.guestId && Date.now() - room.createdAt.getTime() > ROOM_TTL_MS;

/** Why someone not yet in the room can't join it, or null if they can. Joining and the invitation share it. */
function closedReason(room: RoomRow, userId?: string): RoomError | null {
  if (userId && room.kicked.includes(userId)) return new RoomError(403, "The host removed you from this game.");
  if (room.endedAt || expired(room)) return new RoomError(410, "This game has ended. Start a new one.");
  if (room.guestId) return new RoomError(409, "This game already has two players.");
  return null;
}

async function loadLog(db: Db, roomId: string) {
  const moves = await db<MoveRow[]>`
    select player_id, round, attempt, kind, payload from moves where room_id = ${roomId}`;
  const texts = await db<TextRow[]>`
    select player_id, round, slot, body, match_pct from texts where room_id = ${roomId}`;
  return { moves, texts };
}

async function bump(db: Db, roomId: string, changes: Record<string, unknown> = {}) {
  // postgres.js can't expand db(object) inside a nested fragment, hence two inline queries.
  if (Object.keys(changes).length) {
    await db`update rooms set ${db(changes)}, seq = seq + 1, updated_at = now() where id = ${roomId}`;
  } else {
    await db`update rooms set seq = seq + 1, updated_at = now() where id = ${roomId}`;
  }
}

export async function joinRoom(code: string, userId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const room = await findRoom(tx, code, true);
    if (isPlayer(room, userId)) return;
    const closed = closedReason(room, userId);
    if (closed) throw closed;
    await bump(tx, room.id, { guestId: userId });
  });
}

const kickBody = z.object({ version: z.number().int() });

/** Removes the guest the host was looking at, and keeps them out: reloading the link won't rejoin them. */
export async function kickGuest(code: string, userId: string, body: unknown): Promise<void> {
  const seen = kickBody.safeParse(body);
  if (!seen.success) throw new RoomError(400, "Malformed request.");
  await sql.begin(async (tx) => {
    const room = await findRoom(tx, code, true);
    if (room.hostId !== userId) throw new RoomError(403, "Only the host can remove a player.");
    // A stale screen or a double tap must not remove someone who joined since.
    if (room.seq !== seen.data.version) throw new RoomError(409, "The game moved on.");
    const { moves } = await loadLog(tx, room.id);
    if (derive(deckOf(room), room, moves).phase !== "lobby") {
      throw new RoomError(409, "The game already started.");
    }
    if (!room.guestId) return;
    await tx`update rooms set kicked = array_append(kicked, ${room.guestId}::uuid) where id = ${room.id}`;
    await bump(tx, room.id, { guestId: null });
  });
}

export async function endRoom(code: string, userId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const room = await findRoom(tx, code, true);
    if (!isPlayer(room, userId)) throw new RoomError(403, "You’re not in this game.");
    if (room.endedAt) return;
    // A partner may have finished the game a moment ago; ending it now would throw away the result.
    const deck = getDeck(room.deckId);
    if (deck && derive(deck, room, (await loadLog(tx, room.id)).moves).phase === "done") {
      throw new RoomError(409, "This game already finished.");
    }
    await bump(tx, room.id, { endedAt: new Date(), endedBy: userId });
  });
}

const moveBody = z.object({
  round: z.number().int().min(-1),
  attempt: z.number().int().min(0),
  kind: z.enum(["ready", "answer"]),
  payload: z.unknown().optional(),
});

export async function submitMove(code: string, userId: string, body: unknown): Promise<RoomView> {
  const parsed = moveBody.safeParse(body);
  if (!parsed.success) throw new RoomError(400, "Malformed move.");
  const { round: r, attempt, kind } = parsed.data;
  const key = { playerId: userId, round: r, attempt, kind };

  // Cheap checks first, without the lock, so stale or duplicate taps cost nothing more.
  const room = await findRoom(sql, code);
  const deck = deckOf(room);
  const pre = checkMove(deck, room, (await loadLog(sql, room.id)).moves, key);
  if (pre === "not-player") throw new RoomError(403, "You’re not in this game.");
  if (pre === "stale") throw new RoomError(409, "The game moved on.");
  if (pre === "duplicate") return loadView(code, userId);

  let payload: Record<string, unknown> = {};
  let texts: { body: string; slot: TextSlot; promptId: string }[] = [];
  if (kind === "answer") {
    const round = deck.rounds[r]!;
    const answer = answerSchema(round).safeParse(parsed.data.payload);
    if (!answer.success) throw new RoomError(400, "That answer doesn’t fit this round.");
    if (round.format === "write") {
      texts = slotsFor(round).map((slot, i) => ({ body: answer.data.texts![i]!, slot, promptId: `${round.poolKey}:${slot}` }));
    } else payload = answer.data;
  } else {
    // Reaction tallies are a nice-to-have; a bad tally never blocks the game.
    const ready = readyPayloadSchema.safeParse(parsed.data.payload ?? {});
    if (ready.success) payload = ready.data;
  }

  // Embed before taking the lock (it can take seconds on a cold start); null means "no score".
  const vectors = texts.length ? await embed(texts.map((x) => x.body)) : null;

  await sql.begin(async (tx) => {
    // READ COMMITTED: the moves read below is a separate statement, so it sees the partner's
    // move committed while we waited for the lock.
    const locked = await findRoom(tx, code, true);
    const { moves } = await loadLog(tx, locked.id);
    const check = checkMove(deck, locked, moves, key);
    if (check === "duplicate") return;
    if (check !== "ok") throw new RoomError(409, "The game moved on.");

    await tx`
      insert into moves (room_id, player_id, round, attempt, kind, payload)
      values (${locked.id}, ${userId}, ${r}, ${attempt}, ${kind}, ${tx.json(payload as postgres.JSONValue)})
      on conflict do nothing`;
    for (const [i, { body, slot, promptId }] of texts.entries()) {
      const vector = vectors?.[i] ? toVector(vectors[i]) : null;
      await tx`
        insert into texts (prompt_id, body, embedding, room_id, player_id, round, slot)
        values (${promptId}, ${body}, ${vector}::extensions.vector,
                ${locked.id}, ${userId}, ${r}, ${slot})`;
    }
    if (texts.length) await scoreRoundTexts(tx, locked.id, r);
    await bump(tx, locked.id);
  });

  return loadView(code, userId);
}

/**
 * Once both players' texts for a round are in, score each "candidate" text against its anchor:
 * shared rounds compare the two answers; mirror rounds compare what you wrote about your partner
 * with what they wrote about themselves.
 */
async function scoreRoundTexts(db: Db, roomId: string, round: number) {
  const rows = await db<(TextRef & { playerId: string; slot: TextSlot })[]>`
    select id, player_id, slot, body, prompt_id, embedding is not null as has_embedding
    from texts where room_id = ${roomId} and round = ${round}`;
  if (new Set(rows.map((t) => t.playerId)).size < 2) return;
  for (const candidate of rows) {
    const anchorSlot = candidate.slot === "shared" ? "shared" : candidate.slot === "partner" ? "self" : null;
    const anchor = rows.find((t) => t.slot === anchorSlot && t.playerId !== candidate.playerId);
    if (!anchor) continue;
    const pct = await vibeMatch(db, anchor, candidate, roomId);
    await db`update texts set match_pct = ${pct} where id = ${candidate.id}`;
  }
}

type Profile = { name: string | null; avatarUrl: string | null; email: string };

/**
 * First name and photo as Google gave them. User metadata is editable by the user, so it's only read
 * for accounts with no Google identity (local dev sign-ins). Photos only from Google's image host.
 */
async function profiles(ids: string[]): Promise<Map<string, Profile>> {
  const rows = await sql<{ id: string; email: string; name: string | null; avatarUrl: string | null }[]>`
    select u.id, u.email,
      case when g.id is null
        then coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
        else coalesce(g.identity_data->>'full_name', g.identity_data->>'name') end as name,
      coalesce(g.identity_data->>'avatar_url', g.identity_data->>'picture') as avatar_url
    from auth.users u
    left join auth.identities g on g.user_id = u.id and g.provider = 'google'
    where u.id in ${sql(ids)}`;
  return new Map(
    rows.map((u) => [
      u.id,
      {
        name: u.name?.trim().split(/\s+/)[0]?.slice(0, 24) || null,
        avatarUrl: u.avatarUrl?.startsWith("https://lh3.googleusercontent.com/") ? u.avatarUrl : null,
        email: u.email,
      },
    ])
  );
}

async function playerInfo(ids: string[]): Promise<Map<string, PlayerInfo>> {
  const found = await profiles(ids);
  return new Map([...found].map(([id, p]) => [id, { name: p.name ?? p.email.split("@")[0]!, avatarUrl: p.avatarUrl }]));
}

export async function loadView(code: string, userId: string): Promise<RoomView> {
  const room = await findRoom(sql, code);
  if (!isPlayer(room, userId)) throw new RoomError(403, "You’re not in this game.");
  const deck = deckOf(room);
  const [{ moves, texts }, info] = await Promise.all([
    loadLog(sql, room.id),
    playerInfo([room.hostId, ...(room.guestId ? [room.guestId] : [])]),
  ]);
  const unknown: PlayerInfo = { name: "Player", avatarUrl: null };
  const result = room.result ?? (await ensureResult(deck, room, moves, texts));
  // An expired lobby reads as ended, so the host isn't left waiting on a link that no longer works.
  const endedAt = room.endedAt ?? (expired(room) ? new Date(room.createdAt.getTime() + ROOM_TTL_MS) : null);
  return viewFor({
    deck,
    room: { ...room, endedAt, result },
    moves,
    texts,
    viewerId: userId,
    players: {
      host: info.get(room.hostId) ?? unknown,
      guest: room.guestId ? (info.get(room.guestId) ?? unknown) : null,
    },
  });
}

/**
 * Scores a finished game once and stores it. Runs on read, after the final move has committed,
 * so a scoring bug shows up as a missing result (and a log line), never as a stuck Next button.
 * Deterministic, so concurrent first reads store the same thing.
 */
async function ensureResult(deck: Deck, room: RoomRow, moves: MoveRow[], texts: TextRow[]): Promise<Result | null> {
  if (!room.guestId || derive(deck, room, moves).phase !== "done") return null;
  try {
    const result = score(deck, { ...room, guestId: room.guestId }, moves, texts);
    await sql`update rooms set result = ${sql.json(result as postgres.JSONValue)} where id = ${room.id} and result is null`;
    return result;
  } catch (error) {
    console.error("[score] failed", error);
    return null;
  }
}

export type Invitation = { host: PlayerInfo; mode: Mode } | { closed: string; full: boolean };

/**
 * What someone holding the link sees before signing in: who is inviting them and to which kind of
 * game, or why they can't join. The host shared the link, so their first name and photo are fair to show.
 * A full game may still be theirs (signed out on another device), so it says so instead of just closing.
 */
export const invitation = cache(async (code: string): Promise<Invitation> => {
  try {
    const room = await findRoom(sql, code);
    deckOf(room);
    const closed = closedReason(room);
    if (closed) return { closed: closed.message, full: closed.status === 409 };
    // Before sign-in, a name only if Google gave one: never the email's NetID.
    const profile = (await profiles([room.hostId])).get(room.hostId);
    return { host: { name: profile?.name ?? "Your partner", avatarUrl: profile?.avatarUrl ?? null }, mode: room.mode };
  } catch (error) {
    if (error instanceof RoomError) return { closed: error.message, full: false };
    throw error;
  }
});

