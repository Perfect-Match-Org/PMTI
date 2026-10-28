import { DUO_TYPES } from "@/game/types";

/**
 * Every duo type the game can end on: its two places, one per line, with the nickname under them.
 * The last slot sends you back up to start a game.
 */
export function TypeWall() {
  return (
    <section className="bg-pink text-ink">
      <div className="frame py-16 lg:py-28">
        <h2 className="text-[2.75rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[4.5rem]">Which two are you?</h2>
        <p className="mt-4 max-w-xl text-xl leading-snug lg:text-2xl">
          By the end of the day, your answers make you a pair of Cornell places, one for each of you.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-7 lg:mt-16 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-10">
          {DUO_TYPES.map((type) => {
            const [first, joiner, second] = type.name.split(/ (&|vs\.) /);
            return (
              <li key={type.id} className="border-t-2 border-ink/15 pt-3 lg:pt-4">
                <p className="text-[1.0625rem] leading-[1.15] font-black lg:text-[1.75rem] lg:leading-[1.1] lg:tracking-[-0.015em]">
                  {second ? (
                    <>
                      {first}
                      <span className="block">
                        {joiner} {second}
                      </span>
                    </>
                  ) : (
                    type.name
                  )}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-ink/60 lg:mt-2 lg:text-lg">{type.nickname}</p>
              </li>
            );
          })}
          <li className="col-span-2 border-t-2 border-ink/15 pt-4 lg:col-span-1">
            <a href="#top" className="btn btn-primary w-full lg:w-auto">
              Find out which two you are
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
