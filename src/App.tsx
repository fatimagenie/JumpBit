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
const RABBIT_WIDTH = 88;
const RABBIT_HEIGHT = 94;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // States and refs for game logic
  const isAntigravityRef = useRef(false);
  const [isAntigravity, setIsAntigravity] = useState(false);
  const isDarkModeRef = useRef(false);
  const colorsRef = useRef({
    rabbit: '#000000',
    cactus: 'green',
    hud: '#535353',
    dead: 'darkred',
    highlight: 'red',
    ground: '#2E7D32',
    bg: '#FFCC80',
    bird: '#3E2723',
    cloud: 'rgba(255, 255, 255, 0.8)',
    tree: '#1B5E20'
  });
  
  const backgroundElements = useRef<any[]>([]);
  const gameOverRef = useRef(false);
  const obstacleArray = useRef<any[]>([]);
  const baseSpeedX = -8;
  const cactusSpeedX = useRef(baseSpeedX);

  const velocityY = useRef(0);
  const gravity = 0.2; // Adjusted for floating jump

  const score = useRef(0);
  const highScore = useRef(0);

  const rabbit = useRef({
    x: 50,
    y: BOARD_HEIGHT - 20 - RABBIT_HEIGHT,
    width: RABBIT_WIDTH,
    height: RABBIT_HEIGHT,
    isDead: false,
    isDucking: false
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

    // Read initial colors from CSS variables
    const updateColors = () => {
      const style = getComputedStyle(document.body);
      colorsRef.current = {
        rabbit: style.getPropertyValue('--rabbit-color').trim() || '#000000',
        cactus: style.getPropertyValue('--cactus-color').trim() || 'green',
        hud: style.getPropertyValue('--text-color').trim() || '#535353',
        dead: style.getPropertyValue('--rabbit-dead-color').trim() || 'darkred',
        highlight: style.getPropertyValue('--hud-highlight').trim() || 'red',
        ground: style.getPropertyValue('--ground-color').trim() || '#2E7D32',
        bg: style.getPropertyValue('--bg-color').trim() || '#FFCC80',
        bird: style.getPropertyValue('--text-color').trim() || '#3E2723',
        cloud: style.getPropertyValue('--cloud-color').trim() || 'rgba(255, 255, 255, 0.8)',
        tree: style.getPropertyValue('--tree-color').trim() || '#1B5E20'
      };
    };
    updateColors();

    // Initialize background elements
    const initBackground = () => {
      backgroundElements.current = [];
      // Clouds
      for (let i = 0; i < 5; i++) {
        backgroundElements.current.push({
          x: Math.random() * BOARD_WIDTH,
          y: 20 + Math.random() * 60,
          width: 60 + Math.random() * 40,
          height: 20 + Math.random() * 20,
          speed: 0.2 + Math.random() * 0.3,
          type: 'cloud'
        });
      }
      // Trees
      for (let i = 0; i < 6; i++) {
        backgroundElements.current.push({
          x: (BOARD_WIDTH / 6) * i + Math.random() * 50,
          y: BOARD_HEIGHT - 20 - 40,
          width: 30,
          height: 40,
          type: 'tree'
        });
      }
    };
    initBackground();

    // Collision detection utility
    const detectCollision = (a: any, b: any) => {
      return a.x < b.x + b.width &&   
             a.x + a.width > b.x &&   
             a.y < b.y + b.height &&  
             a.y + a.height > b.y;    
    };

    // Obstacle spawning logic
    const placeObstacle = () => {
      if (gameOverRef.current) return;

      const scoreValue = Math.floor(score.current);
      const shouldSpawnBird = scoreValue > 700 && Math.random() > 0.7;

      if (shouldSpawnBird) {
        // Spawning Birds at different heights
        const heights = [70, 130]; // Low (jump over) and High (duck under)
        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
        const bird = {
          x: BOARD_WIDTH,
          y: BOARD_HEIGHT - 20 - randomHeight,
          width: 60,
          height: 40,
          type: 'bird'
        };
        obstacleArray.current.push(bird);
      } else {
        // Spawning Cacti of different sizes
        let width = 40;
        let height = 70;
        const rand = Math.random();
        
        if (rand < 0.3) { // Small
          width = 30; height = 50;
        } else if (rand < 0.6) { // Medium
          width = 50; height = 70;
        } else { // Large
          width = 70; height = 90;
        }

        const cactus = {
          x: BOARD_WIDTH,
          y: BOARD_HEIGHT - 20 - height,
          width: width,
          height: height,
          type: 'cactus'
        };
        obstacleArray.current.push(cactus);
      }

      // Random wait between 1.5 to 2.5 seconds (gets faster as score increases)
      const speedMultiplier = Math.max(0.5, 1 - scoreValue / 2000);
      const nextSpawn = (Math.random() * 1000 + 1000) * speedMultiplier;
      cactusTimer = setTimeout(placeObstacle, nextSpawn);
    };

    const update = () => {
      if (gameOverRef.current) return;
      
      animationId = requestAnimationFrame(update);
      const ctx = contextRef.current;
      if (!ctx) return;

      // Clear board
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Score and Speed Logic
      score.current += 0.025;
      cactusSpeedX.current = baseSpeedX - Math.floor(score.current / 100);

      // Day/Night Cycle Logic (toggle every 700 points)
      const currentCycle = Math.floor(score.current / 700) % 2 === 1;
      if (currentCycle !== isDarkModeRef.current) {
        isDarkModeRef.current = currentCycle;
        if (currentCycle) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        
        updateColors();
      }

      // Draw Background Elements (Clouds movement)
      backgroundElements.current.forEach(el => {
        if (el.type === 'cloud') {
          el.x -= el.speed;
          if (el.x + el.width < 0) el.x = BOARD_WIDTH;
          ctx.fillStyle = colorsRef.current.cloud;
          ctx.beginPath();
          ctx.ellipse(el.x, el.y, el.width/2, el.height/2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.type === 'tree') {
          ctx.fillStyle = colorsRef.current.tree;
          // Simple tree triangle
          ctx.beginPath();
          ctx.moveTo(el.x, el.y + el.height);
          ctx.lineTo(el.x + el.width / 2, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.fill();
        }
      });

      // Ducking Logic
      const currentHeight = rabbit.current.isDucking ? RABBIT_HEIGHT / 2 : RABBIT_HEIGHT;
      const groundY = BOARD_HEIGHT - 20;

      // Apply Gravity (0.1 for Antigravity)
      let currentGravity = isAntigravityRef.current ? 0.1 : gravity;
      velocityY.current += currentGravity;
      rabbit.current.y += velocityY.current;

      if (rabbit.current.y > groundY - currentHeight) {
        rabbit.current.y = groundY - currentHeight;
        velocityY.current = 0;
      }

      // Draw Ground
      ctx.strokeStyle = colorsRef.current.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(BOARD_WIDTH, groundY);
      ctx.stroke();

      // Process and Draw Obstacles
      for (let i = 0; i < obstacleArray.current.length; i++) {
        let obstacle = obstacleArray.current[i];
        
        // Move left
        obstacle.x += cactusSpeedX.current;
        
        // Draw Obstacle
        if (obstacle.type === 'bird') {
          ctx.fillStyle = colorsRef.current.bird;
          // Simple bird shape
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          // Wings
          ctx.fillRect(obstacle.x - 10, obstacle.y + 10, 10, 5);
          ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 10, 10, 5);
        } else {
          ctx.fillStyle = colorsRef.current.cactus;
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Check Collision (adjust for ducking height)
        const rabbitHitbox = {
          x: rabbit.current.x,
          y: rabbit.current.y,
          width: rabbit.current.width,
          height: currentHeight
        };

        if (detectCollision(rabbitHitbox, obstacle)) {
          gameOverRef.current = true;
          rabbit.current.isDead = true;
          // Update High Score if needed
          if (score.current > highScore.current) {
             highScore.current = score.current;
          }
        }
      }

      // Draw Rabbit 
      ctx.fillStyle = rabbit.current.isDead ? colorsRef.current.dead : colorsRef.current.rabbit;
      
      if (rabbit.current.isDucking && !rabbit.current.isDead) {
        // Ducking Body
        ctx.fillRect(rabbit.current.x, rabbit.current.y + 10, rabbit.current.width, currentHeight - 10);
        // Ducking Ears (laying back)
        ctx.fillRect(rabbit.current.x - 20, rabbit.current.y + 15, 30, 10);
      } else {
        // Normal Body
        ctx.fillRect(rabbit.current.x, rabbit.current.y + 20, rabbit.current.width, rabbit.current.height - 20);
        // Ears (Left and Right - Upright)
        ctx.fillRect(rabbit.current.x + 15, rabbit.current.y, 15, 30);
        ctx.fillRect(rabbit.current.x + rabbit.current.width - 30, rabbit.current.y, 15, 30);
      }
      
      if (rabbit.current.isDead) { 
          ctx.fillStyle = "white";
          ctx.font = "20px Courier";
          ctx.fillText("X_X", rabbit.current.x + 25, rabbit.current.y + 50);
      }

      // Draw Score UI
      ctx.fillStyle = colorsRef.current.hud;
      ctx.font = "14px Courier";
      ctx.textAlign = "left";
      ctx.fillText(`Space: Jump | G: Antigravity (${isAntigravityRef.current ? 'ON' : 'OFF'})`, 10, 20);

      ctx.font = "bold 16px Courier";
      ctx.textAlign = "right";
      ctx.fillText(`HI ${Math.floor(highScore.current).toString().padStart(5, '0')}  ${Math.floor(score.current).toString().padStart(5, '0')}`, BOARD_WIDTH - 20, 30);

      if (gameOverRef.current) {
          ctx.fillStyle = colorsRef.current.highlight;
          ctx.font = "bold 30px Courier";
          ctx.textAlign = "center";
          ctx.fillText("GAME OVER", BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
          
          ctx.fillStyle = colorsRef.current.hud;
          ctx.font = "18px Courier";
          ctx.fillText("Press Space to Restart", BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 30);

          cancelAnimationFrame(animationId);
          clearTimeout(cactusTimer);
          return; // Stop updating
      }

      // Memory Cleanup
      while (obstacleArray.current.length > 0 && obstacleArray.current[0].x < -100) {
        obstacleArray.current.shift();
      }
    };

    const startGameLoop = () => {
      cactusTimer = setTimeout(placeObstacle, 1500);
      animationId = requestAnimationFrame(update);
    }

    // Start initial game loop
    startGameLoop();

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameOverRef.current) {
          // Restart Logic
          rabbit.current = {
            x: 50,
            y: BOARD_HEIGHT - 20 - RABBIT_HEIGHT,
            width: RABBIT_WIDTH,
            height: RABBIT_HEIGHT,
            isDead: false,
            isDucking: false
          };
          obstacleArray.current = [];
          score.current = 0;
          cactusSpeedX.current = baseSpeedX;
          gameOverRef.current = false;
          initBackground();
          
          startGameLoop();
        } else {
          // Jump Logic
          const groundY = BOARD_HEIGHT - 20;
          if (rabbit.current.y === groundY - currentHeight) {
             velocityY.current = -10;
          }
        }
      } else if (e.code === 'ArrowDown') {
        rabbit.current.isDucking = true;
      } else if (e.code === 'KeyG' || e.key === 'g') {
        isAntigravityRef.current = !isAntigravityRef.current;
        setIsAntigravity(isAntigravityRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        rabbit.current.isDucking = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(cactusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>Rabbit Run</h1>
      <canvas 
        id="board" 
        ref={canvasRef}
        className="rounded-lg border shadow-md"
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
