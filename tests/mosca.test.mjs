import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { moscaVerdict } from './mosca.mjs'

describe('Mosca calculator', () => {
  it('flags exposure when X + Y exceeds remaining years to threat date', () => {
    const now = new Date('2026-08-15T12:00:00Z')
    const result = moscaVerdict({
      shelfYears: 10,
      migrationYears: 5,
      quantumYear: 2035,
      now,
    })
    assert.equal(result.total, 15)
    assert.equal(result.atRisk, true)
    assert.ok(result.z < 15)
    assert.ok(result.exposure > 0)
  })

  it('is within tolerance when the protection window fits', () => {
    const now = new Date('2026-08-15T12:00:00Z')
    const result = moscaVerdict({
      shelfYears: 3,
      migrationYears: 2,
      quantumYear: 2035,
      now,
    })
    assert.equal(result.total, 5)
    assert.equal(result.atRisk, false)
    assert.ok(result.z > 5)
  })
})
