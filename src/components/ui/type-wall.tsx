import { DUO_TYPES } from "@/game/types";
import { Heart } from "./heart";

/** Every duo type the game can end on, set as one run of names: what you two could turn out to be. */
export function TypeWall() {
  return (
    <section className="bg-pink text-ink">
      <div className="frame py-16 lg:py-28">
        <h2 className="text-[2.75rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[4.5rem]">Which two are you?</h2>
        <p className="mt-4 max-w-xl text-xl leading-snug lg:text-2xl">
          By the end of the day, your answers make you a pair of Cornell places, one for each of you.
        </p>
        <p className="mt-10 text-[1.625rem] leading-[1.2] font-black tracking-[-0.02em] lg:mt-16 lg:text-[3rem] lg:leading-[1.12]">
          {DUO_TYPES.map((type, i) => {
            const words = type.name.split(" ");
            const last = words.pop();
            return (
              <span key={type.id}>
                {words.length > 0 && `${words.join(" ")} `}
                {/* The name's last word, the nickname and the heart wrap as one, so no line starts with a nickname or a heart. */}
                <span className="whitespace-nowrap">
                  {last}
                  <span className="ml-2 text-base font-semibold tracking-normal text-ink/60 lg:ml-3 lg:text-xl">{type.nickname}</span>
                  {i < DUO_TYPES.length - 1 && <Heart className="mx-2.5 inline-block size-[0.6em] align-[0.05em] text-red lg:mx-4" />}
                </span>{" "}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
