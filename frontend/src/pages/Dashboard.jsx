export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Test Classes</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Last Run Pass Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">--</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Org Connection</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
      </div>
    </div>
  )
}
