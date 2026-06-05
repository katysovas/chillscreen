/** Mount Rainier — broad snow-capped stratovolcano backdrop. */
export function MountRainier() {
  const peakX = 1855;
  const peakY = 268;

  return (
    <g>
      <path
        d={`M1235,578 Q1500,508 1655,422 Q1770,344 ${peakX},${peakY} Q1948,344 2065,422 Q2235,508 2498,578 Z`}
        fill="#a8b5c7"
      />
      <path
        d={`M1235,578 Q1500,508 1655,422 Q1770,344 ${peakX},${peakY} Q1948,344 2065,422 Q2235,508 2498,578 Z`}
        fill="rgba(202,216,236,.28)"
      />
      <path
        d={`M1640,452 Q1700,392 1762,346 Q1812,302 ${peakX},${peakY}
            Q1900,302 1952,350 Q2014,396 2074,456
            L2030,442 L1992,458 L1948,440 L1906,456 L1868,440
            L1840,456 L1800,440 L1758,458 L1716,440 L1678,456 Z`}
        fill="#eef2f8"
      />
      <path d={`M${peakX},288 L1846,430`} stroke="#e2e9f3" strokeWidth={6} opacity={0.7} />
      <path d="M1812,332 L1792,432" stroke="#e2e9f3" strokeWidth={4} opacity={0.6} />
      <path d="M1900,332 L1918,432" stroke="#e2e9f3" strokeWidth={4} opacity={0.6} />
      <path
        d={`M1820,300 Q${peakX},${peakY} 1892,302`}
        stroke="rgba(255,236,210,.5)"
        strokeWidth={3}
        fill="none"
      />
    </g>
  );
}
