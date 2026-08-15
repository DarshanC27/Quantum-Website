/**
 * Mosca exposure formula mirrored from assets/app.js / quantumready engine.
 * Kept as a pure module so tests can lock the marketing calculator to the product math.
 */
export function fractionalYearRemaining(quantumYear, now = new Date()) {
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now - startOfYear) / 86400000)
  return quantumYear - (now.getFullYear() + dayOfYear / 365)
}

export function moscaVerdict({ shelfYears, migrationYears, quantumYear, now = new Date() }) {
  const x = shelfYears
  const y = migrationYears
  const z = fractionalYearRemaining(quantumYear, now)
  const total = x + y
  const atRisk = total > z
  const exposure = total - z
  const deadlineYear = Math.floor(quantumYear - x - y)
  return { x, y, z, total, atRisk, exposure, deadlineYear }
}
