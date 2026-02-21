const BADGE_STYLES = {
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  SKIP: 'bg-yellow-100 text-yellow-800',
  COMPILE_FAIL: 'bg-orange-100 text-orange-800',
  Pass: 'bg-green-100 text-green-800',
  Fail: 'bg-red-100 text-red-800',
  Skip: 'bg-yellow-100 text-yellow-800',
  CompileFail: 'bg-orange-100 text-orange-800',
}

export default function TestResultBadge({ outcome }) {
  const style = BADGE_STYLES[outcome] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {outcome}
    </span>
  )
}
