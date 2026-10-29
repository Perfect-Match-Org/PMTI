import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { duoType } from "@/game/types";
import { cardLead } from "@/server/card-image";
import { cardFor, type Card } from "@/server/rooms";
import { DuoCardFace, type CardPerson } from "@/components/ui/duo-card";
import { Pitch } from "@/components/landing/hero";
import { BrandHeader } from "@/components/ui/brand-header";

type Props = { params: Promise<{ id: string }> };

const person = (p: Card["people"][number]): CardPerson => ({ name: p.name, tone: p.seat === "host" ? "me" : "partner" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await cardFor((await params).id);
  const type = card && duoType(card.typeId);
  if (!type) return {};
  const title = `${type.name}: ${type.nickname}`;
  return { title, description: type.tagline, openGraph: { title, description: type.tagline }, twitter: { card: "summary_large_image", title } };
}

/** A shared result, public to anyone with the link: the duo, each half, and how well they read each other. */
export default async function CardPage({ params }: Props) {
  const card = await cardFor((await params).id);
  const type = card && duoType(card.typeId);
  if (!card || !type) notFound();
  // The card, then the invitation to play: side by side on a wide screen, stacked on a phone.
  return (
    <main data-navy className="min-h-dvh bg-navy text-white">
      <div className="frame pt-5 lg:pt-8">
        <BrandHeader />
      </div>
      <div className="frame grid gap-12 pt-10 pb-16 lg:grid-cols-[30rem_1fr] lg:items-center lg:gap-20 lg:pt-14">
      <div className="rounded-[1.75rem] bg-ink p-6 text-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)] lg:rounded-[2.25rem] lg:p-8">
        <DuoCardFace
          type={type}
          lead={cardLead(card)}
          people={[person(card.people[0]), person(card.people[1])]}
          live
          footer={
            <p className="mt-6 flex items-baseline gap-2.5">
              <span className="text-4xl font-black tracking-[-0.03em] text-pink">{Math.round(card.mindReading * 100)}%</span>
              <span className="font-semibold text-white/75">mind reading</span>
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-6">
        <h1 className="text-[clamp(2.75rem,12vw,4rem)] leading-[0.95] font-black tracking-[-0.03em] lg:text-[clamp(3.5rem,5vw,5rem)]">
          Which two are you?
        </h1>
        <Pitch />
        <Link href="/" className="btn btn-pink self-start">
          Find out which two you are
        </Link>
      </div>
      </div>
    </main>
  );
}
