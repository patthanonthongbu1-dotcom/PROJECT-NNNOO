// Run: node --test src/lib/format.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupByYear, parseProse } from './format.ts'

test('parseProse splits paragraphs and [Heading] lines', () => {
  assert.deepEqual(parseProse('One\nline two\n\n[Where]\nKitchen.\r\n\r\nEnd'), [
    { kind: 'paragraph', text: 'One\nline two' },
    { kind: 'heading', text: 'Where' },
    { kind: 'paragraph', text: 'Kitchen.' },
    { kind: 'paragraph', text: 'End' },
  ])
  assert.deepEqual(parseProse(''), [])
})

test('groupByYear sorts newest first, undated last', () => {
  const groups = groupByYear([
    { release_date: '2023-01-01' },
    { release_date: null },
    { release_date: '2025-05-05' },
    { release_date: '2023-09-09' },
  ])
  assert.deepEqual(groups.map(([y, items]) => [y, items.length]), [
    ['2025', 1],
    ['2023', 2],
    ['', 1],
  ])
})

test('pickCouplet skips headers and wraps the seed', async () => {
  const { pickCouplet } = await import('./annotations.ts')
  const lyrics = '[Verse]\na\nb\nc\n\n[Chorus]\nd\ne'
  assert.deepEqual(pickCouplet(lyrics, 0), ['a', 'b'])
  assert.deepEqual(pickCouplet(lyrics, 3), ['d', 'e'])
  assert.equal(pickCouplet('[Intro]\n\n', 0), null)
})

test('timeUntil splits the gap and returns null once released', async () => {
  const { timeUntil } = await import('./format.ts')
  const now = Date.parse('2026-10-20T00:00:00Z')
  assert.deepEqual(timeUntil('2026-10-22', now - 61_000), {
    days: 2, hours: 0, minutes: 1, seconds: 1,
  })
  assert.equal(timeUntil('2026-10-20', now), null)
  assert.equal(timeUntil('2026-10-19', now), null)
})
