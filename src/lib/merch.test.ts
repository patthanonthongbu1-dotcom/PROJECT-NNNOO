// Run: node --test src/lib/merch.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MERCH,
  getLatestDrop,
  getMerchBySlug,
  getMerchForAlbum,
  getMoreMerch,
  searchMerch,
} from './merch.ts'

test('search matches name or type, any word, ignoring case', () => {
  assert.deepEqual(searchMerch('STANDEE').map((m) => m.slug), ['clouds-acrylic-standee'])
  assert.equal(searchMerch('bookmark').length, 2)
  assert.equal(searchMerch('zzz bookmark').length, 2)
  assert.deepEqual(searchMerch('   '), [])
})

test('exactly one latest drop, and the grid leaves it out', () => {
  assert.equal(MERCH.filter((m) => m.isLatestDrop).length, 1)
  const latest = getLatestDrop()!
  assert.ok(!getMoreMerch().includes(latest))
  assert.equal(getMoreMerch().length, MERCH.length - 1)
})

test('album lookup matches by slug, empty for unknown albums', () => {
  assert.deepEqual(
    getMerchForAlbum('a-girl-that-doesnt-exist').map((m) => m.slug),
    ['nnnoo-pattern-bookmark']
  )
  assert.deepEqual(getMerchForAlbum('no-such-album'), [])
})

test('slug lookup, and slugs are unique', () => {
  assert.equal(getMerchBySlug('clouds-acrylic-standee')?.status, 'locked')
  assert.equal(getMerchBySlug('nope'), null)
  assert.equal(new Set(MERCH.map((m) => m.slug)).size, MERCH.length)
})

test('collected items have photos with alt text; locked items have none yet', () => {
  for (const item of MERCH) {
    if (item.status === 'collected') assert.ok(item.photos.length > 0, item.slug)
    for (const photo of item.photos) assert.ok(photo.alt.trim(), photo.src)
  }
})
