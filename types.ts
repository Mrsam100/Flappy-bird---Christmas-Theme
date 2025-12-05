
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  gapTop: number;
  gapHeight: number;
  width: number;
  passed: boolean;
}

export interface FloatingCoin {
  x: number;
  y: number;
  collected: boolean;
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
  type: number;
}

export interface CharacterStats {
  id: string;
  name: string;
  description: string;
  cost: number;
  gravity: number;
  jumpStrength: number;
  color: string;
  accent: string;
}
