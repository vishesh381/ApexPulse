import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TestRunner from './pages/TestRunner'
import TestResults from './pages/TestResults'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Apex Test Suite</h1>
                <div className="ml-10 flex space-x-4">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/run"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    Run Tests
                  </NavLink>
                  <NavLink
                    to="/results"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    Results
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/run" element={<TestRunner />} />
            <Route path="/results" element={<TestResults />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
