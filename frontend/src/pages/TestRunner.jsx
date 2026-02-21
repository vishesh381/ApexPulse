import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { subscribe, disconnectWebSocket } from '../services/websocket'
import TestClassSelector from '../components/TestClassSelector'
import TestProgressBar from '../components/TestProgressBar'
import TestResultBadge from '../components/TestResultBadge'
import ErrorBanner from '../components/ErrorBanner'

export default function TestRunner() {
  const [classes, setClasses] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [dbRunId, setDbRunId] = useState(null)
  const [results, setResults] = useState(null)
  const [resultsLoading, setResultsLoading] = useState(false)

  useEffect(() => {
    loadClasses()
    return () => disconnectWebSocket()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/tests/classes')
      setClasses(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test classes')
    } finally {
      setLoading(false)
    }
  }

  const handleProgressUpdate = useCallback((data) => {
    setProgress(data)
    if (data.status === 'Completed') {
      setRunning(false)
      // Fetch detailed results
      const runId = data.dbRunId
      if (runId) {
        setDbRunId(runId)
        fetchResults(runId)
      }
    }
  }, [])

  const fetchResults = async (runId) => {
    try {
      setResultsLoading(true)
      const { data } = await api.get(`/history/runs/${runId}`)
      setResults(data)
    } catch (err) {
      console.error('Failed to fetch results:', err)
    } finally {
      setResultsLoading(false)
    }
  }

  const runTests = async () => {
    if (selectedIds.length === 0) return

    try {
      setRunning(true)
      setProgress(null)
      setResults(null)
      setDbRunId(null)
      setError(null)

      subscribe('/topic/test-progress', handleProgressUpdate)

      const { data } = await api.post('/tests/run', { classIds: selectedIds })
      setDbRunId(data.dbRunId)
    } catch (err) {
      setRunning(false)
      setError(err.response?.data?.message || 'Failed to start test run')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Run Tests</h2>
        <div className="flex gap-3">
          {dbRunId && progress?.status === 'Completed' && (
            <Link
              to={`/results/${dbRunId}`}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Full Details
            </Link>
          )}
          <button
            onClick={runTests}
            disabled={selectedIds.length === 0 || running}
            className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              selectedIds.length === 0 || running
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {running ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </span>
            ) : (
              `Run ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Tests`
            )}
          </button>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={loadClasses} /></div>}

      {(running || progress) && (
        <div className="mb-6">
          <TestProgressBar progress={progress || { status: 'Queued', totalTests: 0, completedTests: 0, passCount: 0, failCount: 0, percentComplete: 0 }} />
        </div>
      )}

      {/* Inline method-level results after completion */}
      {results && (
        <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Test Results — {results.results?.length || 0} methods
            </h3>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600 font-medium">{results.passCount} passed</span>
              <span className="text-red-600 font-medium">{results.failCount} failed</span>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.results?.map((r, idx) => (
                <ResultRow key={idx} result={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultsLoading && (
        <div className="mb-6 bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading detailed results...</p>
        </div>
      )}

      <TestClassSelector
        classes={classes}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
      />
    </div>
  )
}

function ResultRow({ result }) {
  const [expanded, setExpanded] = useState(false)
  const hasError = result.message || result.stackTrace
  const isFail = result.outcome === 'FAIL' || result.outcome === 'Fail'

  return (
    <>
      <tr
        className={`${hasError ? 'cursor-pointer hover:bg-gray-50' : ''} ${isFail ? 'bg-red-50/50' : ''}`}
        onClick={() => hasError && setExpanded(!expanded)}
      >
        <td className="px-6 py-3 text-sm text-gray-900">{result.className}</td>
        <td className="px-6 py-3 text-sm text-gray-700 font-mono text-xs">{result.methodName}</td>
        <td className="px-6 py-3"><TestResultBadge outcome={result.outcome} /></td>
        <td className="px-6 py-3 text-sm text-gray-500">{result.runTimeMs}ms</td>
      </tr>
      {expanded && hasError && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
            {result.message && (
              <p className="text-sm text-red-700 mb-2">
                <span className="font-semibold">Error: </span>{result.message}
              </p>
            )}
            {result.stackTrace && (
              <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded mt-2 max-h-48 overflow-y-auto">
                {result.stackTrace}
              </pre>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
