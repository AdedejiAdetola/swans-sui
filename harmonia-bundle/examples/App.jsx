// Example integration of Harmonia Swan UI in a React app
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HarmoniaPage from '../pages/Harmonia'

// Example: Full page integration
function App() {
  return (
    <Router>
      <Routes>
        {/* Add Harmonia page to your existing routes */}
        <Route path="/harmonia" element={<HarmoniaPage />} />
        <Route path="/swan" element={<HarmoniaPage />} />
        {/* Your other routes */}
      </Routes>
    </Router>
  )
}

export default App