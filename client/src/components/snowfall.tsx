export function Snowfall() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="snowflake" />
      ))}
    </div>
  );
}
