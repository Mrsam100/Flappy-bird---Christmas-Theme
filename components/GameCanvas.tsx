
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Pipe, Particle, Cloud, FloatingCoin, CharacterStats } from '../types';
import { playSound } from '../utils/audio';
import { Pause, Play, RotateCcw, Coins, X } from 'lucide-react';

// Game Constants
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const BASE_SPEED = 3.5; 
const PIPE_WIDTH = 52;
const BASE_GAP_HEIGHT = 160; 
const LOGICAL_HEIGHT = 640; // Fixed physics height

// Level Configs
const LEVELS = [
  { threshold: 0, name: "START", speedMod: 1.0, skyStart: '#38bdf8', skyEnd: '#c084fc' },
  { threshold: 10, name: "SPEED UP", speedMod: 1.2, skyStart: '#f97316', skyEnd: '#ec4899' }, // Sunset
  { threshold: 25, name: "TURBO", speedMod: 1.4, skyStart: '#1e1b4b', skyEnd: '#4c1d95' }, // Night
  { threshold: 50, name: "HYPER", speedMod: 1.6, skyStart: '#000000', skyEnd: '#1e293b' }  // Space
];

interface GameCanvasProps {
  activeCharacter: CharacterStats;
  onGameOver?: (coinsEarned: number) => void;
  onClose?: () => void;
  isBackgroundMode?: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ activeCharacter, onGameOver, onClose, isBackgroundMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  
  // React State for UI overlays ONLY
  const [gameState, setGameState] = useState<GameState>(isBackgroundMode ? GameState.PLAYING : GameState.START);
  const [uiCoins, setUiCoins] = useState(0); 
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showLevelText, setShowLevelText] = useState("");
  
  // Dynamic Canvas Dimensions
  const [dimensions, setDimensions] = useState({ width: 360, height: LOGICAL_HEIGHT });

  // Mutable Game State
  const gameData = useRef({
    player: { x: 60, y: 240, width: 34, height: 28, velocity: 0, rotation: 0, frame: 0 },
    pipes: [] as Pipe[],
    coins: [] as FloatingCoin[],
    snow: [] as { x: number; y: number; speed: number; size: number; alpha: number }[],
    clouds: [] as Cloud[],
    particles: [] as Particle[],
    distanceScore: 0, 
    coinsCollected: 0,
    speed: BASE_SPEED,
    shake: 0,
    flash: 0,
    levelIndex: 0
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      const newWidth = LOGICAL_HEIGHT * aspect;
      setDimensions({ width: newWidth, height: LOGICAL_HEIGHT });
    };
    
    handleResize(); // Initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Visual Effects & Drawing ---

  const createParticles = (x: number, y: number, count: number, colors: string[]) => {
    for (let i = 0; i < count; i++) {
      gameData.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, levelIdx: number, frame: number) => {
    const lvl = LEVELS[levelIdx];
    
    // Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, lvl.skyStart);
    gradient.addColorStop(1, lvl.skyEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Stars
    if (levelIdx >= 2) {
      ctx.fillStyle = '#FFF';
      const time = Date.now() / 1000;
      for (let i = 0; i < 40; i++) { // More stars for wider screens
        const x = (i * 4321 + 50) % width;
        const y = (i * 1234 + 20) % height;
        const flicker = Math.sin(time + i) * 0.5 + 0.5;
        ctx.globalAlpha = flicker;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1.0;
    }

    // Distant Mountains
    ctx.fillStyle = levelIdx >= 2 ? 'rgba(20, 20, 30, 0.5)' : 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for(let x=0; x<=width; x+=20) {
        ctx.lineTo(x, height - 40 - Math.sin((x + frame * 0.5) * 0.01) * 20);
    }
    ctx.lineTo(width, height);
    ctx.fill();
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, frame: number) => {
    ctx.save();
    ctx.translate(x + 17, y + 14);
    ctx.rotate(rot * Math.PI / 180);
    ctx.translate(-17, -14);

    const animFrame = Math.floor(frame);

    if (activeCharacter.id === 'rudolph') {
      ctx.fillStyle = '#8D6E63'; 
      ctx.fillRect(4, 10, 24, 14);
      ctx.fillStyle = '#A1887F'; 
      ctx.fillRect(20, 6, 14, 14);
      ctx.fillStyle = '#5D4037'; 
      ctx.fillRect(22, 0, 2, 8);
      ctx.fillRect(28, 2, 2, 6);
      ctx.fillRect(20, 3, 6, 2);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(26, 8, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(28, 9, 2, 2);
      
      const glow = Math.abs(Math.sin(frame * 0.1)) * 5;
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 10 + glow;
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(34, 13, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#FFF';
      const wingY = Math.floor(animFrame / 6) % 2 === 0 ? 12 : 16;
      ctx.beginPath();
      ctx.ellipse(12, wingY, 8, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (activeCharacter.id === 'bot') {
      ctx.fillStyle = '#94a3b8'; 
      ctx.fillRect(4, 10, 24, 14); 
      ctx.fillStyle = '#64748b'; 
      ctx.fillRect(20, 6, 14, 14); 
      ctx.fillStyle = '#ef4444'; 
      ctx.fillRect(24, 9, 10, 4);
      ctx.fillStyle = animFrame % 4 < 2 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(4, 15);
      ctx.lineTo(-5, 12);
      ctx.lineTo(-5, 18);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(25, 6);
      ctx.lineTo(25, 0);
      ctx.stroke();
      ctx.fillStyle = animFrame % 10 < 5 ? '#ef4444' : '#000';
      ctx.fillRect(24, 0, 3, 3);

    } else if (activeCharacter.id === 'glider') {
      const gradient = ctx.createLinearGradient(0, 0, 34, 28);
      gradient.addColorStop(0, '#fcd34d');
      gradient.addColorStop(1, '#d97706');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(17, 14, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffbeb';
      const wingY = Math.floor(animFrame / 10) % 2 === 0 ? 10 : 20; 
      ctx.beginPath();
      ctx.moveTo(10, 14);
      ctx.lineTo(25, wingY);
      ctx.lineTo(25, 14);
      ctx.fill();
      if (animFrame % 20 < 5) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(Math.random()*30, Math.random()*20, 2, 2);
      }

    } else if (activeCharacter.id === 'ufo') {
      ctx.fillStyle = '#10b981'; 
      ctx.beginPath();
      ctx.arc(17, 10, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#6b7280'; 
      ctx.beginPath();
      ctx.ellipse(17, 16, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = animFrame % 4 === 0 ? '#f472b6' : '#ec4899';
      ctx.beginPath();
      ctx.arc(17 + Math.sin(frame*0.5)*12, 16, 2, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, coin: FloatingCoin) => {
    if (coin.collected) return;
    const size = 12;
    ctx.save();
    ctx.translate(coin.x, coin.y);
    const scaleX = Math.abs(Math.sin(coin.angle));
    ctx.scale(scaleX, 1);
    ctx.fillStyle = '#fbbf24'; 
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706'; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe, height: number, levelIdx: number) => {
    let pipeColor = '#22c55e';
    let stripeColor = '#16a34a';
    
    if (levelIdx === 2) { 
        pipeColor = '#15803d';
        stripeColor = '#166534';
    } else if (levelIdx === 3) { 
        pipeColor = '#64748b'; 
        stripeColor = '#475569';
    }

    const drawSegment = (y: number, h: number, isTop: boolean) => {
      ctx.fillStyle = pipeColor;
      ctx.fillRect(pipe.x, y, pipe.width, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(pipe.x, y, pipe.width, h);
      ctx.clip();
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = 8;
      for (let i = y - 50; i < y + h + 50; i += 40) {
        ctx.beginPath();
        ctx.moveTo(pipe.x - 20, i);
        ctx.lineTo(pipe.x + pipe.width + 20, i + 40);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = pipeColor;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const capY = isTop ? y + h - 20 : y;
      const capH = 20;
      ctx.fillRect(pipe.x - 4, capY, pipe.width + 8, capH);
      ctx.strokeRect(pipe.x - 4, capY, pipe.width + 8, capH);
      ctx.strokeRect(pipe.x, y, pipe.width, h);
    };

    drawSegment(0, pipe.gapTop, true);
    drawSegment(pipe.gapTop + pipe.gapHeight, height - (pipe.gapTop + pipe.gapHeight), false);
  };

  // --- Logic ---

  const initGame = useCallback(() => {
    const currentWidth = dimensions.width;
    gameData.current = {
      player: { x: 60, y: 240, width: 34, height: 28, velocity: 0, rotation: 0, frame: 0 },
      pipes: [],
      coins: [],
      snow: Array.from({ length: 60 }, () => ({
        x: Math.random() * currentWidth,
        y: Math.random() * LOGICAL_HEIGHT,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3
      })),
      clouds: Array.from({ length: 5 }, (_, i) => ({
        x: i * 150 + Math.random() * 50,
        y: Math.random() * 200 + 30,
        speed: 0.2 + Math.random() * 0.5,
        width: 30 + Math.random() * 50,
        type: 0
      })),
      particles: [],
      distanceScore: 0,
      coinsCollected: 0,
      speed: BASE_SPEED,
      shake: 0,
      flash: 0,
      levelIndex: 0
    };
    setUiCoins(0);
    setCurrentLevel(0);
    if (isBackgroundMode) {
        setGameState(GameState.PLAYING);
    }
  }, [dimensions.width, isBackgroundMode]);

  const jump = useCallback(() => {
    const gd = gameData.current;
    if (gameState === GameState.PLAYING) {
      gd.player.velocity = activeCharacter.jumpStrength;
      gd.player.rotation = -25;
      createParticles(gd.player.x, gd.player.y + 20, 5, ['#FFF', '#EEE']);
      if (!isBackgroundMode) playSound('jump');
    } else if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
      initGame();
      setGameState(GameState.PLAYING);
      if (!isBackgroundMode) playSound('click');
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState, initGame, activeCharacter, isBackgroundMode]);

  const togglePause = useCallback((e?: React.MouseEvent) => {
    if (isBackgroundMode) return;
    e?.stopPropagation();
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
    else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  }, [gameState, isBackgroundMode]);

  // Input Listeners
  useEffect(() => {
    if (isBackgroundMode) return; // Disable input in background mode

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'KeyP') togglePause();
      if (e.code === 'Escape' && onClose) onClose();
    };
    const handleTouchStart = (e: TouchEvent) => {
       if ((e.target as HTMLElement).closest('button')) return;
       if (e.cancelable) e.preventDefault(); 
       jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    const canvas = canvasRef.current;
    canvas?.addEventListener('touchstart', handleTouchStart, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas?.removeEventListener('touchstart', handleTouchStart);
    };
  }, [jump, togglePause, onClose, isBackgroundMode]);

  // Main Game Loop (Delta Time)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas internal resolution to match logical dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    previousTimeRef.current = performance.now();

    const animate = (time: number) => {
      let deltaTime = (time - previousTimeRef.current) / FRAME_TIME;
      previousTimeRef.current = time;

      if (deltaTime > 3) deltaTime = 3; 

      if (gameState !== GameState.PAUSED) {
        const gd = gameData.current;
        const currentWidth = dimensions.width;
        
        // --- UPDATES with Delta Time ---
        
        if (gd.shake > 0) gd.shake *= Math.pow(0.9, deltaTime);
        if (gd.shake < 0.5) gd.shake = 0;
        if (gd.flash > 0) gd.flash -= 0.1 * deltaTime;

        gd.clouds.forEach(c => {
           const move = (gameState === GameState.PLAYING) ? c.speed + (gd.speed * 0.05) : c.speed * 0.5;
           c.x -= move * deltaTime;
           if (c.x + 100 < 0) {
             c.x = currentWidth + 50;
             c.y = Math.random() * 200 + 30;
           }
        });

        gd.snow.forEach(s => {
          s.y += s.speed * deltaTime;
          s.x -= gd.speed * 0.2 * deltaTime;
          if (s.y > LOGICAL_HEIGHT) { s.y = -10; s.x = Math.random() * currentWidth; }
          if (s.x < 0) s.x = currentWidth;
        });

        if (gameState === GameState.PLAYING) {
          gd.player.frame += 1 * deltaTime;

          // AI FOR BACKGROUND MODE
          if (isBackgroundMode) {
              const nextPipe = gd.pipes.find(p => p.x + p.width > gd.player.x);
              const targetY = nextPipe 
                 ? (nextPipe.gapTop + nextPipe.gapHeight * 0.6) 
                 : LOGICAL_HEIGHT * 0.5;

              // Simple "maintain height" logic
              if (gd.player.y > targetY + 20 && gd.player.velocity > 0) {
                  jump();
              }
              // Prevent hitting ceiling in AI mode
              if (gd.player.y < 0) {
                  gd.player.velocity = 2; // Force drop
              }
          }
          
          const nextLevelIdx = LEVELS.findIndex((lvl, i) => {
              const nextLvl = LEVELS[i+1];
              return gd.distanceScore >= lvl.threshold && (!nextLvl || gd.distanceScore < nextLvl.threshold);
          });
          
          if (nextLevelIdx !== -1 && nextLevelIdx !== gd.levelIndex) {
              gd.levelIndex = nextLevelIdx;
              setCurrentLevel(nextLevelIdx);
              if (!isBackgroundMode) {
                  setShowLevelText(LEVELS[nextLevelIdx].name);
                  setTimeout(() => setShowLevelText(""), 2000);
                  gd.flash = 0.8;
                  playSound('score');
              }
          }

          const targetSpeed = BASE_SPEED * LEVELS[gd.levelIndex].speedMod;
          gd.speed += (targetSpeed - gd.speed) * 0.05 * deltaTime;

          gd.player.velocity += activeCharacter.gravity * deltaTime;
          gd.player.y += gd.player.velocity * deltaTime;
          
          const rotTarget = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (gd.player.velocity * 0.1))) * 180 / Math.PI;
          gd.player.rotation = rotTarget; 

          // Floor/Ceiling collision
          if (gd.player.y + gd.player.height >= LOGICAL_HEIGHT - 10 || gd.player.y < -50) {
            if (isBackgroundMode) {
                initGame(); // Silent reset
            } else {
                setGameState(GameState.GAME_OVER);
                if (onGameOver) onGameOver(gd.coinsCollected);
                playSound('crash');
                gd.shake = 15;
                createParticles(gd.player.x, gd.player.y, 20, ['#8D6E63', '#FF0000']);
            }
          }

          const lastPipe = gd.pipes[gd.pipes.length - 1];
          // Increased gap to 600 as requested for "more apart"
          const distanceBetweenPipes = 600 / LEVELS[gd.levelIndex].speedMod;
          
          // Spawn Logic using dynamic width
          if (!lastPipe || (currentWidth - lastPipe.x) >= distanceBetweenPipes) {
             const minPipe = 60;
             const currentGap = Math.max(110, BASE_GAP_HEIGHT - (gd.distanceScore * 0.8));
             const maxPipe = LOGICAL_HEIGHT - currentGap - minPipe;
             const gapTop = Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;
             
             gd.pipes.push({ x: currentWidth, gapTop, gapHeight: currentGap, width: PIPE_WIDTH, passed: false });

             if (Math.random() > 0.5) {
                 gd.coins.push({
                     x: currentWidth + PIPE_WIDTH/2,
                     y: gapTop + currentGap/2,
                     collected: false,
                     angle: 0
                 });
             }
          }

          gd.coins.forEach(coin => {
              coin.x -= gd.speed * deltaTime;
              coin.angle += 0.1 * deltaTime;
              const dx = coin.x - (gd.player.x + gd.player.width/2);
              const dy = coin.y - (gd.player.y + gd.player.height/2);
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist < 30 && !coin.collected) {
                  coin.collected = true;
                  gd.coinsCollected += 1;
                  setUiCoins(gd.coinsCollected); // Update UI state
                  if (!isBackgroundMode) playSound('score');
                  createParticles(coin.x, coin.y, 8, ['#fbbf24', '#fff']);
              }
          });
          gd.coins = gd.coins.filter(c => c.x > -50 && !c.collected);

          gd.pipes.forEach(pipe => {
            pipe.x -= gd.speed * deltaTime;
            const r = gd.player;
            const inset = 6;
            
            if (
              r.x + inset < pipe.x + pipe.width &&
              r.x + r.width - inset > pipe.x &&
              (r.y + inset < pipe.gapTop || r.y + r.height - inset > pipe.gapTop + pipe.gapHeight)
            ) {
              if (isBackgroundMode) {
                  initGame(); // Silent reset
              } else {
                  setGameState(GameState.GAME_OVER);
                  if (onGameOver) onGameOver(gd.coinsCollected); 
                  playSound('crash');
                  gd.shake = 20;
                  createParticles(r.x, r.y, 15, ['#FFF', '#F00', '#0F0']);
              }
            }

            if (pipe.x + pipe.width < r.x && !pipe.passed) {
              pipe.passed = true;
              gd.distanceScore += 1;
              gd.coinsCollected += 1; 
              setUiCoins(gd.coinsCollected);
              if (!isBackgroundMode) {
                  gd.flash = 0.1;
                  playSound('score');
              }
            }
          });

          if (gd.pipes.length > 0 && gd.pipes[0].x < -PIPE_WIDTH) gd.pipes.shift();

          for(let i=gd.particles.length-1; i>=0; i--) {
            const p = gd.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= 0.03 * deltaTime;
            if(p.life <= 0) gd.particles.splice(i, 1);
          }
        }
      }

      // --- RENDER ---
      const gd = gameData.current;
      const w = dimensions.width;
      const h = dimensions.height;
      
      ctx.save();
      if (gd.shake > 0) ctx.translate((Math.random()-0.5)*gd.shake, (Math.random()-0.5)*gd.shake);

      drawBackground(ctx, w, h, gd.levelIndex, gd.player.frame);
      gd.clouds.forEach(c => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cw = c.width;
        ctx.beginPath();
        ctx.arc(c.x + cw * 0.2, c.y, cw * 0.2, 0, Math.PI * 2);
        ctx.arc(c.x + cw * 0.5, c.y - cw * 0.1, cw * 0.25, 0, Math.PI * 2);
        ctx.arc(c.x + cw * 0.8, c.y, cw * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      gd.pipes.forEach(p => drawPipe(ctx, p, h, gd.levelIndex));
      gd.coins.forEach(c => drawCoin(ctx, c));

      ctx.fillStyle = '#FFF';
      gd.snow.forEach(s => {
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      if (gameState !== GameState.START) {
        drawCharacter(ctx, gd.player.x, gd.player.y, gd.player.rotation, gd.player.frame);
      } else {
        drawCharacter(ctx, w/2 - 20, h/2 - 60 + Math.sin(Date.now()/300)*10, 0, Date.now()/100);
      }

      gd.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      if (gd.flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gd.flash})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();

      if (gameState === GameState.START && !isBackgroundMode) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 32px "VT323"';
        ctx.textAlign = 'center';
        ctx.fillText("TAP TO START", w/2, h/2 + 20);
        
        ctx.font = '24px "VT323"';
        ctx.fillStyle = activeCharacter.accent;
        ctx.fillText(`Playing as ${activeCharacter.name}`, w/2, h/2 + 55);
        ctx.shadowBlur = 0;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, activeCharacter, onGameOver, dimensions, isBackgroundMode, jump, initGame]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden select-none ${isBackgroundMode ? 'pointer-events-none' : ''}`}
      onClick={(!isBackgroundMode && gameState === GameState.PLAYING) ? jump : undefined}
    >
      <canvas 
        ref={canvasRef}
        className="block touch-none"
        style={{ width: '100%', height: '100%' }} // Force CSS to fill container
      />

      {/* HUD - Only show if NOT background mode */}
      {!isBackgroundMode && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Coins size={24} className="text-yellow-400 drop-shadow-md" fill="currentColor" />
              <span className="text-white font-retro text-4xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] font-bold">{uiCoins}</span>
            </div>
            <span className="text-white/80 font-retro text-sm uppercase tracking-widest mt-[-2px] ml-1">Coins</span>
          </div>

          <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
              <span className="text-white font-retro text-xl">Lvl {currentLevel + 1}</span>
              </div>
              
              <button 
                  onClick={(e) => { e.stopPropagation(); togglePause(); }}
                  className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all active:scale-95 text-white border border-white/30"
              >
                  {gameState === GameState.PAUSED ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
              </button>

              <button 
                  onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                  className="pointer-events-auto p-2 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md transition-all active:scale-95 text-white border border-white/30"
              >
                  <X size={20} />
              </button>
          </div>
        </div>
      )}

      {/* Level Up Overlay */}
      {showLevelText && !isBackgroundMode && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none animate-[bounce_1s_infinite]">
              <div className="text-yellow-300 font-retro text-5xl font-bold drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)] stroke-black tracking-widest whitespace-nowrap">
                  LEVEL UP!
              </div>
              <div className="text-white font-retro text-2xl drop-shadow-md">{showLevelText}</div>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && !isBackgroundMode && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 z-10">
          <div className="bg-white border-4 border-slate-800 p-8 rounded-xl shadow-2xl text-center transform scale-110 relative overflow-hidden min-w-[280px]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            
            <h2 className="text-4xl font-retro font-black mb-4 text-red-600 tracking-wider">CRASHED!</h2>
            
            <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-retro text-slate-700">Collected:</span>
                <span className="text-3xl font-retro font-bold text-yellow-500 flex items-center gap-1">
                    +{uiCoins} <Coins size={20} fill="currentColor" />
                </span>
            </div>
            
            <div className="flex gap-2 mt-4">
                <button 
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-retro text-xl rounded-lg hover:bg-slate-300 active:translate-y-1 transition-all"
                >
                EXIT
                </button>
                <button 
                onClick={(e) => { e.stopPropagation(); jump(); }}
                className="flex-[2] py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-retro text-2xl rounded-lg hover:from-green-400 hover:to-emerald-500 shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                <RotateCcw size={20} /> RETRY
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Pause Overlay */}
      {gameState === GameState.PAUSED && !isBackgroundMode && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
             <h2 className="text-white font-retro text-5xl font-bold drop-shadow-lg tracking-widest">PAUSED</h2>
         </div>
      )}
    </div>
  );
};

export default GameCanvas;
