import Image from "next/image"

import { cn } from "@/lib/utils"

type AppIconProps = {
  alt?: string
  className?: string
  size?: number
}

export function AppIcon({ alt = "Fathly app icon", className, size = 36 }: AppIconProps) {
  return (
    <Image
      alt={alt}
      className={cn("block shrink-0 rounded-[28%] object-cover shadow-[0_8px_24px_rgba(123,47,190,0.18)]", className)}
      draggable={false}
      height={size}
      src="/icon.png"
      width={size}
    />
  )
}
