import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CoverageTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Coverage Trend</h3>
        <p className="text-gray-400 text-sm">No data available yet. Run some tests to see trends.</p>
      </div>
    )
  }

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Coverage Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={(value) => [`${value}%`, 'Coverage']} />
          <Area
            type="monotone"
            dataKey="coverage"
            stroke="#059669"
            fill="#d1fae5"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
