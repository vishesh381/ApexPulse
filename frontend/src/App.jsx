import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import TestRunner from './pages/TestRunner'
import TestResults from './pages/TestResults'
import TestRunDetail from './pages/TestRunDetail'
import CoverageDashboard from './pages/CoverageDashboard'

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
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
                        <NavLink
                          to="/coverage"
                          className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`
                          }
                        >
                          Coverage
                        </NavLink>
                      </div>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-4">
                        {user && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{user.displayName}</span>
                            {user.orgName && (
                              <span className="ml-1 text-gray-400">({user.orgName})</span>
                            )}
                          </div>
                        )}
                        <button
                          onClick={logout}
                          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </nav>

              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/run" element={<TestRunner />} />
                  <Route path="/results" element={<TestResults />} />
                  <Route path="/results/:runId" element={<TestRunDetail />} />
                  <Route path="/coverage" element={<CoverageDashboard />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
