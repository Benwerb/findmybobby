export default function LandingPage({ onSelect }) {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1>🚴 Find My Bobby</h1>
        <p className="subtitle">AMBBR Race Tracker</p>
        <div className="landing-buttons">
          <button className="btn btn-bobby" onClick={() => onSelect('bobby')}>
            I am Bobby
          </button>
          <button className="btn btn-fan" onClick={() => onSelect('fan')}>
            Fan of Bobby
          </button>
        </div>
      </div>
    </div>
  )
}
