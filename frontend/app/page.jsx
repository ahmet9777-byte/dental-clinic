// The homepage lives at app/(public)/page.jsx
// This root page.jsx catches the bare "/" route when not inside the (public) group.
// Next.js App Router resolves (public)/page.jsx first, so this is a safe fallback.

export { default } from './(public)/page';
