// The daily puzzle depends on "today," evaluated from the visitor's own
// clock. If this page were statically prerendered, "today" would be frozen
// at whatever date the site was last built, and every visitor would see
// that day's puzzle forever until the next deploy. Client-only rendering
// keeps it accurate day to day without needing a rebuild.
export const ssr = false;
export const prerender = false;
