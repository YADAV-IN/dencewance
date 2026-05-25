import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bell, 
  BadgeCheck, 
  Activity, 
  Users, 
  TrendingUp, 
  Play, 
  UserCog, 
  BarChart2, 
  Home, 
  Film, 
  Search, 
  PlusSquare, 
  User,
  Music
} from 'lucide-react';

export default function PixelPerfectProfile() {
  const [activeTab, setActiveTab] = useState('grid');
  
  // Dummy grid data
  const gridItems = Array(9).fill(0).map((_, i) => ({
    id: i,
    views: '5k',
    likes: '312'
  }));

  return (
    <div className="relative max-w-[420px] mx-auto h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-[#F4ECD8] to-[#FFFFFF] font-sans shadow-2xl border-x border-gray-200">
      
      {/* 1. Global Header */}
      <header className="sticky top-0 z-50 bg-[#3A125E] text-white px-4 py-3 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-serif font-bold text-xl italic tracking-wide leading-tight flex flex-col">
            <span>Dence</span>
            <span>Wance</span>
          </span>
          <Music size={16} className="text-[#FFD700] mb-3 -ml-1" />
        </div>
        
        <div className="flex items-center gap-[14px]">
          <div className="relative cursor-pointer">
            <MessageSquare size={22} className="text-[#FFD700]" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#FFD700] text-[#3A125E] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#3A125E]">1</span>
          </div>
          <div className="relative cursor-pointer">
            <Bell size={22} className="text-[#FFD700]" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#FFD700] text-[#3A125E] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#3A125E]">3</span>
          </div>
          <BadgeCheck size={24} className="text-[#FFD700] cursor-pointer" fill="#FFD700" stroke="#3A125E" />
          <button className="bg-[#FFD700] text-[#3A125E] font-bold text-xs px-[14px] py-[6px] rounded-md hover:bg-yellow-400 transition-colors shadow-sm">
            PYQ
          </button>
        </div>
      </header>

      {/* 2. Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[80px] flex flex-col gap-5 hide-scrollbar">
        
        {/* 3. Profile Identity Card */}
        <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative border border-gray-50">
          {/* Subtle watermark background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none rounded-[24px]" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-53.797 53.8-2.49-2.49L54.627 0z' fill='%233A125E' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
          </div>
          
          <div className="flex gap-4 relative z-10">
            <img 
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
              alt="Preetam Singh Yadav" 
              className="w-[84px] h-[84px] rounded-[16px] object-cover shadow-sm border-2 border-gray-100"
            />
            <div className="flex flex-col justify-center flex-1">
              <div className="flex items-start justify-between">
                <h2 className="font-extrabold text-[17px] text-[#3A125E] leading-[1.2] uppercase tracking-wide">
                  PREETAM SINGH<br/>YADAV
                </h2>
                <BadgeCheck size={20} className="text-[#FFD700] mt-0.5 shrink-0" fill="#FFD700" stroke="#fff" />
              </div>
              <p className="text-gray-600 font-medium text-[13px] mt-1.5 flex items-center gap-1">
                4/18/2026 <span className="text-[10px]">•</span> Recorded
              </p>
              <p className="text-gray-500 font-medium text-[13px] mt-0.5">Ramlal Anand college</p>
            </div>
          </div>
          <div className="mt-3 text-gray-800 text-[14px] font-medium relative z-10">
            Welcome Back, Preetam! Let's Dance!
          </div>
        </div>

        {/* 4. Stats Row */}
        <div className="flex gap-2">
          <div className="flex-1 bg-[#FFD700] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgb(255,215,0,0.3)]">
            <span className="text-[#3A125E] text-[11px] font-bold mb-1 uppercase tracking-wide opacity-80">Total Dance Time</span>
            <span className="text-[#3A125E] text-xl font-extrabold">120 Hours</span>
            <Activity size={32} className="absolute -right-2 -bottom-2 text-white/50" />
          </div>
          <div className="flex-1 bg-[#3A125E] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgb(58,18,94,0.3)]">
            <span className="text-white/80 text-[11px] font-medium mb-1 tracking-wide">New Routines</span>
            <span className="text-white text-[15px] font-bold">15 Routines</span>
            <Users size={28} className="absolute -right-1 -bottom-1 text-white/10" />
          </div>
          <div className="flex-1 bg-[#3A125E] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgb(58,18,94,0.3)]">
            <span className="text-white/80 text-[11px] font-medium mb-1 tracking-wide">Top Routine</span>
            <span className="text-white text-[15px] font-bold truncate">'Urban Flow'</span>
            <TrendingUp size={28} className="absolute -right-1 -bottom-1 text-white/10" />
          </div>
        </div>

        {/* 5. Performance Chart Card */}
        <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#3A125E] text-[15px]">Performance Chart</h3>
            <span className="text-[13px] font-semibold text-gray-700">+250 Growth</span>
          </div>
          
          {/* Chart Placeholder Area */}
          <div className="h-[120px] w-full relative mb-2 flex items-end">
            <div className="w-full h-[80%] bg-gradient-to-t from-[#3A125E]/20 to-[#FFD700]/10 rounded-t-lg relative overflow-hidden" style={{ clipPath: 'polygon(0 100%, 0 80%, 20% 70%, 40% 75%, 60% 40%, 80% 30%, 100% 10%, 100% 100%)' }}>
               <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-50"></div>
            </div>
            <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
               <path d="M0 80 Q 10 70 20 70 T 40 75 T 60 40 T 80 30 T 100 10" fill="none" stroke="#3A125E" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <div className="flex justify-between text-[11px] text-gray-400 font-medium mb-6">
            <span>Last</span>
            <span>30 days</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-start px-2 gap-4">
            <button className="flex flex-col items-center gap-2 group flex-1">
              <div className="w-12 h-12 rounded-full bg-[#FF7675] text-white flex items-center justify-center shadow-[0_4px_15px_rgb(255,118,117,0.4)] group-hover:scale-105 transition-transform">
                <Play fill="white" size={20} className="ml-1" />
              </div>
              <span className="text-[11px] font-medium text-center text-gray-700 leading-tight">Upload New<br/>Routine (+)</span>
            </button>
            <button className="flex flex-col items-center gap-2 group flex-1">
              <div className="w-12 h-12 rounded-full border border-gray-200 text-[#3A125E] flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <UserCog size={22} />
              </div>
              <span className="text-[11px] font-medium text-center text-gray-700 leading-tight">Edit Profile<br/>(👤)</span>
            </button>
            <button className="flex flex-col items-center gap-2 group flex-1">
              <div className="w-12 h-12 rounded-full border border-gray-200 text-[#3A125E] flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <BarChart2 size={22} />
              </div>
              <span className="text-[11px] font-medium text-center text-gray-700 leading-tight">View Insights<br/>&nbsp;</span>
            </button>
          </div>
        </div>

        {/* 6. Profile Content & Grid */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 overflow-hidden flex flex-col mb-4">
          <div className="bg-[#F8F9FA] py-3 text-center border-b border-gray-100">
            <span className="text-[#3A125E] font-bold text-[14px] uppercase tracking-widest">Profile Content</span>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'grid' ? 'text-[#3A125E] border-b-[3px] border-[#3A125E]' : 'text-gray-400 border-b-[3px] border-transparent'}`}
            >
              Recent Posts (Grid)
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'list' ? 'text-[#3A125E] border-b-[3px] border-[#3A125E]' : 'text-gray-400 border-b-[3px] border-transparent'}`}
            >
              Connections (List)
            </button>
          </div>

          <div className="p-[6px]">
            {activeTab === 'grid' && (
              <div className="grid grid-cols-3 gap-[6px]">
                {gridItems.map((item) => (
                  <div key={item.id} className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer bg-gray-900">
                    <img 
                      src={`https://images.unsplash.com/photo-${1500000000000 + item.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80`} 
                      alt="Dance Clip" 
                      className="w-full h-full object-cover opacity-80"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1547153760-18fc86324498?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'; }}
                    />
                    
                    {/* Transparent Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/20 border border-white/50 backdrop-blur-sm flex items-center justify-center text-white/80 group-hover:bg-white/20 transition-all group-hover:scale-110">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                    
                    {/* Bottom Stats Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-white/70 text-[9px] font-medium">Views</span>
                        <span className="text-white text-[11px] font-bold">{item.views}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-white/70 text-[9px] font-medium">Likes</span>
                        <span className="text-white text-[11px] font-bold">{item.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'list' && (
              <div className="p-4 text-center text-gray-500 font-medium text-sm">
                Connections list view...
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 7. Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-[#F4ECD8] border-t border-gray-200/50 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-[64px] px-2">
          
          {/* Active Home Icon with Gradient Circle */}
          <button className="flex flex-col items-center justify-center relative w-14 h-full group">
            <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-[#00FFFF] to-[#3A125E] opacity-90 shadow-[0_4px_15px_rgb(58,18,94,0.3)]"></div>
            <Home size={22} className="relative z-10 text-white" strokeWidth={2.5} />
          </button>
          
          <button className="flex flex-col items-center justify-center w-14 h-full text-[#3A125E]/60 hover:text-[#3A125E] transition-colors">
            <Film size={24} strokeWidth={2} />
          </button>
          
          <button className="flex flex-col items-center justify-center w-14 h-full text-[#3A125E]/60 hover:text-[#3A125E] transition-colors">
            <Search size={24} strokeWidth={2} />
          </button>
          
          <button className="flex flex-col items-center justify-center w-14 h-full text-[#3A125E]/60 hover:text-[#3A125E] transition-colors">
            <PlusSquare size={24} strokeWidth={2} />
          </button>
          
          <button className="flex flex-col items-center justify-center w-14 h-full text-[#3A125E]/60 hover:text-[#3A125E] transition-colors">
            <User size={24} strokeWidth={2} />
          </button>

        </div>
      </nav>

    </div>
  );
}
