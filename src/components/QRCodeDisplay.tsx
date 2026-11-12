/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Lightweight visual QR code representation for room pairing
export const QRCodeDisplay: React.FC<{ value: string; size?: number }> = ({ value, size = 160 }) => {
  // Generate deterministic grid pattern based on string hash
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Position detection patterns (top-left, top-right, bottom-left)
  const addCornerSquare = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          cells[r + i][c + j] = true;
        }
      }
    }
  };

  addCornerSquare(0, 0);
  addCornerSquare(0, gridSize - 7);
  addCornerSquare(gridSize - 7, 0);

  // Pseudo-random data filling based on value hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  let seed = Math.abs(hash) || 12345;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite corner squares
      if ((r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8)) {
        continue;
      }
      seed = (seed * 9301 + 49297) % 233280;
      cells[r][c] = seed / 233280 > 0.45;
    }
  }

  const cellSize = size / gridSize;

  return (
    <div
      className="p-3 bg-white rounded-xl shadow-inner inline-block border border-neutral-200"
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
