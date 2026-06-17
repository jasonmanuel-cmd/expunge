type Variant = 'primary' | 'shield' | 'icon'

interface Props {
  variant?: Variant
  /** true = white wordmark for dark backgrounds; false = dark wordmark for light backgrounds */
  light?: boolean
  className?: string
  width?: number
  height?: number
}

const DIMS: Record<Variant, { w: number; h: number }> = {
  primary: { w: 320, h: 80 },
  shield: { w: 320, h: 80 },
  icon: { w: 80, h: 80 },
}

/**
 * Expunge primary logo — rendered INLINE as SVG (not an <img src>) so it always
 * paints, can't be blocked by browser extensions, and adapts color to the page.
 * Matches the official brand package (expunge-primary-transparent-dark/white).
 */
export default function ExpungeLogo({ variant = 'primary', light = false, className, width, height }: Props) {
  const dims = DIMS[variant]
  const w = width ?? dims.w
  const h = height ?? dims.h

  // Wordmark + document-line colors flip for dark vs light backgrounds.
  const wordmark = light ? '#FFFFFF' : '#0D1B2E'
  const docLines = light ? '#4a7fa8' : '#1A2E4A'

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 320 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Expunge"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* document outline */}
      <rect x="10" y="12" width="34" height="44" rx="5" fill="none" stroke="#2D6BE4" strokeWidth="2.5" />
      {/* folded corner crease */}
      <polyline points="32,12 44,26 32,26" fill="none" stroke="#2D6BE4" strokeWidth="2" strokeLinejoin="round" />
      {/* document lines */}
      <line x1="16" y1="34" x2="40" y2="34" stroke={docLines} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="42" x2="40" y2="42" stroke={docLines} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="50" x2="30" y2="50" stroke={docLines} strokeWidth="1.5" strokeLinecap="round" />
      {/* red X strike */}
      <line x1="10" y1="12" x2="44" y2="56" stroke="#E63946" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="44" y1="12" x2="10" y2="56" stroke="#E63946" strokeWidth="3.5" strokeLinecap="round" />
      {/* wordmark */}
      <text
        x="62"
        y="55"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="36"
        fontWeight="700"
        fill={wordmark}
        letterSpacing="1.5"
      >
        EXPUNGE
      </text>
    </svg>
  )
}
