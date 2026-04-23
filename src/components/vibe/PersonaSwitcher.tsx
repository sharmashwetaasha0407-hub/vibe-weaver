import { motion } from "framer-motion";
import { Code2, Target, Rocket } from "lucide-react";
import { PERSONAS, type Persona } from "@/lib/personas";
import { cn } from "@/lib/utils";

const ICONS = { architect: Code2, impact: Target, visionary: Rocket };

export function PersonaSwitcher({ value, onChange, floating = false }: {
  value: Persona;
  onChange: (p: Persona) => void;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass rounded-full p-1 flex items-center gap-1 shadow-elegant",
        floating && "fixed bottom-5 left-1/2 -translate-x-1/2 z-40"
      )}
    >
      {(Object.keys(PERSONAS) as Persona[]).map((id) => {
        const Icon = ICONS[id];
        const meta = PERSONAS[id];
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "relative px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium z-10 transition-colors",
              active ? "text-background" : "text-foreground/70 hover:text-foreground"
            )}
            aria-pressed={active}
          >
            {active && (
              <motion.span
                layoutId="persona-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full -z-10"
                style={{ background: `hsl(${meta.accentVar})` }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{meta.name.replace("The ", "")}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
