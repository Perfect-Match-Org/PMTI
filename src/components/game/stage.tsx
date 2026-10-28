/**
 * Every game screen's layout. On a phone the header sits above the body; on a wide screen the
 * header takes the left column and the body the right. Top-aligned at a fixed offset, so the
 * headline lands in the same spot on every screen, like the action button does.
 */
export function Stage({ aside, children }: { aside: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="pt-6 lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-16 lg:pt-[min(9vh,5.5rem)]">
      <div>{aside}</div>
      {children && <div className="mt-6 lg:mt-0">{children}</div>}
    </div>
  );
}
