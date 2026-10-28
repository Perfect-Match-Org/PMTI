import { useId } from "react";

const HEART =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z";
const CRACK = "12,7.5 10.2,11 13.4,13.6 10.8,16.8 12,21";

export function Heart({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="currentColor" d={HEART} />
    </svg>
  );
}

/** The heart split along a crack, halves tipped apart: for the funny misses. */
export function BrokenHeart({ size = 20, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="-2 -1 28 26" aria-hidden className={className}>
      <clipPath id={`${id}l`}>
        <polygon points={`0,0 12,0 ${CRACK} 12,24 0,24`} />
      </clipPath>
      <clipPath id={`${id}r`}>
        <polygon points={`24,0 12,0 ${CRACK} 12,24 24,24`} />
      </clipPath>
      <g transform="translate(-0.8 0.4) rotate(-9 12 21)">
        <path fill="currentColor" d={HEART} clipPath={`url(#${id}l)`} />
      </g>
      <g transform="translate(0.8 0.4) rotate(9 12 21)">
        <path fill="currentColor" d={HEART} clipPath={`url(#${id}r)`} />
      </g>
    </svg>
  );
}
