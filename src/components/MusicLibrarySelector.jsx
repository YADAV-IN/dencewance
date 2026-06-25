import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, Music, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MusicLibrarySelector({ isOpen, onClose, onSelect }) {
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`${API_URL}/api/music`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success) {
            setTracks(data.data);
          }
        })
        .catch(err => console.error('Error fetching music:', err))
        .finally(() => setIsLoading(false));
    } else {
      audioRef.current.pause();
      setPlayingId(null);
    }
  }, [isOpen]);

  // Handle audio play/pause preview
  const togglePlay = (track) => {
    if (playingId === (track._id || track.id)) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = track.audio_url;
      audioRef.current.play().catch(e => console.error(e));
      setPlayingId(track._id || track.id);
    }
  };

  const handleSelect = (track) => {
    audioRef.current.pause();
    setPlayingId(null);
    onSelect(track);
    onClose();
  };

  const filteredTracks = tracks.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-[#FAF7EE] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[201] transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '75vh' }}>
        
        {/* Header */}
        <div className="flex flex-col px-6 pt-4 pb-2 border-b border-gray-200/60 bg-white/50 backdrop-blur rounded-t-[32px] sticky top-0 z-10">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[22px] font-black italic font-serif text-[#2B2315] flex items-center gap-2">
              <Music size={22} className="text-[#3A125E]" /> Music Library
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tracks or artists..."
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 font-medium flex flex-col items-center">
              <Music size={48} className="text-gray-300 mb-2" />
              <p>No tracks found</p>
            </div>
          ) : (
            filteredTracks.map(track => {
              const trackId = track._id || track.id;
              return (
              <div key={trackId} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-purple-200 group">
                {/* Cover & Play button */}
                <div 
                  className="relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 bg-gray-100"
                  onClick={() => togglePlay(track)}
                >
                  {track.cover_image_url ? (
                    <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-purple-100 to-pink-100">
                      <Music size={20} className="text-purple-400" />
                    </div>
                  )}
                  <div className={`absolute inset-0 flex justify-center items-center bg-black/40 transition-opacity ${playingId === trackId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingId === trackId ? <Pause size={24} fill="white" className="text-white" /> : <Play size={24} fill="white" className="text-white ml-1" />}
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => handleSelect(track)}>
                  <h3 className="font-bold text-gray-900 text-[15px] truncate cursor-pointer hover:text-purple-600">{track.title}</h3>
                  <p className="text-xs font-semibold text-gray-500 truncate">{track.artist}</p>
                </div>
                
                {/* Select Button */}
                <button 
                  onClick={() => handleSelect(track)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-full transition-colors border border-purple-200"
                >
                  Use
                </button>
              </div>
            )})
          )}
        </div>
        
      </div>
    </>
  );
}
