import { useState } from 'react'
import LandingPage from './components/LandingPage'
import BobbyView from './components/BobbyView'
import FanView from './components/FanView'

export default function App() {
  const [view, setView] = useState('landing')

  if (view === 'bobby') return <BobbyView onBack={() => setView('landing')} />
  if (view === 'fan') return <FanView onBack={() => setView('landing')} />
  return <LandingPage onSelect={setView} />
}
