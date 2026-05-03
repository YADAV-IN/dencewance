import React, { useMemo } from 'react';
import SkeletonImage from './SkeletonImage';

class CampaignErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Campaign layer error:', error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const isEmbeddableVideo = (url = '') => /youtube\.com|youtu\.be|vimeo\.com/i.test(url);

const buildVideoSrc = (url = '') => {
  if (!url) return '';
  if (/youtube\.com\/watch\?v=/i.test(url)) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (/youtu\.be\//i.test(url)) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (/vimeo\.com\//i.test(url) && !/player\.vimeo\.com/i.test(url)) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
};

function CampaignRenderer({ campaign, resolveMediaUrl, onDismiss }) {
  const {
    mode = 'banner',
    title = '',
    subtitle = '',
    description = '',
    ctaText = '',
    ctaUrl = '',
    openInNewTab = true,
    mediaType = 'none',
    mediaUrl = '',
    allowDismiss = true,
  } = campaign || {};

  const mediaSource = resolveMediaUrl(mediaUrl);
  const videoSource = useMemo(() => buildVideoSrc(mediaSource), [mediaSource]);

  const mediaNode = (() => {
    if (!mediaSource || mediaType === 'none') return null;

    if (mediaType === 'video') {
      if (isEmbeddableVideo(videoSource)) {
        return (
          <div className="campaign-media-frame">
            <iframe
              src={videoSource}
              title={title || 'campaign-video'}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return <video src={mediaSource} className="campaign-media-video" autoPlay muted loop playsInline controls />;
    }

    return (
      <SkeletonImage
        src={mediaSource}
        alt={title || 'campaign'}
        className="campaign-media-image"
        wrapperClassName="campaign-media-image"
        wrapperStyle={{ display: 'block', width: '100%' }}
      />
    );
  })();

  const ctaNode = ctaText && ctaUrl ? (
    <a
      className="campaign-cta"
      href={ctaUrl}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noreferrer' : undefined}
    >
      {ctaText}
    </a>
  ) : null;

  if (mode === 'fullpage') {
    return (
      <section className="campaign-fullpage" role="dialog" aria-label="Campaign takeover">
        <div className="campaign-fullpage-inner">
          {allowDismiss && (
            <button type="button" className="campaign-close" onClick={onDismiss}>
              Skip
            </button>
          )}
          <div className="campaign-content-block">
            {subtitle ? <p className="campaign-kicker">{subtitle}</p> : null}
            {title ? <h1>{title}</h1> : null}
            {description ? <p>{description}</p> : null}
            {ctaNode}
          </div>
          {mediaNode}
        </div>
      </section>
    );
  }

  return (
    <section className="campaign-banner" aria-label="Campaign banner">
      <div className="campaign-banner-inner">
        <div className="campaign-copy">
          {title ? <strong>{title}</strong> : null}
          {description ? <span>{description}</span> : null}
        </div>
        <div className="campaign-actions">
          {ctaNode}
          {allowDismiss && (
            <button type="button" className="campaign-dismiss" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function CampaignLayer({ campaign, resolveMediaUrl, onDismiss }) {
  if (!campaign?.enabled) return null;
  return (
    <CampaignErrorBoundary>
      <CampaignRenderer campaign={campaign} resolveMediaUrl={resolveMediaUrl} onDismiss={onDismiss} />
    </CampaignErrorBoundary>
  );
}
