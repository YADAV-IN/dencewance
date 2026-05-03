              <form className="admin-form advanced-form" onSubmit={handleNewsCreate}>
                <h3>📰 नई खबर बनाएं (Advanced)</h3>
                
                {/* BASIC INFORMATION */}
                <div className="form-section">
                  <h4>📝 मुख्य जानकारी</h4>
                  <label>
                    हेडलाइन *
                    <input value={newsForm.title} onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))} required placeholder="खबर का शीर्षक..." />
                  </label>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      कैटेगरी *
                      <select value={newsForm.category} onChange={(e) => setNewsForm((prev) => ({ ...prev, category: e.target.value }))}>
                        <option value="कैंपस">कैंपस</option>
                        <option value="खेल">खेल</option>
                        <option value="मौसम">मौसम</option>
                        <option value="शिक्षा">शिक्षा</option>
                        <option value="तकनीक">तकनीक</option>
                        <option value="स्वास्थ्य">स्वास्थ्य</option>
                        <option value="अर्थव्यवस्था">अर्थव्यवस्था</option>
                        <option value="राजनीति">राजनीति</option>
                        <option value="मनोरंजन">मनोरंजन</option>
                      </select>
                    </label>
                    <label style={{flex: 1}}>
                      भाषा
                      <select value={newsForm.language} onChange={(e) => setNewsForm((prev) => ({ ...prev, language: e.target.value }))}>
                        <option value="hi">हिंदी</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    शॉर्ट एक्सर्प्ट *
                    <textarea rows="2" value={newsForm.excerpt} onChange={(e) => setNewsForm((prev) => ({ ...prev, excerpt: e.target.value }))} required placeholder="संक्षिप्त विवरण..." />
                  </label>
                  <label>
                    कंटेंट *
                    <textarea rows="6" value={newsForm.content} onChange={(e) => setNewsForm((prev) => ({ ...prev, content: e.target.value }))} required placeholder="पूरी खबर यहां लिखें..." />
                  </label>
                  <label>
                    टैग्स (comma separated)
                    <input value={newsForm.tags} onChange={(e) => setNewsForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="BJMC, मीडिया, खबर" />
                  </label>
                </div>

                {/* MEDIA & CONTENT */}
                <div className="form-section">
                  <h4>🎬 मीडिया फाइल्स</h4>
                  <label>
                    कवर इमेज URL
                    <input value={newsForm.cover_image_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, cover_image_url: e.target.value }))} placeholder="https://example.com/image.jpg" />
                  </label>
                  <label>
                    गैलरी URLs (comma separated)
                    <textarea rows="2" value={newsForm.gallery_urls} onChange={(e) => setNewsForm((prev) => ({ ...prev, gallery_urls: e.target.value }))} placeholder="https://img1.jpg, https://img2.jpg" />
                  </label>
                  <label>
                    वीडियो URL (YouTube/Vimeo)
                    <input value={newsForm.video_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                  </label>
                  <label>
                    ऑडियो URL
                    <input value={newsForm.audio_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, audio_url: e.target.value }))} placeholder="https://example.com/audio.mp3" />
                  </label>
                </div>

                {/* AUTHOR DETAILS */}
                <div className="form-section">
                  <h4>✍️ लेखक जानकारी</h4>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      लेखक नाम
                      <input value={newsForm.author_name} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_name: e.target.value }))} placeholder="ALOK Team" />
                    </label>
                    <label style={{flex: 1}}>
                      लेखक ईमेल
                      <input type="email" value={newsForm.author_email} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_email: e.target.value }))} placeholder="author@alok.com" />
                    </label>
                  </div>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      🐦 Twitter Handle
                      <input value={newsForm.author_twitter} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_twitter: e.target.value }))} placeholder="@username" />
                    </label>
                    <label style={{flex: 1}}>
                      📷 Instagram Handle
                      <input value={newsForm.author_instagram} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_instagram: e.target.value }))} placeholder="@username" />
                    </label>
                  </div>
                  <label>
                    सोर्स/क्रेडिट
                    <input value={newsForm.source} onChange={(e) => setNewsForm((prev) => ({ ...prev, source: e.target.value }))} placeholder="ALOK" />
                  </label>
                </div>

                {/* SEO & METADATA */}
                <div className="form-section">
                  <h4>🔍 SEO & मेटाडेटा</h4>
                  <label>
                    SEO Title
                    <input value={newsForm.seo_title} onChange={(e) => setNewsForm((prev) => ({ ...prev, seo_title: e.target.value }))} placeholder="Search engine के लिए title" />
                  </label>
                  <label>
                    Meta Description
                    <textarea rows="2" value={newsForm.meta_description} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_description: e.target.value }))} placeholder="Search results में दिखने वाला description..." />
                  </label>
                  <label>
                    Meta Keywords (comma separated)
                    <input value={newsForm.meta_keywords} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_keywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3" />
                  </label>
                  <label>
                    AI सारांश
                    <textarea rows="2" value={newsForm.ai_summary} onChange={(e) => setNewsForm((prev) => ({ ...prev, ai_summary: e.target.value }))} placeholder="AI generated summary..." />
                  </label>
                </div>

                {/* LOCATION */}
                <div className="form-section">
                  <h4>📍 स्थान</h4>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      Location/City
                      <input value={newsForm.location} onChange={(e) => setNewsForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="नई दिल्ली, भारत" />
                    </label>
                    <label style={{flex: 1}}>
                      Coordinates (lat,long)
                      <input value={newsForm.coordinates} onChange={(e) => setNewsForm((prev) => ({ ...prev, coordinates: e.target.value }))} placeholder="28.6139, 77.2090" />
                    </label>
                  </div>
                </div>

                {/* SOCIAL MEDIA */}
                <div className="form-section">
                  <h4>🔗 सोशल मीडिया लिंक्स</h4>
                  <label>
                    🐦 Twitter Post URL
                    <input value={newsForm.twitter_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, twitter_url: e.target.value }))} placeholder="https://twitter.com/..." />
                  </label>
                  <label>
                    📘 Facebook Post URL
                    <input value={newsForm.facebook_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, facebook_url: e.target.value }))} placeholder="https://facebook.com/..." />
                  </label>
                  <label>
                    📷 Instagram Post URL
                    <input value={newsForm.instagram_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, instagram_url: e.target.value }))} placeholder="https://instagram.com/p/..." />
                  </label>
                  <label>
                    📺 YouTube Video URL
                    <input value={newsForm.youtube_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                  </label>
                </div>

                {/* PUBLISHING OPTIONS */}
                <div className="form-section">
                  <h4>⚙️ पब्लिशिंग सेटिंग्स</h4>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      स्टेटस
                      <select value={newsForm.status} onChange={(e) => setNewsForm((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="draft">Draft (मसौदा)</option>
                        <option value="published">Published (प्रकाशित)</option>
                        <option value="scheduled">Scheduled (निर्धारित)</option>
                        <option value="archived">Archived (संग्रहित)</option>
                      </select>
                    </label>
                    <label style={{flex: 1}}>
                      प्राथमिकता
                      <select value={newsForm.priority} onChange={(e) => setNewsForm((prev) => ({ ...prev, priority: e.target.value }))}>
                        <option value="low">Low (कम)</option>
                        <option value="normal">Normal (सामान्य)</option>
                        <option value="high">High (उच्च)</option>
                        <option value="urgent">Urgent (तत्काल)</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label style={{flex: 1}}>
                      पब्लिश टाइम (ISO)
                      <input type="datetime-local" value={newsForm.published_at ? newsForm.published_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                    </label>
                    <label style={{flex: 1}}>
                      एक्सपायरी टाइम
                      <input type="datetime-local" value={newsForm.expire_at ? newsForm.expire_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, expire_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                    </label>
                  </div>
                  <div className="form-row" style={{gap: '16px'}}>
                    <label className="switch">
                      <input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_featured: e.target.checked }))} />
                      <span>⭐ फ़ीचर्ड रखें</span>
                    </label>
                    <label className="switch">
                      <input type="checkbox" checked={newsForm.is_breaking} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_breaking: e.target.checked }))} />
                      <span>🔴 Breaking News रखें</span>
                    </label>
                  </div>
                </div>

                <button className="primary" type="submit" style={{width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600'}}>
                  ✅ खबर सेव करें
                </button>
              </form>
