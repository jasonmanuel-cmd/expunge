type Variant = 'primary' | 'shield' | 'icon'

interface Props {
  variant?: Variant
  light?: boolean
  className?: string
  width?: number
  height?: number
}

const SRC_MAP: Record<Variant, string> = {
  primary: '/logo.svg',
  shield: '/shield.svg',
  icon: '/icon.svg',
}

const SRC_MAP_LIGHT: Record<Variant, string> = {
  primary: '/logo-light.svg',
  shield: '/shield.svg',
  icon: '/icon.svg',
}

const DIMS: Record<Variant, { w: number; h: number }> = {
  primary: { w: 320, h: 80 },
  shield: { w: 320, h: 80 },
  icon: { w: 80, h: 80 },
}

export default function ExpungeLogo({ variant = 'primary', light = false, className, width, height }: Props) {
  const src = light ? SRC_MAP_LIGHT[variant] : SRC_MAP[variant]
  const dims = DIMS[variant]
  const w = width ?? dims.w
  const h = height ?? dims.h

  return (
    <img
      src={src}
      alt="Expunge"
      width={w}
      height={h}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  )
}
