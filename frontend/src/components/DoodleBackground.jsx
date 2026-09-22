const TILE = 260;

function Bill({ x, y, r = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x="-30" y="-16" width="60" height="32" rx="5" />
      <rect x="-23" y="-10" width="46" height="20" rx="3" />
      <circle cx="0" cy="0" r="7" />
      <path d="M-2 -3.5 h3 a2 2 0 0 1 0 4 h-3 a2 2 0 0 0 0 4 h3 M0 -5 v10" strokeWidth="1.4" />
    </g>
  );
}

function Coin({ x, y, symbol, r = 0, size = 14 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <circle cx="0" cy="0" r={size} />
      <circle cx="0" cy="0" r={size - 4} strokeDasharray="2 3" />
      <text x="0" y={size * 0.42} textAnchor="middle" fontSize={size * 1.15} fontWeight="700" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" strokeWidth="1.1">{symbol}</text>
    </g>
  );
}

function Eth({ x, y, r = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 -16 L11 2 L0 9 L-11 2 Z" />
      <path d="M0 -16 V9 M-11 2 L0 -3 L11 2 M-11 6 L0 20 L11 6" />
    </g>
  );
}

function Stack({ x, y, r = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse cx="0" cy="8" rx="16" ry="5" />
      <path d="M-16 8 V0 a16 5 0 0 1 32 0 V8 M-16 0 V-8 a16 5 0 0 1 32 0 V0" />
      <ellipse cx="0" cy="-8" rx="16" ry="5" />
    </g>
  );
}

function Tile() {
  return (
    <>
      <Bill x={48} y={44} r={-12} />
      <Coin x={150} y={40} symbol="$" r={8} />
      <Coin x={218} y={98} symbol="€" r={-6} size={13} />
      <Eth x={60} y={140} r={10} />
      <Coin x={135} y={128} symbol="₿" r={-10} size={16} />
      <Bill x={200} y={200} r={14} />
      <Stack x={40} y={222} r={-4} />
      <Coin x={120} y={222} symbol="₮" r={6} size={12} />
      <path d="M180 150 q6 -10 12 0 q6 10 12 0" strokeWidth="1.3" />
      <path d="M92 86 l4 -4 l4 4 M96 82 v10" strokeWidth="1.3" />
    </>
  );
}

export default function DoodleBackground() {
  return (
    <div className="doodle pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true" data-testid="doodle-bg">
      <svg className="doodle-layer doodle-layer-a absolute" width="200%" height="200%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="doodle-a" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><Tile /></g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#doodle-a)" />
      </svg>
      <svg className="doodle-layer doodle-layer-b absolute" width="200%" height="200%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="doodle-b" width={TILE * 1.5} height={TILE * 1.5} patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.35)"><Tile /></g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#doodle-b)" />
      </svg>
    </div>
  );
}
