import Image from 'next/image'

type Variant = 'primary' | 'shield' | 'icon'
type Theme = 'dark' | 'light'

interface Props {
  variant?: Variant
  theme?: Theme
  className?: string
  width?: number
  height?: number
}

const SRC_MAP: Record<Variant, Record<Theme, string>> = {
  primary: { dark: '/logo.svg', light: '/logo-light.svg' },
  shield: { dark: '/shield.svg', light: '/shield.svg' },
  icon: { dark: '/icon.svg', light: '/icon.svg' },
}

const DIMS: Record<Variant, { w: number; h: number }> = {
  primary: { w: 320, h: 80 },
  shield: { w: 320, h: 80 },
  icon: { w: 80, h: 80 },
}

export default function ExpungeLogo({ variant = 'primary', theme = 'dark', className, width, height }: Props) {
  const src = SRC_MAP[variant][theme]
  const dims = DIMS[variant]

  return (
    <Image
      src={src}
      alt="Expunge"
      width={width ?? dims.w}
      height={height ?? dims.h}
      className={className}
      priority
    />
  )
}
