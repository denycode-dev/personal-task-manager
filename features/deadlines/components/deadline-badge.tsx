import { Badge } from "@/components/ui/badge";
import { getDeadlineStatus } from "@/lib/utils/date";
import { Clock, WarningCircle, Flame } from "@phosphor-icons/react/dist/ssr";

export function DeadlineBadge({ deadline }: { deadline: Date | null | undefined }) {
  const status = getDeadlineStatus(deadline);
  if (status === "none") return null;

  const map = {
    overdue: {
      label: "Terlambat",
      className: "bg-red-500 text-white border-black",
      icon: WarningCircle,
    },
    today: {
      label: "Hari ini",
      className: "bg-orange-400 text-black border-black",
      icon: Flame,
    },
    tomorrow: {
      label: "Besok",
      className: "bg-yellow-400 text-black border-black",
      icon: Clock,
    },
  } as const;

  const { label, className, icon: Icon } = map[status];

  return (
    <Badge
      className={`inline-flex items-center gap-1 text-[10px] font-black border-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      <Icon size={12} weight="bold" />
      <span>{label}</span>
    </Badge>
  );
}
