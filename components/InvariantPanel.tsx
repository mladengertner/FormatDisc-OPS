import React from 'react';

/**
 * InvariantPanel
 *
 * A static, declarative panel that shows the permanent kernel invariants.
 * Rendered only when:
 *   - process.env.NODE_ENV === 'development'
 *   - OR the URL contains "?debug_invariants"
 *
 * No hooks, no state, no side‑effects – pure presentation.
 */

/* -----------------------------------------------------------------
   Static configuration – the immutable truths.
   ----------------------------------------------------------------- */
const INVARIANTS: Record<string, string[]> = {
  'Motion Law': [
    'Motion: cubic-bezier(0.22, 1, 0.36, 1)',
    'Minimum Duration: 800 ms',
    'Temporal Source: Kernel Time',
  ],
  'Identity Law': [
    'Identity: Static',
    'Color: Deterministic Hash',
    'State Transitions: Explicit',
  ],
  'Kernel Law': [
    'Language: English_Academic_Precise',
    'Audit Stamp: Per‑Transition',
    'Side Effects: None',
  ],
  'UI/UX Law': [
    'Animation Curve: ease-in-out',
    'Interaction Feedback: Subtle highlight',
    'Visual Priority: Low',
  ],
};

/* -----------------------------------------------------------------
   Helper – decides whether the panel should be shown.
   ----------------------------------------------------------------- */
function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;

  // process.env.NODE_ENV is a build-time constant in most toolchains.
  // Casting to any to avoid TS issues in environments where process might not be fully typed.
  const devEnv = (process.env as any).NODE_ENV === 'development';
  const urlFlag = new URLSearchParams(window.location.search).has('debug_invariants');

  return devEnv || urlFlag;
}

/* -----------------------------------------------------------------
   The component itself.
   ----------------------------------------------------------------- */
const InvariantPanel: React.FC = () => {
  if (!shouldShow()) return null;

  return (
    <aside
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        maxWidth: 'calc(100% - 16px)',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.65)',
        color: '#e0e0e0',
        fontFamily: `'SF Mono', 'Menlo', 'Consolas', monospace`,
        fontSize: 11,
        lineHeight: 1.4,
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 9999,
        whiteSpace: 'pre-wrap',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      aria-label="Kernel invariants (debug panel)"
    >
      {Object.entries(INVARIANTS).map(([section, lines]) => (
        <div key={section} style={{ marginBottom: 4 }}>
          <strong style={{ color: '#ffcc66' }}>{section}:</strong>
          {" "}
          {lines.map((ln, i) => (
            <span key={i}>
              {ln}
              {i < lines.length - 1 ? " | " : ""}
            </span>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default InvariantPanel;