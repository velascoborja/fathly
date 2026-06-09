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
      className={cn("shrink-0 rounded-lg", className)}
      height={size}
      src="/icon-512.png"
      width={size}
    />
  )
}
