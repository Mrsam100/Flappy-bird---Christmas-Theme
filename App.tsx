
import React, { useState, useEffect } from 'react';
import { RetroLoader } from './components/RetroLoader';
import { MacWindow } from './components/MacWindow';
import GameCanvas from './components/GameCanvas';
import { Gamepad2, FileText, Settings, Wifi, Battery, Search, Menu, ShoppingCart, Coins, Lock, Check } from 'lucide-react';
import { playSound } from './utils/audio';
import { CharacterStats } from './types';

// CHARACTERS CONFIG
const CHARACTERS: CharacterStats[] = [
  { 
    id: 'rudolph', 
    name: 'Rudolph', 
    description: 'The classic red-nosed guide. Balanced stats.', 
    cost: 0, 
    gravity: 0.25, 
    jumpStrength: -6.0,
    color: 'bg-red-500',
    accent: '#ef4444'
  },
  { 
    id: 'bot', 
    name: 'Cyber-Bot', 
    description: 'Heavy metal alloy. Falls faster but controls are precise.', 
    cost: 50, 
    gravity: 0.35, 
    jumpStrength: -7.5,
    color: 'bg-slate-500',
    accent: '#64748b'
  },
  { 
    id: 'glider', 
    name: 'Golden Glider', 
    description: 'Lightweight gold. Floaty physics, easy to maintain height.', 
    cost: 100, 
    gravity: 0.18, 
    jumpStrength: -5.0,
    color: 'bg-yellow-500',
    accent: '#eab308'
  },
  { 
    id: 'ufo', 
    name: 'UFO-9000', 
    description: 'Alien tech. Extreme agility and speed.', 
    cost: 200, 
    gravity: 0.25, 
    jumpStrength: -7.0,
    color: 'bg-green-500',
    accent: '#22c55e'
  }
];

// Robust Storage Helper to prevent "SecurityError" crashes in iframe/incognito
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Storage full or denied
    }
  }
};

