// Run: node --test src/lib/merch.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEMO_MERCH as MERCH,
  getLatestDrop,
  getMerchBySlug,
  getMerchForAlbum,
  getMoreMerch,
  merchFromRow,
  searchMerch,
  type MerchItem,
} from './merch.ts'

const standee: MerchItem = {
  ...MERCH[0],
  id: 'x',
  slug: 'standee',
  name: 'Clouds Standee',
  type: 'standee',
  isLatestDrop: false,
  albumSlug: null,
}
const items = [...MERCH, standee]

test('search matches name or type, any word, ignoring case', () => {
  assert.deepEqual(searchMerch('STANDEE', items).map((m) => m.slug), ['standee'])
  assert.equal(searchMerch('zzz girl', items).length, 1)
  assert.equal(searchMerch('bookmark standee', items).length, 2)
  assert.deepEqual(searchMerch('   ', items), [])
})

test('latest drop is left out of the grid', () => {
  assert.equal(getLatestDrop(items)?.slug, 'agtde-bookmark')
  assert.deepEqual(getMoreMerch(items), [standee])
  assert.equal(getLatestDrop([standee]), null)
})

test('album lookup matches by slug, empty for unknown albums', () => {
  assert.deepEqual(
    getMerchForAlbum('a-girl-that-doesnt-exist', items).map((m) => m.slug),
    ['agtde-bookmark']
  )
  assert.deepEqual(getMerchForAlbum('no-such-album', items), [])
})

test('slug lookup', () => {
  assert.equal(getMerchBySlug('standee', items), standee)
  assert.equal(getMerchBySlug('nope', items), null)
})

test('database row maps to an item, unpaired album -> null slug', () => {
  const item = merchFromRow({
    id: 'id1', slug: 's', name: 'N', type: 'bookmark', status: 'locked',
    drop_date: '2027-01-01', album_id: null, album: null,
    size: '1', finish: '2', printed_by: '3', released: '4', edition: '5',
    header_tint: '#000000', art_bg: '#ffffff', photos: [], is_latest_drop: true,
  })
  assert.equal(item.albumSlug, null)
  assert.equal(item.dropDate, '2027-01-01')
  assert.deepEqual(item.specs, { size: '1', finish: '2', printedBy: '3', released: '4', edition: '5' })
  assert.deepEqual(item.colors, { headerTint: '#000000', artBg: '#ffffff' })
  assert.equal(item.isLatestDrop, true)
})

test('demo photos have alt text', () => {
  for (const item of MERCH) for (const photo of item.photos) assert.ok(photo.alt.trim(), photo.src)
})
