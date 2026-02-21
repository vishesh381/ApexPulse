import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import StatCard from '../components/StatCard'
import PassRateChart from '../components/PassRateChart'
import CoverageTrendChart from '../components/CoverageTrendChart'
import { StatCardSkeleton } from '../components/LoadingSkeleton'
import ErrorBanner from '../components/ErrorBanner'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [passRateTrend, setPassRateTrend] = useState([])
  const [coverageTrend, setCoverageTrend] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, passRateRes, coverageRes, runsRes] = await Promise.allSettled([
        api.get('/tests/org-stats'),
        api.get('/history/trends/pass-rate?days=30'),
        api.get('/history/trends/coverage?days=30'),
        api.get('/history/runs?page=0&size=5'),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (passRateRes.status === 'fulfilled') setPassRateTrend(passRateRes.value.data)
      if (coverageRes.status === 'fulfilled') setCoverageTrend(coverageRes.value.data)
      if (runsRes.status === 'fulfilled') setRecentRuns(runsRes.value.data.runs || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const lastPassRate = recentRuns.length > 0 && recentRuns[0].totalTests > 0
    ? ((recentRuns[0].passCount / recentRuns[0].totalTests) * 100).toFixed(1) + '%'
    : '--'

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Test Classes"
              value={stats?.testClasses ?? '--'}
              subtitle={stats?.orgName ? `in ${stats.orgName}` : undefined}
            />
            <StatCard
              title="Last Run Pass Rate"
              value={lastPassRate}
              color={lastPassRate !== '--' && parseFloat(lastPassRate) >= 80 ? 'text-green-600' : 'text-yellow-600'}
            />
            <StatCard
              title="Total Apex Classes"
              value={stats?.totalClasses ?? '--'}
              color="text-indigo-600"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PassRateChart data={passRateTrend} />
        <CoverageTrendChart data={coverageTrend} />
      </div>

      {/* Recent runs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Recent Test Runs</h3>
          <Link to="/results" className="text-sm text-indigo-600 hover:text-indigo-700">
            View All &rarr;
          </Link>
        </div>
        {recentRuns.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentRuns.map(run => {
              const passRate = run.totalTests > 0
                ? ((run.passCount / run.totalTests) * 100).toFixed(0)
                : 0
              return (
                <Link
                  key={run.id}
                  to={`/results/${run.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900">Run #{run.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="text-green-600">{run.passCount} passed</span>
                    <span className="text-red-600">{run.failCount} failed</span>
                    <span>{passRate}%</span>
                    <span>{run.startedAt ? new Date(run.startedAt).toLocaleDateString() : ''}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No test runs yet. Go to <Link to="/run" className="text-indigo-600 hover:underline">Run Tests</Link> to get started.
          </p>
        )}
      </div>
    </div>
  )
}
