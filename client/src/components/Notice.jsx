export default function Notice({ kind = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`notice notice-${kind}`} role="status">
      <span>{children}</span>
      {onClose && <button className="notice-close" type="button" aria-label="Dismiss message" onClick={onClose}>×</button>}
    </div>
  );
}
