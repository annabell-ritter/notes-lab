// A small palette for tags. Each tag gets its colour from its id, so a tag always has the
// same colour everywhere and new tags take the next colour in turn. No database column is needed.
// Class names are written out in full so Tailwind can find them.
const TAG_COLORS = [
  {
    dot: "bg-blue-500",
    pill: "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100",
    border: "border-blue-500",
  },
  {
    dot: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100",
    border: "border-emerald-500",
  },
  {
    dot: "bg-amber-500",
    pill: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
    border: "border-amber-500",
  },
  {
    dot: "bg-violet-500",
    pill: "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100",
    border: "border-violet-500",
  },
  {
    dot: "bg-rose-500",
    pill: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100",
    border: "border-rose-500",
  },
  {
    dot: "bg-cyan-500",
    pill: "bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100",
    border: "border-cyan-500",
  },
  {
    dot: "bg-orange-500",
    pill: "bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-100",
    border: "border-orange-500",
  },
  {
    dot: "bg-lime-500",
    pill: "bg-lime-100 text-lime-900 dark:bg-lime-500/20 dark:text-lime-100",
    border: "border-lime-500",
  },
];

export type TagColor = (typeof TAG_COLORS)[number];

export function tagColor(tagId: number): TagColor {
  return TAG_COLORS[tagId % TAG_COLORS.length];
}
