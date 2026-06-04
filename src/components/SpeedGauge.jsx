import ReactSpeedometer from 'react-d3-speedometer'

export default function SpeedGauge({ speedMph }) {
  const value = Math.min(Math.max(speedMph ?? 0, 0), 35)

  return (
    <ReactSpeedometer
      value={value}
      minValue={0}
      maxValue={35}
      customSegmentStops={[0, 10, 20, 30, 35]}
      segmentColors={['#16a34a', '#ca8a04', '#dc2626', '#7f1d1d']}
      needleColor="white"
      needleTransitionDuration={400}
      needleTransition="easeElastic"
      currentValueText={`${value.toFixed(value < 10 ? 1 : 0)} MPH`}
      textColor="white"
      width={260}
      height={160}
      ringWidth={30}
    />
  )
}
