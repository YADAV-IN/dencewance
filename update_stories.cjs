const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/SocialApp.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const regex = /\{\/\* Left Corner branding \(Message Bubble Style\) \*\/\}.*?<\/section>/s;

const newContent = `{/* Left Corner branding (Message Bubble Style) */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 30px rgba(58, 18, 94, 0.08)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(58, 18, 94, 0.2) 0%, transparent 100%)' }}></div>
                  <h2 style={{ margin: '0 0 16px 8px', fontSize: '15px', fontWeight: '800', color: 'var(--primary-dark)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>GLOBAL TRENDING STATUS</h2>
                  
                  <section className="stories-container" style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '4px 8px', margin: 0, background: 'transparent', boxShadow: 'none', border: 'none', scrollbarWidth: 'none', MsOverflowStyle: 'none' }}>
                    <div className="story status-add" style={{ cursor: 'pointer', textAlign: 'center', minWidth: '84px', position: 'relative' }} onClick={() => statusUploadRef.current && statusUploadRef.current.click()}>
                      <div style={{ width: '84px', height: '140px', borderRadius: '16px', border: '2px dashed var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 215, 0, 0.05)' }}>
                        {isStatusUploading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', borderRadius: '14px' }}>
                             <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{Math.round(statusUploadProgress)}%</span>
                             <div style={{ width: '70%', height: '4px', background: '#333', marginTop: '6px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'var(--accent)', width: \`\${Math.round(statusUploadProgress)}%\`, transition: 'width 0.2s' }}></div>
                             </div>
                          </div>
                        ) : (
                          <strong style={{ fontSize: '32px', color: 'var(--accent)' }}>+</strong>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', marginTop: '10px', display: 'block', color: 'var(--text-muted)', fontWeight: '600' }}>{isStatusUploading ? 'Uploading...' : 'New Status'}</span>
                      <input type="file" ref={statusUploadRef} style={{ display: 'none' }} accept="video/*" onChange={handleStatusUpload} />
                    </div>
                    
                    {statuses.length > 0 ? (
                      statuses.map((story, i) => {
                        const thumb = story.cover_image_url || story.media_url || story.thumbnail || '';
                        return (
                          <div key={story._id || i} onClick={() => { markStatusSeen(story.id || story._id); setActiveStoryIndex(i); setViewingMedia('status'); setActiveTab('stories'); }} style={{ cursor: 'pointer', minWidth: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <div style={{ width: '84px', height: '140px', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--accent)', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.15)' }}>
                              {thumb ? (
                                <SkeletonImage src={resolveMediaUrl(thumb)} alt={story.title || 'Preview'} wrapperStyle={{ width: '100%', height: '100%', display: 'block' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: '#222' }}></div>
                              )}
                              
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }}></div>
                              
                              {/* Large circular play button in the center */}
                              <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255, 215, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                            
                            {/* Avatar overlapping bottom border */}
                            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', zIndex: 2, background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                               <SkeletonImage src={resolveMediaUrl(story.creator_avatar || story.avatar_url)} fallbackSrc={\`https://ui-avatars.com/api/?name=\${encodeURIComponent(story.creator_name || 'User')}&background=random\`} alt={story.creator_name || 'Creator'} wrapperStyle={{ width: '100%', height: '100%', display: 'block' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle={true} />
                            </div>
                            
                            <span style={{ color: 'var(--text-primary)', fontSize: '11px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500', marginTop: '12px' }}>{(story.creator_name || story.title || 'Anon').substring(0, 12)}</span>
                          </div>
                        );
                      })
                    ) : null}
                  </section>
                </div>`;

if(regex.test(content)) {
    content = content.replace(regex, newContent);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully updated stories layout');
} else {
    console.log('Could not find regex match for stories section');
}
