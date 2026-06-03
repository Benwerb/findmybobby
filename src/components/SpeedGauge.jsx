const CX = 100, CY = 110
const OUTER_R = 88, INNER_R = 63
const MAX_SPEED = 35
const NUMBER_R = OUTER_R + 16

function pt(angleDeg, r) {
  const rad = angleDeg * Math.PI / 180
  return [+(CX + r * Math.cos(rad)).toFixed(3), +(CY - r * Math.sin(rad)).toFixed(3)]
}

function sector(startAngle, endAngle, ro, ri) {
  const span = startAngle - endAngle
  const lg = span >= 180 ? 1 : 0
  const [ox1, oy1] = pt(startAngle, ro)
  const [ox2, oy2] = pt(endAngle, ro)
  const [ix2, iy2] = pt(endAngle, ri)
  const [ix1, iy1] = pt(startAngle, ri)
  return `M${ox1} ${oy1}A${ro} ${ro} 0 ${lg} 0 ${ox2} ${oy2}L${ix2} ${iy2}A${ri} ${ri} 0 ${lg} 1 ${ix1} ${iy1}Z`
}

function speedToAngle(mph) {
  return 180 - (Math.min(Math.max(mph, 0), MAX_SPEED) / MAX_SPEED) * 180
}

const ZONES = [
  { from: 0,  to: 10, fill: '#16a34a' },
  { from: 10, to: 20, fill: '#ca8a04' },
  { from: 20, to: 30, fill: '#dc2626' },
  { from: 30, to: 35, fill: '#7f1d1d' },
]

const ALL_TICKS  = Array.from({ length: 36 }, (_, i) => i)
const MAJOR_TICKS = [0, 5, 10, 15, 20, 25, 30, 35]

export default function SpeedGauge({ speedMph }) {
  const speed = Math.max(0, speedMph ?? 0)
  const angle = speedToAngle(speed)
  const [tipX, tipY] = pt(angle, INNER_R - 4)
  const [lx, ly]    = pt(angle + 90, 5)
  const [rx, ry]    = pt(angle - 90, 5)

  return (
    <svg viewBox="-10 -5 220 120" width="280" height="153">
      {/* Dark semicircle background */}
      <path
        d={`M${CX - OUTER_R - 6} ${CY} A${OUTER_R + 6} ${OUTER_R + 6} 0 1 1 ${CX + OUTER_R + 6} ${CY} Z`}
        fill="#111"
      />

      {/* Colored zone arcs */}
      {ZONES.map(({ from, to, fill }) => (
        <path key={from} d={sector(speedToAngle(from), speedToAngle(to), OUTER_R, INNER_R)} fill={fill} />
      ))}

      {/* Tick marks */}
      {ALL_TICKS.map((mph) => {
        const isMajor = mph % 5 === 0
        const a = speedToAngle(mph)
        const [x1, y1] = pt(a, OUTER_R + 3)
        const [x2, y2] = pt(a, isMajor ? OUTER_R - 12 : OUTER_R - 5)
        return (
          <line
            key={mph}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isMajor ? 'white' : 'rgba(255,255,255,0.45)'}
            strokeWidth={isMajor ? 2 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* Numbers at major ticks */}
      {MAJOR_TICKS.map((mph) => {
        const [x, y] = pt(speedToAngle(mph), NUMBER_R)
        return (
          <text
            key={mph}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="9"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            {mph}
          </text>
        )
      })}

      {/* Needle (triangle from center to arc) */}
      <polygon points={`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`} fill="white" />

      {/* Center cap */}
      <circle cx={CX} cy={CY} r="9" fill="#222" />
      <circle cx={CX} cy={CY} r="5" fill="white" />

      {/* Speed readout */}
      <text x={CX} y={CY - 26} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="sans-serif">
        {speed >= 10 ? speed.toFixed(0) : speed.toFixed(1)}
      </text>
      <text x={CX} y={CY - 12} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="sans-serif" letterSpacing="1">
        MPH
      </text>
    </svg>
  )
}