const DesktopIcon: React.FC<{ label: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ label, icon, color, onClick }) => (
  <div 
    className="flex flex-col items-center gap-2 w-24 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
  >
    <div className={`w-14 h-14 flex items-center justify-center rounded-xl shadow-lg ${color} text-white border-2 border-white/20 backdrop-blur-sm group-hover:shadow-xl transition-all`}>
      {icon}
    </div>
    <span className="text-sm font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
      {label}
    </span>
  </div>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<'game' | 'about' | 'shop' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Economy State
  const [wallet, setWallet] = useState(0);
  const [inventory, setInventory] = useState<string[]>(['rudolph']);
  const [equippedId, setEquippedId] = useState('rudolph');

  // Load Save Data
  useEffect(() => {
    const savedWallet = safeStorage.getItem('rudolph_wallet');
    const savedInv = safeStorage.getItem('rudolph_inventory');
    const savedEquip = safeStorage.getItem('rudolph_equip');
    
    if (savedWallet) {
      const parsed = parseInt(savedWallet, 10);
      if (!isNaN(parsed)) setWallet(parsed);
    }
    
    if (savedInv) {
      try {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) setInventory(parsed);
      } catch (e) {
        console.warn("Failed to parse inventory data, resetting to default.");
        setInventory(['rudolph']);
      }
    }

    if (savedEquip) setEquippedId(savedEquip);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save Data on Change
  useEffect(() => {
    safeStorage.setItem('rudolph_wallet', wallet.toString());
    safeStorage.setItem('rudolph_inventory', JSON.stringify(inventory));
    safeStorage.setItem('rudolph_equip', equippedId);
  }, [wallet, inventory, equippedId]);

  const handleGameOver = (coinsEarned: number) => {
    if (coinsEarned > 0) {
      setWallet(prev => prev + coinsEarned);
    }
  };

  const handlePurchase = (charId: string, cost: number) => {
    if (wallet >= cost && !inventory.includes(charId)) {
      setWallet(prev => prev - cost);
      setInventory(prev => [...prev, charId]);
      playSound('score');
    } else {
      playSound('crash'); // Error sound
    }
  };

  const activeCharacter = CHARACTERS.find(c => c.id === equippedId) || CHARACTERS[0];

  if (loading) {
    return <RetroLoader onComplete={() => setLoading(false)} />;
  }

  // --- FULLSCREEN GAME MODE ---
  if (activeWindow === 'game') {
    return (
      <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-500">
        <GameCanvas 
          activeCharacter={activeCharacter} 
          onGameOver={handleGameOver} 
          onClose={() => setActiveWindow(null)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col font-sans overflow-hidden bg-slate-900">
      
      {/* Background Game Animation (Attract Mode) */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none filter blur-[1px] brightness-75 scale-105">
        <GameCanvas 
           activeCharacter={activeCharacter} 
           isBackgroundMode={true}
        />
      </div>
      
      {/* Overlay to make UI readable */}
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[1px]"></div>

      {/* Top Bar (Glassmorphism) */}
      <header className="h-10 px-4 flex items-center justify-between bg-black/30 backdrop-blur-md border-b border-white/10 shadow-sm z-50 text-white select-none">
        <div className="flex items-center gap-4">
          <Menu size={20} className="cursor-pointer hover:opacity-80" />
          <span className="font-bold tracking-wide">GREGORIOUS OS 9.0</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
             <div className="flex items-center gap-2 bg-black/40 px-3 py-0.5 rounded-full border border-white/10 shadow-inner">
                <Coins size={14} className="text-yellow-400" />
                <span>{wallet} Coins</span>
            </div>
            <div className="w-px h-4 bg-white/30 mx-1"></div>
            <span>{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </header>

      {/* Desktop Area */}
      <main className="flex-1 relative p-6 overflow-hidden flex flex-col sm:flex-row items-center justify-center z-10">
        
        {/* Desktop Icons (Left Side) */}
        <div className="absolute left-6 top-6 flex flex-col gap-8 z-0">
          <DesktopIcon 
            label="PLAY GAME" 
            icon={<Gamepad2 size={32} />} 
            color="bg-gradient-to-br from-green-400 to-emerald-600"
            onClick={() => { playSound('click'); setActiveWindow('game'); }} 
          />
           <DesktopIcon 
            label="MARKET" 
            icon={<ShoppingCart size={32} />} 
            color="bg-gradient-to-br from-yellow-400 to-orange-500"
            onClick={() => { playSound('click'); setActiveWindow('shop'); }} 
          />
           <DesktopIcon 
            label="ABOUT" 
            icon={<FileText size={32} />} 
            color="bg-gradient-to-br from-blue-400 to-indigo-600"
            onClick={() => { playSound('click'); setActiveWindow('about'); }} 
          />
        </div>

        {/* Windows Container */}
        <div className="relative w-full max-w-4xl h-full flex items-center justify-center pointer-events-none z-10">
          
          {/* SHOP WINDOW */}
          {activeWindow === 'shop' && (
             <div className="pointer-events-auto w-full max-w-3xl h-[600px] animate-in zoom-in-95">
                <MacWindow title="Character Marketplace" onClose={() => setActiveWindow(null)} height="h-full" width="w-full">
                    <div className="flex flex-col h-full bg-slate-50">
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">UNLOCK CHARACTERS</h2>
                                <p className="text-slate-500 text-sm">Use your coins to buy new flyers with unique stats.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border border-yellow-200 text-yellow-800 font-bold">
                                <Coins size={20} /> {wallet}
                            </div>
                        </div>
                        
                        {/* Grid */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
                            {CHARACTERS.map(char => {
                                const isUnlocked = inventory.includes(char.id);
                                const isEquipped = equippedId === char.id;
                                
                                return (
                                    <div key={char.id} className={`relative p-4 rounded-xl border-2 transition-all ${isEquipped ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                        <div className="flex gap-4">
                                            <div className={`w-20 h-20 rounded-lg ${char.color} flex items-center justify-center shadow-inner shrink-0`}>
                                                <Gamepad2 size={32} className="text-white opacity-80" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-slate-800 flex justify-between">
                                                    {char.name}
                                                    {isUnlocked && <Check size={18} className="text-green-500" />}
                                                </h3>
                                                <p className="text-xs text-slate-500 mb-3 leading-tight">{char.description}</p>
                                                
                                                <div className="flex gap-2 text-[10px] font-mono mb-3 text-slate-600">
                                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded">GRAV: {char.gravity}</span>
                                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded">JUMP: {char.jumpStrength}</span>
                                                </div>

                                                {isUnlocked ? (
                                                    <button 
                                                        onClick={() => { setEquippedId(char.id); playSound('click'); }}
                                                        disabled={isEquipped}
                                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${isEquipped ? 'bg-blue-500 text-white cursor-default' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handlePurchase(char.id, char.cost)}
                                                        className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${wallet >= char.cost ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                                    >
                                                        {wallet >= char.cost ? (
                                                            <>BUY FOR {char.cost} <Coins size={14} /></>
                                                        ) : (
                                                            <><Lock size={14} /> {char.cost} COINS</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </MacWindow>
             </div>
          )}

          {/* ABOUT WINDOW */}
          {activeWindow === 'about' && (
            <div className="pointer-events-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-10">
                <MacWindow title="About This Game" onClose={() => setActiveWindow(null)}>
                  <div className="p-8 bg-white text-center">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                        <Gamepad2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-800">Rudolph Flappy Flight</h2>
                    <p className="text-slate-500 mb-6 font-medium">Ultimate Holiday Edition</p>
                    
                    <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2 mb-6 text-slate-700">
                        <p>✅ <b>Collect Coins:</b> Grab floating coins to get rich.</p>
                        <p>✅ <b>Marketplace:</b> Buy new characters with unique physics.</p>
                        <p>✅ <b>Dynamic Levels:</b> It gets faster the better you play!</p>
                    </div>

                    <button 
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors"
                        onClick={() => setActiveWindow(null)}
                    >
                        Close
                    </button>
                  </div>
                </MacWindow>
            </div>
          )}

        </div>
      </main>

      {/* Dock (Bottom) */}
      <div className="h-20 mb-4 flex justify-center pointer-events-none z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 flex items-center gap-6 pointer-events-auto shadow-2xl ring-1 ring-white/10">
              <div onClick={() => setActiveWindow('shop')} className="group relative w-12 h-12 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-white hover:-translate-y-4 transition-all duration-300 cursor-pointer shadow-lg shadow-orange-500/30">
                <ShoppingCart size={24} />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">Shop</div>
              </div>
              
              <div onClick={() => setActiveWindow('game')} className="group relative w-16 h-16 -mt-6 rounded-2xl bg-gradient-to-b from-green-400 to-emerald-600 flex items-center justify-center text-white hover:-translate-y-4 transition-all duration-300 cursor-pointer shadow-xl shadow-green-500/40 border-4 border-white/10">
                <Gamepad2 size={32} />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">Play</div>
              </div>

              <div onClick={() => setActiveWindow('about')} className="group relative w-12 h-12 rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white hover:-translate-y-4 transition-all duration-300 cursor-pointer shadow-lg shadow-blue-500/30">
                <Settings size={24} />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">Settings</div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default App;
