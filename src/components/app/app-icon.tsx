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
      className={cn("relative shrink-0 rotate-[-4deg]", className)}
      role="img"
      style={{ height: dimension, width: dimension }}
    >
      <span className="absolute inset-x-[24%] top-[4%] bottom-[18%] rotate-[-18deg] rounded-[18%] bg-coral shadow-[0_4px_12px_rgba(239,108,74,0.28)]" />
      <span className="absolute inset-x-[20%] top-[1%] bottom-[14%] rotate-[12deg] rounded-[18%] bg-accent shadow-[0_4px_12px_rgba(255,210,63,0.28)]" />
      <span className="absolute inset-[8%] rounded-[22%] border-2 border-primary-dark bg-cream shadow-[0_4px_20px_rgba(43,168,162,0.22)]" />
      <span className="absolute inset-x-[25%] top-[22%] h-[14%] rounded-full bg-primary" />
      <span className="absolute inset-x-[25%] top-[43%] h-[14%] rounded-full bg-accent" />
      <span className="absolute inset-x-[25%] top-[64%] h-[14%] rounded-full bg-coral" />
    </div>
  )
}
