import React, { useState, useEffect } from 'react';
import { X, Save, Hand, RefreshCw } from 'lucide-react';

export const DEFAULT_GESTURE_PREFS = {
  layout: 'default',
  mappings: {
    singleTap: 'play_pause',
    doubleTap: 'like',
    swipeLeft: 'none',
    swipeRight: 'none',
    swipeUp: 'next',
    swipeDown: 'prev',
  }
};

const ACTION_OPTIONS = [
  { value: 'none', label: 'No Action' },
  { value: 'play_pause', label: 'Play / Pause' },
  { value: 'mute_unmute', label: 'Mute / Unmute' },
  { value: 'like', label: 'Like Clip' },
  { value: 'open_comments', label: 'Open Comments' },
  { value: 'next', label: 'Next Clip' },
  { value: 'prev', label: 'Previous Clip' },
];

export default function GestureSettingsModal({ isOpen, onClose, onSave }) {
  const [prefs, setPrefs] = useState(DEFAULT_GESTURE_PREFS);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('CLIPS_GESTURE_PREFS');
      if (stored) {
        try {
          setPrefs(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setPrefs(DEFAULT_GESTURE_PREFS);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLayoutChange = (layout) => {
    const newPrefs = { ...prefs, layout };
    if (layout === 'default') {
      newPrefs.mappings = { ...DEFAULT_GESTURE_PREFS.mappings };
    } else if (layout === 'one-handed') {
      newPrefs.mappings = {
        singleTap: 'mute_unmute',
        doubleTap: 'like',
        swipeLeft: 'open_comments',
        swipeRight: 'none',
        swipeUp: 'next',
        swipeDown: 'prev',
      };
    }
    setPrefs(newPrefs);
  };

  const handleMappingChange = (gesture, action) => {
    setPrefs({
      layout: 'custom',
      mappings: {
        ...prefs.mappings,
        [gesture]: action
      }
    });
  };

  const saveAndClose = () => {
    localStorage.setItem('CLIPS_GESTURE_PREFS', JSON.stringify(prefs));
    if (onSave) onSave(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-extrabold text-[#3A125E] flex items-center gap-2 text-lg">
            <Hand size={20} />
            Gesture Controls
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full text-gray-500 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5 max-h-[60vh]">
          
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">Select Layout</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleLayoutChange('default')}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${prefs.layout === 'default' ? 'border-[#3A125E] bg-[#3A125E]/5 text-[#3A125E]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                Default
              </button>
              <button 
                onClick={() => handleLayoutChange('one-handed')}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${prefs.layout === 'one-handed' ? 'border-[#3A125E] bg-[#3A125E]/5 text-[#3A125E]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                One-Handed
              </button>
              <button 
                onClick={() => handleLayoutChange('custom')}
                className={`col-span-2 p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${prefs.layout === 'custom' ? 'border-[#3A125E] bg-[#3A125E]/5 text-[#3A125E]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                Custom Mapping
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100" />

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">Interactions</label>
              {prefs.layout !== 'custom' && (
                 <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Preset Active</span>
              )}
            </div>

            {Object.entries(prefs.mappings).map(([gestureKey, action]) => {
              const labelMap = {
                singleTap: 'Single Tap',
                doubleTap: 'Double Tap',
                swipeLeft: 'Swipe Left',
                swipeRight: 'Swipe Right',
                swipeUp: 'Swipe Up',
                swipeDown: 'Swipe Down'
              };
              return (
                <div key={gestureKey} className="flex justify-between items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600 flex-1">{labelMap[gestureKey]}</span>
                  <select 
                    value={action}
                    onChange={(e) => handleMappingChange(gestureKey, e.target.value)}
                    disabled={prefs.layout !== 'custom'}
                    className={`w-40 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none ${prefs.layout !== 'custom' ? 'opacity-70 cursor-not-allowed' : 'focus:border-[#3A125E] cursor-pointer'}`}
                  >
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={() => setPrefs(DEFAULT_GESTURE_PREFS)}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Reset
          </button>
          <button 
            onClick={saveAndClose}
            className="flex-[2] bg-[#3A125E] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2b0d47] transition-colors shadow-lg shadow-[#3A125E]/20 cursor-pointer"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
