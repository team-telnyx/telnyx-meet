export function NetworkMetricsMonitor({
  connectionQuality,
}: {
  connectionQuality: number;
}) {
  const STEP = 3;
  const BARS_ARRAY = [0, 1, 2, 3, 4];

  return (
    <div
      style={{
        borderRadius: 4,
        backgroundColor: '#84807C',
        width: 20,
        margin: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '20px',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        {BARS_ARRAY.map((level) => (
          <div
            key={level}
            style={{
              width: '2px',
              marginRight: '1px',
              height: `${STEP * (level + 1)}px`,
              background:
                connectionQuality > level
                  ? 'white'
                  : 'rgba(255, 255, 255, 0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
