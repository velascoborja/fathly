import { cn } from "@/lib/utils"

type AppIconProps = {
  alt?: string
  className?: string
  size?: number
}

export function AppIcon({ alt = "Fathly app icon", className, size = 36 }: AppIconProps) {
  const dimension = `${size}px`

  return (
    <div
      aria-label={alt}
      className={cn("relative shrink-0", className)}
      role="img"
      style={{ height: dimension, width: dimension }}
    >
      <span className="absolute inset-[6%] rounded-2xl border border-primary/30 bg-card shadow-[0_8px_24px_rgba(123,47,190,0.18)]" />
      <span className="absolute inset-x-[27%] top-[13%] h-[12%] rounded-full bg-muted" />
      <span className="absolute inset-x-[18%] bottom-[16%] h-[32%] rounded-xl border border-border bg-muted" />
      <span className="absolute left-[24%] top-[21%] h-[18%] w-[18%] rounded-full bg-secondary" />
      <span className="absolute right-[24%] top-[21%] h-[18%] w-[18%] rounded-full bg-accent-dark" />
      <span className="absolute left-[46%] top-[36%] h-[36%] w-[10%] -skew-x-12 rounded-sm bg-primary" />
      <span className="absolute left-[35%] top-[50%] h-[10%] w-[30%] -skew-x-12 rounded-sm bg-primary" />
    </div>
  )
}
