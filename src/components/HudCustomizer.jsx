import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Move } from 'lucide-react';

export const DEFAULT_HUD_ZONES = [
  { id: 'z1', action: 'play_pause', gesture: 'singleTap', x: 0, y: 10, w: 100, h: 70 },
  { id: 'z2', action: 'like', gesture: 'doubleTap', x: 0, y: 10, w: 100, h: 70 },
];

const ACTIONS = [
  { value: 'play_pause', label: 'Play / Pause' },
  { value: 'mute_unmute', label: 'Mute / Unmute' },
  { value: 'like', label: 'Like Clip' },
  { value: 'open_comments', label: 'Open Comments' },
  { value: 'next', label: 'Next Clip' },
  { value: 'prev', label: 'Previous Clip' },
];

const GESTURES = [
  { value: 'singleTap', label: 'Single Tap' },
  { value: 'doubleTap', label: 'Double Tap' },
  { value: 'swipeUp', label: 'Swipe Up' },
  { value: 'swipeDown', label: 'Swipe Down' },
  { value: 'swipeLeft', label: 'Swipe Left' },
  { value: 'swipeRight', label: 'Swipe Right' },
];

export default function HudCustomizer({ isOpen, onClose }) {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  
  const containerRef = useRef(null);
  
  // Dragging state
  const dragRef = useRef({
    isDragging: false,
    isResizing: false,
    zoneId: null,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    startZoneX: 0,
    startZoneY: 0
  });

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('CLIPS_HUD_LAYOUT');
      if (stored) {
        try {
          setZones(JSON.parse(stored));
        } catch (e) {
          setZones(DEFAULT_HUD_ZONES);
        }
      } else {
        setZones(DEFAULT_HUD_ZONES);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('CLIPS_HUD_LAYOUT', JSON.stringify(zones));
    // Trigger global event so ReelsViewer can pick up changes instantly
    window.dispatchEvent(new Event('hudLayoutUpdated'));
    onClose();
  };

  const handleAddZone = () => {
    const newZone = {
      id: 'z' + Date.now(),
      action: 'play_pause',
      gesture: 'singleTap',
      x: 25, y: 25, w: 50, h: 50
    };
    setZones([...zones, newZone]);
    setSelectedZone(newZone.id);
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
    if (selectedZone === id) setSelectedZone(null);
  };

  const updateZone = (id, updates) => {
    setZones(zones.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  // Pointer Events for Drag & Resize
  const onPointerDown = (e, zoneId, isResizing) => {
    e.stopPropagation();
    setSelectedZone(zoneId);
    
    const zone = zones.find(z => z.id === zoneId);
    if (!zone || !containerRef.current) return;

    dragRef.current = {
      isDragging: !isResizing,
      isResizing: isResizing,
      zoneId,
      startX: e.clientX,
      startY: e.clientY,
      startW: zone.w,
      startH: zone.h,
      startZoneX: zone.x,
      startZoneY: zone.y
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.zoneId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;

    if (drag.isDragging) {
      let newX = drag.startZoneX + dx;
      let newY = drag.startZoneY + dy;
      
      // Boundaries
      newX = Math.max(0, Math.min(newX, 100 - drag.startW));
      newY = Math.max(0, Math.min(newY, 100 - drag.startH));

      updateZone(drag.zoneId, { x: newX, y: newY });
    } else if (drag.isResizing) {
      let newW = drag.startW + dx;
      let newH = drag.startH + dy;
      
      // Boundaries & Min sizes
      newW = Math.max(10, Math.min(newW, 100 - drag.startZoneX));
      newH = Math.max(10, Math.min(newH, 100 - drag.startZoneY));

      updateZone(drag.zoneId, { w: newW, h: newH });
    }
  };

  const onPointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.isResizing = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex flex-col font-sans select-none touch-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-black border-b border-white/10 shrink-0">
        <h2 className="text-white font-black italic tracking-wide text-lg">HUD CUSTOMIZER</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleAddZone}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Zone
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-[#FF2D55] hover:bg-[#ff1a47] text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,45,85,0.4)] cursor-pointer"
          >
            <Save size={16} /> Save Layout
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Editor Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gray-900 mx-auto max-w-[500px] shadow-2xl border-x border-white/10"
          onClick={() => setSelectedZone(null)}
        >
          {/* Mock Video Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 font-black text-4xl whitespace-nowrap pointer-events-none rotate-45 tracking-widest">
            HUD EDITOR
          </div>

          {/* Zones Render */}
          {zones.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <div
                key={zone.id}
                className={`absolute flex items-center justify-center border-2 overflow-hidden transition-colors ${isSelected ? 'border-[#FF2D55] bg-[#FF2D55]/20 z-20' : 'border-white/40 bg-white/10 z-10 hover:border-white/60'}`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  cursor: 'move'
                }}
                onPointerDown={(e) => onPointerDown(e, zone.id, false)}
              >
                <div className="flex flex-col items-center pointer-events-none text-center px-2">
                  <Move size={isSelected ? 24 : 18} className={isSelected ? 'text-[#FF2D55]' : 'text-white/70'} />
                  <span className={`text-[10px] font-bold uppercase mt-1 line-clamp-2 ${isSelected ? 'text-[#FF2D55]' : 'text-white/70'}`}>
                    {ACTIONS.find(a => a.value === zone.action)?.label}<br/>
                    <span className="opacity-70 text-[8px]">({GESTURES.find(g => g.value === zone.gesture)?.label})</span>
                  </span>
                </div>

                {/* Resize Handle */}
                {isSelected && (
                  <div 
                    className="absolute bottom-0 right-0 w-6 h-6 bg-[#FF2D55] rounded-tl-lg cursor-se-resize flex items-center justify-center shadow-lg"
                    onPointerDown={(e) => onPointerDown(e, zone.id, true)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 15 21 21 15 21"></polyline>
                      <line x1="21" y1="21" x2="15" y2="15"></line>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Properties Panel */}
        {selectedZoneData && (
          <div className="w-[300px] bg-black border-l border-white/10 p-5 shrink-0 animate-in slide-in-from-right-4">
            <h3 className="text-white font-extrabold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">
              Zone Properties
              <button onClick={() => handleDeleteZone(selectedZoneData.id)} className="text-white/40 hover:text-red-500 cursor-pointer transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Action</label>
                <select 
                  className="bg-white/10 text-white border border-white/20 rounded-lg p-2.5 outline-none focus:border-[#FF2D55] text-sm font-semibold cursor-pointer"
                  value={selectedZoneData.action}
                  onChange={(e) => updateZone(selectedZoneData.id, { action: e.target.value })}
                >
                  {ACTIONS.map(a => <option key={a.value} value={a.value} className="bg-gray-900">{a.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Trigger Gesture</label>
                <select 
                  className="bg-white/10 text-white border border-white/20 rounded-lg p-2.5 outline-none focus:border-[#FF2D55] text-sm font-semibold cursor-pointer"
                  value={selectedZoneData.gesture}
                  onChange={(e) => updateZone(selectedZoneData.id, { gesture: e.target.value })}
                >
                  {GESTURES.map(g => <option key={g.value} value={g.value} className="bg-gray-900">{g.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] font-bold uppercase">X Pos (%)</label>
                  <input type="number" min="0" max="100" value={Math.round(selectedZoneData.x)} onChange={(e) => updateZone(selectedZoneData.id, { x: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded p-1.5 text-white text-xs text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] font-bold uppercase">Y Pos (%)</label>
                  <input type="number" min="0" max="100" value={Math.round(selectedZoneData.y)} onChange={(e) => updateZone(selectedZoneData.id, { y: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded p-1.5 text-white text-xs text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] font-bold uppercase">Width (%)</label>
                  <input type="number" min="10" max="100" value={Math.round(selectedZoneData.w)} onChange={(e) => updateZone(selectedZoneData.id, { w: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded p-1.5 text-white text-xs text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] font-bold uppercase">Height (%)</label>
                  <input type="number" min="10" max="100" value={Math.round(selectedZoneData.h)} onChange={(e) => updateZone(selectedZoneData.id, { h: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded p-1.5 text-white text-xs text-center" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
