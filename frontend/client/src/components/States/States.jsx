import { FiInbox } from "react-icons/fi";

/**
 * Centred loading indicator for first-load / in-flight data.
 *
 * Replaces the previous pattern of reusing the .empty-state class for
 * "Loading..." text, which gave the user no motion cue that work was
 * actually happening.
 */
export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Empty state for a list or panel that has loaded successfully but has
 * nothing to show. `action` renders below the copy - typically the button
 * that resolves the emptiness ("Create the first team").
 */
export function EmptyState({ icon: Icon = FiInbox, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        <Icon />
      </span>

      {title && <p className="empty-state-title">{title}</p>}
      {text && <p className="empty-state-text">{text}</p>}

      {action}
    </div>
  );
}

/**
 * Inline error panel with an optional retry affordance, for when a request
 * fails outright rather than returning nothing.
 */
export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="empty-state">
      <p className="error-text" style={{ marginBottom: onRetry ? 12 : 0 }}>
        {message}
      </p>

      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
