/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

// Game Constants
const BOARD_WIDTH = 750;
const BOARD_HEIGHT = 250;
const DINO_WIDTH = 50;
const DINO_HEIGHT = 50;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // States and refs for game logic
  const isAntigravityRef = useRef(false);
  const [isAntigravity, setIsAntigravity] = useState(false);
  const velocityY = useRef(0);
  const gravity = 0.6; // Standard value

  const dino = useRef({
    x: 50,
    y: BOARD_HEIGHT - 20 - DINO_HEIGHT,
    width: DINO_WIDTH,
    height: DINO_HEIGHT
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize board
    canvas.width = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return;
    contextRef.current = context;

    let animationId: number;

    const update = () => {
      animationId = requestAnimationFrame(update);
      const ctx = contextRef.current;
      if (!ctx) return;

      // Clear board
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Determine current gravity based on Antigravity state
      let currentGravity = isAntigravityRef.current ? 0.05 : gravity;

      // Apply gravity to velocity
      velocityY.current += currentGravity;
      
      // Calculate Dino's vertical position (y)
      dino.current.y += velocityY.current;

      const groundY = BOARD_HEIGHT - 20;
      // Prevent dino from falling below the ground
      if (dino.current.y > groundY - dino.current.height) {
        dino.current.y = groundY - dino.current.height;
        velocityY.current = 0;
      }

      // Draw Ground Line
      ctx.strokeStyle = "#535353";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(BOARD_WIDTH, groundY);
      ctx.stroke();

      // Draw Dino
      ctx.fillStyle = "black";
      ctx.fillRect(dino.current.x, dino.current.y, dino.current.width, dino.current.height);

      // Status text for canvas
      ctx.fillStyle = "#535353";
      ctx.font = "14px 'Courier New'";
      ctx.textAlign = "left";
      ctx.fillText(`Space: Jump | G: Antigravity (${isAntigravityRef.current ? 'ON' : 'OFF'})`, 10, 20);
    };

    // Start game loop
    animationId = requestAnimationFrame(update);

    // Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        const groundY = BOARD_HEIGHT - 20;
        if (dino.current.y === groundY - dino.current.height) {
           velocityY.current = -12; // Jump velocity
        }
      } else if (e.code === 'KeyG' || e.key === 'g') {
        isAntigravityRef.current = !isAntigravityRef.current;
        setIsAntigravity(isAntigravityRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-3xl font-bold text-[#535353] mb-4">Dino Run</h1>
      <canvas 
        id="board" 
        ref={canvasRef}
        className="rounded-lg shadow-md border border-gray-200 bg-[#f7f7f7]"
      />
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">
          Expert Setup: React + Canvas API
        </p>
        <span className={`px-3 py-1 text-sm rounded-full ${isAntigravity ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-600'}`}>
          Antigravity Status: {isAntigravity ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
