import { statusTone, type Tone } from "@/store/tasks";

const toneClass: Record<Tone, string> = {
  green: "bg-success-wash text-success-ink ring-1 ring-inset ring-success-line",
  amber: "bg-warning-wash text-warning-ink ring-1 ring-inset ring-warning-line",
  gray: "bg-wash text-muted ring-1 ring-inset ring-line",
  red: "bg-danger-wash text-danger-ink ring-1 ring-inset ring-danger-line",
};

const dotClass: Record<Tone, string> = {
  green: "bg-success-ink",
  amber: "bg-warning-ink",
  gray: "bg-faint",
  red: "bg-danger-ink",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} />
      {status}
    </span>
  );
}
