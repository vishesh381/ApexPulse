import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import CoverageBar from '../components/CoverageBar'
import ErrorBanner from '../components/ErrorBanner'
import { TableSkeleton } from '../components/LoadingSkeleton'

export default function CoverageDashboard() {
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [coverage, setCoverage] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    loadRuns()
  }, [])

  useEffect(() => {
    if (selectedRunId) {
      loadCoverage(selectedRunId)
    }
  }, [selectedRunId])

  const loadRuns = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/history/runs?page=0&size=10')
      setRuns(data.runs || [])
      if (data.runs?.length > 0) {
        setSelectedRunId(data.runs[0].id)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }

  const loadCoverage = async (runId) => {
    try {
      const { data } = await api.get(`/history/runs/${runId}`)
      setCoverage(data.coverage || [])
    } catch {
      setCoverage([])
    }
  }

  const filteredCoverage = useMemo(() => {
    let result = coverage.filter(c =>
      c.classOrTriggerName.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'name') {
      result.sort((a, b) => a.classOrTriggerName.localeCompare(b.classOrTriggerName))
    } else if (sortBy === 'coverage-asc') {
      result.sort((a, b) => a.coveragePercent - b.coveragePercent)
    } else if (sortBy === 'coverage-desc') {
      result.sort((a, b) => b.coveragePercent - a.coveragePercent)
    }
    return result
  }, [coverage, search, sortBy])

  const avgCoverage = coverage.length > 0
    ? (coverage.reduce((sum, c) => sum + c.coveragePercent, 0) / coverage.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Coverage</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} cols={3} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Coverage</h2>
        <ErrorBanner message={error} onRetry={loadRuns} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Coverage</h2>

      {/* Org coverage summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Overall Coverage</h3>
            <p className={`text-4xl font-bold mt-1 ${
              avgCoverage >= 75 ? 'text-green-600' : avgCoverage >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {avgCoverage}%
            </p>
            <p className="text-sm text-gray-400 mt-1">{coverage.length} classes covered</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Test Run:</label>
            <select
              value={selectedRunId || ''}
              onChange={(e) => setSelectedRunId(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {runs.map(run => (
                <option key={run.id} value={run.id}>
                  Run #{run.id} — {new Date(run.startedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search and sort */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="name">Sort by Name</option>
          <option value="coverage-asc">Coverage (Low to High)</option>
          <option value="coverage-desc">Coverage (High to Low)</option>
        </select>
      </div>

      {/* Coverage table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class / Trigger</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Covered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Uncovered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Coverage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCoverage.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.classOrTriggerName}</td>
                <td className="px-6 py-4 text-sm text-green-600">{item.linesCovered}</td>
                <td className="px-6 py-4 text-sm text-red-600">{item.linesUncovered}</td>
                <td className="px-6 py-4">
                  <CoverageBar percent={item.coveragePercent} />
                </td>
              </tr>
            ))}
            {filteredCoverage.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  {coverage.length === 0 ? 'No coverage data available. Run tests first.' : 'No matching classes.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
