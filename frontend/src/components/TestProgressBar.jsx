export default function TestProgressBar({ progress }) {
  if (!progress) return null

  const { status, totalTests, completedTests, passCount, failCount, percentComplete } = progress
  const isComplete = status === 'Completed'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          {isComplete ? 'Test Run Complete' : 'Running Tests...'}
        </h3>
        <span className="text-sm text-gray-500">
          {completedTests} / {totalTests} tests
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
        {totalTests > 0 && (
          <div className="h-full flex transition-all duration-500" style={{ width: `${percentComplete}%` }}>
            {passCount > 0 && (
              <div
                className="bg-green-500 h-full"
                style={{ width: `${(passCount / totalTests) * 100}%` }}
              />
            )}
            {failCount > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(failCount / totalTests) * 100}%` }}
              />
            )}
            {completedTests - passCount - failCount > 0 && (
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${((completedTests - passCount - failCount) / totalTests) * 100}%` }}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          Passed: {passCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          Failed: {failCount}
        </span>
        <span className="text-gray-500 ml-auto">
          {percentComplete.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
