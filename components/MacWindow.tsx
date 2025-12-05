import React from 'react';

interface MacWindowProps {
  title: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  onClose?: () => void;
  className?: string;
}

export const MacWindow: React.FC<MacWindowProps> = ({ 
  title, 
  children, 
  width = 'w-full max-w-2xl', 
  height = 'h-auto',
  onClose,
  className = ''
}) => {
  return (
    <div className={`flex flex-col bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-700 shadow-2xl ${width} ${height} ${className}`}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-3 py-2 flex items-center justify-between select-none shadow-sm relative z-10">
        <div className="flex items-center gap-2">
           <div 
             onClick={onClose}
             className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-400 border border-red-700 shadow-inner cursor-pointer flex items-center justify-center group"
           >
              {onClose && <div className="hidden group-hover:block w-2 h-2 bg-red-900 rounded-full opacity-50"/>}
           </div>
           <div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 shadow-inner opacity-50 cursor-not-allowed"></div>
           <div className="w-4 h-4 rounded-full bg-green-500 border border-green-700 shadow-inner opacity-50 cursor-not-allowed"></div>
        </div>
        
        <div className="text-white font-retro tracking-wider font-bold text-lg drop-shadow-md absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
          {title}
        </div>
        
        <div className="w-12"></div> {/* Spacer for balance */}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-white">
        {children}
      </div>
    </div>
  );
};