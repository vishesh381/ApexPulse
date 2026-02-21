import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import TestResultBadge from '../components/TestResultBadge'
import ErrorBanner from '../components/ErrorBanner'
import { TableSkeleton } from '../components/LoadingSkeleton'

export default function TestRunDetail() {
  const { runId } = useParams()
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    loadRunDetail()
  }, [runId])

  const loadRunDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get(`/history/runs/${runId}`)
      setRun(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test run details')
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = run?.results?.filter(r => {
    if (filter === 'All') return true
    return r.outcome === filter
  }) || []

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Run Details</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} cols={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Run Details</h2>
        <ErrorBanner message={error} onRetry={loadRunDetail} />
      </div>
    )
  }

  if (!run) return null

  const passRate = run.totalTests > 0 ? ((run.passCount / run.totalTests) * 100).toFixed(1) : 0

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/results" className="text-indigo-600 hover:text-indigo-700">
          &larr; Back to Results
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Run #{run.id}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {run.status}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Tests</p>
          <p className="text-2xl font-semibold">{run.totalTests}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Passed</p>
          <p className="text-2xl font-semibold text-green-600">{run.passCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-semibold text-red-600">{run.failCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-semibold text-indigo-600">{passRate}%</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['All', 'PASS', 'FAIL', 'SKIP'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f} {f !== 'All' && `(${run.results?.filter(r => r.outcome === f).length || 0})`}
          </button>
        ))}
      </div>

      {/* Results table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Runtime</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResults.map((result, idx) => (
              <ResultRow key={idx} result={result} />
            ))}
            {filteredResults.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  No results match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ResultRow({ result }) {
  const [expanded, setExpanded] = useState(false)
  const hasError = result.message || result.stackTrace

  return (
    <>
      <tr
        className={`${hasError ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasError && setExpanded(!expanded)}
      >
        <td className="px-6 py-4 text-sm text-gray-900">{result.className}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{result.methodName}</td>
        <td className="px-6 py-4"><TestResultBadge outcome={result.outcome} /></td>
        <td className="px-6 py-4 text-sm text-gray-500">{result.runTimeMs}ms</td>
      </tr>
      {expanded && hasError && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50">
            {result.message && (
              <p className="text-sm text-red-700 mb-2">
                <strong>Message:</strong> {result.message}
              </p>
            )}
            {result.stackTrace && (
              <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded">
                {result.stackTrace}
              </pre>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
