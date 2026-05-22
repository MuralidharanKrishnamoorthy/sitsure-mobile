// Stub for @opentelemetry/api — required by @supabase/supabase-js but unused at runtime in RN
module.exports = {
  trace: {
    getActiveSpan: () => null,
    getTracer: () => ({
      startActiveSpan: (_name, fn) => fn({ end: () => {} }),
      startSpan: () => ({ end: () => {}, setAttribute: () => {} }),
    }),
  },
  context: {
    with: (_ctx, fn) => fn(),
    active: () => ({}),
  },
  propagation: {
    inject: () => {},
    extract: (_ctx) => _ctx,
  },
  diag: {
    setLogger: () => {},
    createComponentLogger: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
  },
  SpanStatusCode: { OK: 1, ERROR: 2, UNSET: 0 },
};
