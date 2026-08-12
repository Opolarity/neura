import { cn } from "@/shared/utils/utils";
import { MovementRequestType } from "../../types/MovementRequestList.types";

interface Props {
  type?: MovementRequestType;
  situationCode?: string | null;
  progressSituationCode?: string | null;
}

const REQUEST_STEPS = [
  { code: "REQ", label: "Solicitado" },
  { code: "NEG", label: "Negociación" },
  { code: "APR", label: "Aprobado" },
  { code: "ENV", label: "Enviado" },
  { code: "REC", label: "Recibido" },
];

const SEND_STEPS = [
  { code: "ENV", label: "Enviado" },
  { code: "REC", label: "Recibido" },
];

export default function MovementRequestStepsBar({
  type,
  situationCode,
  progressSituationCode,
}: Props) {
  if (!type) return null;

  const steps = type === "request" ? REQUEST_STEPS : SEND_STEPS;
  const isCancelled = situationCode === "CAN";
  const effectiveCode = isCancelled ? progressSituationCode : situationCode;
  const currentIndex = steps.findIndex((s) => s.code === effectiveCode);

  if (currentIndex === -1) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <span
            key={step.code}
            title={step.label}
            className={cn(
              "h-[3px] rounded-full",
              i === currentIndex ? "w-5" : "w-3",
              i > currentIndex
                ? "bg-border"
                : isCancelled
                  ? "bg-destructive"
                  : i === currentIndex
                    ? "bg-primary"
                    : "bg-primary/35"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {isCancelled ? "Cerrada" : `${currentIndex + 1} de ${steps.length}`}
      </span>
    </div>
  );
}
