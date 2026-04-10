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
const DINO_WIDTH = 88;
const DINO_HEIGHT = 94;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // States and refs for game logic
  const isAntigravityRef = useRef(false);
  const [isAntigravity, setIsAntigravity] = useState(false);
  
  const gameOverRef = useRef(false);
  const cactusArray = useRef<any[]>([]);
  const cactusSpeedX = -8;

  const velocityY = useRef(0);
  const gravity = 0.2; // Adjusted for floating jump

  const dino = useRef({
    x: 50,
    y: BOARD_HEIGHT - 20 - DINO_HEIGHT,
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
    isDead: false
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
    let cactusTimer: ReturnType<typeof setTimeout>;

    // Collision detection utility
    const detectCollision = (a: any, b: any) => {
      return a.x < b.x + b.width &&   
             a.x + a.width > b.x &&   
             a.y < b.y + b.height &&  
             a.y + a.height > b.y;    
    };

    // Cactus spawning logic
    const placeCactus = () => {
      if (gameOverRef.current) return;

      const cactus = {
        x: BOARD_WIDTH,
        y: BOARD_HEIGHT - 20 - 70, // Basic cactus height
        width: 40,
        height: 70
      };

      cactusArray.current.push(cactus);

      // Random wait between 1.5 to 2 seconds
      const nextSpawn = Math.random() * 500 + 1500;
      cactusTimer = setTimeout(placeCactus, nextSpawn);
    };

    const update = () => {
      if (gameOverRef.current) return;
      
      animationId = requestAnimationFrame(update);
      const ctx = contextRef.current;
      if (!ctx) return;

      // Clear board
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Apply Gravity
      let currentGravity = isAntigravityRef.current ? 0.05 : gravity;
      velocityY.current += currentGravity;
      dino.current.y += velocityY.current;

      const groundY = BOARD_HEIGHT - 20;
      if (dino.current.y > groundY - dino.current.height) {
        dino.current.y = groundY - dino.current.height;
        velocityY.current = 0;
      }

      // Draw Ground
      ctx.strokeStyle = "#535353";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(BOARD_WIDTH, groundY);
      ctx.stroke();

      // Process and Draw Cacti
      for (let i = 0; i < cactusArray.current.length; i++) {
        let cactus = cactusArray.current[i];
        
        // Move left
        cactus.x += cactusSpeedX;
        
        // Draw Cactus (Green object for now)
        ctx.fillStyle = "green";
        ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);

        // Check Collision
        if (detectCollision(dino.current, cactus)) {
          gameOverRef.current = true;
          dino.current.isDead = true;
        }
      }

      // Draw Dino (Black object normally, Dark Red with X_X placeholder if 'dead')
      ctx.fillStyle = dino.current.isDead ? "darkred" : "black";
      ctx.fillRect(dino.current.x, dino.current.y, dino.current.width, dino.current.height);
      
      if (dino.current.isDead) { // Simulated 'dead' image
          ctx.fillStyle = "white";
          ctx.font = "20px 'Courier New'";
          ctx.fillText("X_X", dino.current.x + 25, dino.current.y + 40);
      }

      if (gameOverRef.current) {
          ctx.fillStyle = "red";
          ctx.font = "bold 30px 'Courier New'";
          ctx.textAlign = "center";
          ctx.fillText("GAME OVER", BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
          
          cancelAnimationFrame(animationId);
          clearTimeout(cactusTimer);
          return; // Stop updating
      }

      // Memory Cleanup: Remove leftmost cacti off screen
      while (cactusArray.current.length > 0 && cactusArray.current[0].x < -100) {
        cactusArray.current.shift();
      }

      // Status text
      ctx.fillStyle = "#535353";
      ctx.font = "14px 'Courier New'";
      ctx.textAlign = "left";
      ctx.fillText(`Space: Jump | G: Antigravity (${isAntigravityRef.current ? 'ON' : 'OFF'})`, 10, 20);
    };

    // Start spawning and loops
    cactusTimer = setTimeout(placeCactus, 1500);
    animationId = requestAnimationFrame(update);

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent restarting if we want a formal reset button later, but for now space just jumps
      if (gameOverRef.current) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        const groundY = BOARD_HEIGHT - 20;
        if (dino.current.y === groundY - dino.current.height) {
           velocityY.current = -10;
        }
      } else if (e.code === 'KeyG' || e.key === 'g') {
        isAntigravityRef.current = !isAntigravityRef.current;
        setIsAntigravity(isAntigravityRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(cactusTimer);
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
