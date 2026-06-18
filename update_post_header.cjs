const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/SocialApp.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const targetRegex = /<div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>(.*?)<div className="post-body">/s;

const newHeader = `<div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <button
                          onClick={() => navigateToProfile(postAuthorId)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', outline: 'none' }}
                          title="View Profile"
                        >
                          <SkeletonImage
                            src={post.source}
                            fallbackSrc={\`https://ui-avatars.com/api/?name=\${encodeURIComponent(post.author_name || 'User')}&background=random\`}
                            alt="Avatar"
                            className="avatar"
                            wrapperStyle={{ width: 56, height: 56, borderRadius: '50%', display: 'block' }}
                            circle={true}
                          />
                        </button>
                        <div className="post-user-info">
                          <button
                            onClick={() => navigateToProfile(postAuthorId)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit', outline: 'none' }}
                            title="View Profile"
                          >
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {post.author_name || 'DenceWance User'}
                              <svg viewBox="0 0 24 24" fill="var(--accent)" width="18" height="18" style={{ marginTop: '2px' }}>
                                <path d="M12 2l2.4 2.8 3.7-.5.9 3.6 3.4 1.5-1.5 3.4.9 3.6-3.7-.5-2.4 2.8L12 18l-3.7.8-2.4-2.8-3.7.5.9-3.6-3.4-1.5 1.5-3.4-.9-3.6 3.7.5 2.4-2.8L12 2z"/>
                                <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </strong>
                          </button>
                        <small>{new Date(post.published_at || Date.now()).toLocaleDateString()} • Recorded</small>
                      </div>
                    </div>
                    {/* More menu (three-dot) */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(openMenuFor === (post._id || post.id) ? null : (post._id || post.id)); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--primary-dark)' }}
                        aria-label="More"
                      >
                        <MoreVerticalIcon />
                      </button>

                      {openMenuFor === (post._id || post.id) && (
                        <div className="more-menu" style={{ position: 'absolute', right: 0, top: '32px', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '6px', zIndex: 9999, minWidth: 140, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} onClick={(e)=>e.stopPropagation()}>
                          <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); try { if (navigator.share) { navigator.share({ title: post.title || 'DenceWance', text: post.excerpt || '', url: window.location.href }); } else { alert('Share not supported'); } } catch(_){} setOpenMenuFor(null); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer' }}>Share</button>
                          {((adminData?.role === 'admin') || (adminData?.role === 'superadmin') || (post.author_id === adminId) || (adminData && (post.author_id === adminData._id || post.author_name === adminData.name)) || adminId) ? (
                            <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); setOpenMenuFor(null); handleDeletePost(post.id || post._id); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>Delete</button>
                          ) : null}
                          <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); alert('Reported.'); setOpenMenuFor(null); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer' }}>Report</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="post-body">`;

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, newHeader);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully updated post header layout');
} else {
    console.log('Could not find regex match for post header');
}
