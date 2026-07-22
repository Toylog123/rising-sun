import { statusTone, type Tone } from "@/store/tasks";

const toneClass: Record<Tone, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-[#c96442]/12 text-[#c96442]",
  gray: "bg-[#eceae4] text-[#6b6560]",
  red: "bg-red-100 text-red-600",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${toneClass[statusTone(status)]}`}>
      {status}
    </span>
  );
}
