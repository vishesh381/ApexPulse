import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ErrorBanner from '../components/ErrorBanner'
import { TableSkeleton } from '../components/LoadingSkeleton'

export default function TestResults() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadRuns()
  }, [page])

  const loadRuns = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get(`/history/runs?page=${page}&size=15`)
      setRuns(data.runs || [])
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Results</h2>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={loadRuns} /></div>}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : runs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-2">No test runs found.</p>
          <p className="text-sm text-gray-400">
            Go to <Link to="/run" className="text-indigo-600 hover:underline">Run Tests</Link> to execute your first test run.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map(run => {
                  const passRate = run.totalTests > 0
                    ? ((run.passCount / run.totalTests) * 100).toFixed(0)
                    : 0
                  const duration = run.startedAt && run.completedAt
                    ? formatDuration(new Date(run.completedAt) - new Date(run.startedAt))
                    : '--'

                  return (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/results/${run.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          #{run.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          run.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="text-green-600">{run.passCount}</span>
                        {' / '}
                        <span className="text-red-600">{run.failCount}</span>
                        {' / '}
                        <span>{run.totalTests}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          passRate >= 80 ? 'text-green-600' : passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {passRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {run.startedAt ? new Date(run.startedAt).toLocaleString() : '--'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{duration}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}
