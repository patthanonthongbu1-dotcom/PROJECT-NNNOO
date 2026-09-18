/**
 * Edit mode is remembered in a cookie rather than in `localStorage`.
 *
 * The difference matters on the first paint: the server can read a cookie, so
 * a page reloaded in edit mode renders editable straight away. Web storage is
 * invisible to the server, so it would mean rendering the reading view and
 * then flipping it after hydration — a flash on every navigation, and a
 * hydration mismatch if read during render.
 *
 * It is a UI preference, not a permission. Whether the cookie is honoured is
 * decided by `isAdmin()` on the server, and every write is checked again by
 * `requireAdmin()` and by row level security.
 */
export const EDIT_MODE_COOKIE = 'edit-mode'

/** A year: long enough that the toggle stays where you left it. */
export const EDIT_MODE_MAX_AGE = 60 * 60 * 24 * 365
