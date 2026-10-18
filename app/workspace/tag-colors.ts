// A small palette for tags. Each tag gets its colour from its id, so a tag always has the
// same colour everywhere and new tags take the next colour in turn. No database column is needed.
// Class names are written out in full so Tailwind can find them.
const TAG_COLORS = [
  {
    dot: "bg-blue-500",
    pill: "bg-blue-100 text-blue-900",
    border: "border-blue-500",
  },
  {
    dot: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-500",
  },
  {
    dot: "bg-amber-500",
    pill: "bg-amber-100 text-amber-900",
    border: "border-amber-500",
  },
  {
    dot: "bg-violet-500",
    pill: "bg-violet-100 text-violet-900",
    border: "border-violet-500",
  },
  {
    dot: "bg-rose-500",
    pill: "bg-rose-100 text-rose-900",
    border: "border-rose-500",
  },
  {
    dot: "bg-cyan-500",
    pill: "bg-cyan-100 text-cyan-900",
    border: "border-cyan-500",
  },
  {
    dot: "bg-orange-500",
    pill: "bg-orange-100 text-orange-900",
    border: "border-orange-500",
  },
  {
    dot: "bg-lime-500",
    pill: "bg-lime-100 text-lime-900",
    border: "border-lime-500",
  },
];

export type TagColor = (typeof TAG_COLORS)[number];

export function tagColor(tagId: number): TagColor {
  return TAG_COLORS[tagId % TAG_COLORS.length];
}
