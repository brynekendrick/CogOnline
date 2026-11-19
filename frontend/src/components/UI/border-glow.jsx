export default function BorderGlow({ children, className = "", borderRadius = 16 }) {
  return (
    <div className={className} style={{ borderRadius }}>
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}