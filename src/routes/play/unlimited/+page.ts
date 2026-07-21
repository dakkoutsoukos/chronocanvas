// Unlimited mode picks a fresh random set every load. If this page were
// server-rendered (or prerendered), the SSR pass and the client hydration
// pass would each call Math.random() independently and pick *different*
// artworks — the classic symptom being an image and title that don't match,
// since one text node hydrates from the server pick and another element
// patches to the client's differing pick. Forcing client-only rendering
// means the random pick happens exactly once, in the browser.
export const ssr = false;
export const prerender = false;
