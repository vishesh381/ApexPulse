export default function CoverageBar({ percent }) {
  const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = percent >= 75 ? 'text-green-700' : percent >= 50 ? 'text-yellow-700' : 'text-red-700'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-medium ${textColor} w-12 text-right`}>
        {percent.toFixed(0)}%
      </span>
    </div>
  )
}
