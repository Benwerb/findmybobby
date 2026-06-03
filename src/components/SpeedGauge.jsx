const CX = 60, CY = 65
const OUTER_R = 55, INNER_R = 40
const MAX_SPEED = 35

function pt(angleDeg, r) {
  const rad = (angleDeg * Math.PI) / 180
  return [+(CX + r * Math.cos(rad)).toFixed(3), +(CY - r * Math.sin(rad)).toFixed(3)]
}

// Annular sector counterclockwise from startAngle → endAngle (standard math angles)
function sector(startAngle, endAngle, ro, ri) {
  const span = startAngle - endAngle
  const lg = span >= 180 ? 1 : 0
  const [ox1, oy1] = pt(startAngle, ro)
  const [ox2, oy2] = pt(endAngle, ro)
  const [ix2, iy2] = pt(endAngle, ri)
  const [ix1, iy1] = pt(startAngle, ri)
  return `M${ox1} ${oy1}A${ro} ${ro} 0 ${lg} 0 ${ox2} ${oy2}L${ix2} ${iy2}A${ri} ${ri} 0 ${lg} 1 ${ix1} ${iy1}Z`
}

// 0 mph → 180° (left), 35 mph → 0° (right), 17.5 mph → 90° (top)
function speedToAngle(mph) {
  return 180 - (Math.min(Math.max(mph, 0), MAX_SPEED) / MAX_SPEED) * 180
}

const ZONES = [
  { from: 0,  to: 10, fill: '#16a34a' },  // green
  { from: 10, to: 20, fill: '#ca8a04' },  // yellow
  { from: 20, to: 30, fill: '#dc2626' },  // red
  { from: 30, to: 35, fill: '#7f1d1d' },  // dark red
]

export default function SpeedGauge({ speedMph }) {
  const speed = Math.max(0, speedMph ?? 0)
  const needleAngle = speedToAngle(speed)
  const [nx, ny] = pt(needleAngle, INNER_R - 2)

  return (
    <svg viewBox="0 0 120 70" width="130" height="76" aria-label={`${speed.toFixed(1)} mph`}>
      {/* Background track */}
      <path d={sector(180, 0, OUTER_R, INNER_R)} fill="#1a1a1a" />

      {/* Colored zone arcs */}
      {ZONES.map(({ from, to, fill }) => (
        <path
          key={from}
          d={sector(speedToAngle(from), speedToAngle(to), OUTER_R - 1, INNER_R + 1)}
          fill={fill}
        />
      ))}

      {/* Zone boundary tick marks */}
      {[10, 20, 30].map((mph) => {
        const a = speedToAngle(mph)
        const [x1, y1] = pt(a, OUTER_R + 2)
        const [x2, y2] = pt(a, OUTER_R + 7)
        return <line key={mph} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
      })}

      {/* End labels */}
      <text x="4"   y="68" fill="#888" fontSize="7" fontFamily="sans-serif">0</text>
      <text x="108" y="68" fill="#888" fontSize="7" fontFamily="sans-serif">35</text>

      {/* Needle */}
      <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="5"   fill="#333" />
      <circle cx={CX} cy={CY} r="2.5" fill="white" />

      {/* Speed readout */}
      <text
        x={CX} y="53"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {speed >= 10 ? speed.toFixed(0) : speed.toFixed(1)}
      </text>
      <text
        x={CX} y="63"
        textAnchor="middle"
        fill="#999"
        fontSize="7.5"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        MPH
      </text>
    </svg>
  )
}
