'use client';

import dynamic from 'next/dynamic';

const SpideyMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-xl text-white bg-[#0a192f]">LOADING TRACKER...</div>
});

export default function Home() {
  return (
    <div className="w-full h-full max-w-7xl max-h-[900px] border-[8px] border-[#3e8ca7] bg-[#0a192f] rounded-xl flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden relative font-pixel text-xs">
      
      {/* TOP BAR */}
      <div className="h-12 bg-[#3e8ca7] flex items-center justify-between px-4 border-b-[4px] border-[#1e4e61] relative z-10">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-black overflow-hidden relative">
          {/* Spidey eyes icon roughly */}
          <div className="absolute w-2 h-2 bg-black rounded-full left-1 top-2"></div>
          <div className="absolute w-2 h-2 bg-black rounded-full right-1 top-2"></div>
        </div>
        
        <div className="flex items-center gap-2 border-[3px] border-white rounded-full px-4 py-1 bg-black shadow-[0_4px_0_#1e4e61]">
          <span className="text-white text-lg tracking-widest text-shadow">SPIDEY</span>
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
            <div className="w-1.5 h-1.5 bg-white rounded-full mr-0.5"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full ml-0.5"></div>
          </div>
          <span className="text-white text-lg tracking-widest text-shadow">TRACKER</span>
        </div>

        <div className="w-8 h-8 bg-white rounded flex items-center justify-center border-2 border-black">
          <span className="text-black text-xl">🕷</span>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* LEFT TOOLBAR */}
        <div className="w-12 bg-[#3e8ca7] border-r-[4px] border-[#1e4e61] flex flex-col items-center py-4 gap-4 z-10">
          <div className="w-8 h-8 bg-[#8bc34a] border-2 border-white rounded flex items-center justify-center shadow-[2px_2px_0_#000]">
            🕷
          </div>
          <div className="w-8 h-8 bg-[#f44336] border-2 border-white rounded flex items-center justify-center shadow-[2px_2px_0_#000]">
            🕷
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div className="flex-1 relative bg-[#0a192f]">
          <SpideyMap />
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="h-10 bg-[#3e8ca7] border-t-[4px] border-[#1e4e61] flex items-center justify-center relative z-10 overflow-hidden">
        
        {/* Bottom Left Icon */}
        <div className="absolute left-2 -bottom-1">
          <div className="w-10 h-10 bg-red-500 rounded-full border-2 border-black flex items-center justify-center relative overflow-hidden">
             <div className="absolute w-3 h-3 bg-white rounded-full left-1 top-2 border border-black"></div>
             <div className="absolute w-3 h-3 bg-white rounded-full right-1 top-2 border border-black"></div>
          </div>
        </div>

        <div className="bg-black text-white px-4 py-1 border-[3px] border-white w-[300px] overflow-hidden whitespace-nowrap">
           <marquee className="text-xs">SHARE YOUR SPIDEY SIGHTINGS ON X</marquee>
        </div>
      </div>
      
    </div>
  );
}
