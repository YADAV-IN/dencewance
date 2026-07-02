import React, { useState, useRef, useEffect } from 'react';

const PostCaption = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      // Check if the content height is greater than 2 lines (approx 44px)
      if (contentRef.current.scrollHeight > 44) {
        setIsTruncatable(true);
      }
    }
  }, [content]);

  const renderContentWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        );
      }
      return part;
    });
  };

  if (!content) return null;

  return (
    <div className="relative mt-2 mb-3">
      <div 
        ref={contentRef}
        className={`text-[#2B2315] text-[14px] leading-[22px] font-medium whitespace-pre-wrap transition-all duration-300 ease-in-out ${!isExpanded ? 'line-clamp-2' : ''}`}
      >
        {renderContentWithLinks(content)}
      </div>
      {isTruncatable && !isExpanded && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="text-gray-500 font-semibold text-[13px] hover:text-gray-700 mt-0.5"
        >
          ...more
        </button>
      )}
    </div>
  );
};

export default PostCaption;
