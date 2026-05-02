import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SkeletonImage({
  src,
  alt,
  className = '',
  style,
  wrapperClassName = '',
  wrapperStyle,
  skeletonHeight,
  circle = false,
  fallbackSrc,
  onClick,
  loading = 'lazy',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');

  useEffect(() => {
    setIsLoaded(false);
    setCurrentSrc(src || fallbackSrc || '');
  }, [src, fallbackSrc]);

  return (
    <span className={`image-skeleton-wrapper ${wrapperClassName}`.trim()} style={wrapperStyle}>
      {!isLoaded && (
        <Skeleton
          circle={circle}
          height={skeletonHeight || '100%'}
          width="100%"
          baseColor="rgba(180, 190, 210, 0.22)"
          highlightColor="rgba(255, 255, 255, 0.55)"
          className="image-skeleton-loader"
        />
      )}
      <img
        loading={loading}
        src={currentSrc}
        alt={alt}
        className={className}
        style={{ ...style, opacity: isLoaded ? 1 : 0 }}
        onClick={onClick}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            return;
          }
          setIsLoaded(true);
        }}
      />
    </span>
  );
}
