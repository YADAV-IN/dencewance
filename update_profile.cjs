const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/ProfileDashboard.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const regexHeader = /\{\/\* Profile Header \*\/\}.*?<div className="px-4 pb-4 flex flex-col gap-3">/s;

const newHeader = `{/* Profile Header */}
          <div className="p-4 bg-white rounded-t-3xl shadow-sm mt-4 relative">
            <div className="flex items-center gap-4">
              <SkeletonImage
                src={profile?.avatar_url || 'https://ui-avatars.com/api/?name='+(profile?.name||'User')+'&background=random'}
                alt="Profile"
                className="w-20 h-20 rounded-2xl border-none object-cover shadow-md"
                wrapperStyle={{ width: '5rem', height: '5rem', display: 'block' }}
                circle={false}
              />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-xl text-[var(--primary-dark)] leading-tight uppercase tracking-wide font-sans">{profile?.name || 'PREETAM SINGH YADAV'}</h2>
                  <svg viewBox="0 0 24 24" fill="var(--accent)" width="20" height="20">
                    <path d="M12 2l2.4 2.8 3.7-.5.9 3.6 3.4 1.5-1.5 3.4.9 3.6-3.7-.5-2.4 2.8L12 18l-3.7.8-2.4-2.8-3.7.5.9-3.6-3.4-1.5 1.5-3.4-.9-3.6 3.7.5 2.4-2.8L12 2z"/>
                    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-gray-600 font-medium text-sm mt-1">4/18/2026 • Recorded</div>
                <div className="text-gray-800 font-medium text-sm mt-1" dangerouslySetInnerHTML={{ __html: profile?.bio ? profile.bio.replace(/\\n/g, '<br/>') : 'Ramlal Anand college' }} />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-2 mt-5">
              <div className="flex-1 bg-[#1A3B47] rounded-xl p-3 flex flex-col relative overflow-hidden shadow-md">
                <span className="text-white text-sm font-semibold mb-1">Posts</span>
                <span className="text-white text-2xl font-bold">85</span>
                <div className="absolute right-2 bottom-2 opacity-80">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="10" width="20" height="10" rx="2" ry="2"/><path d="M7 10v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/></svg>
                </div>
              </div>
              <div className="flex-1 bg-[var(--accent)] rounded-xl p-3 flex flex-col relative overflow-hidden shadow-md">
                <span className="text-[var(--primary-dark)] text-sm font-semibold mb-1">Followers</span>
                <span className="text-white text-2xl font-bold drop-shadow-md">3.2k</span>
                <div className="absolute right-2 bottom-2 opacity-70">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="flex-1 bg-[var(--accent)] rounded-xl p-3 flex flex-col relative overflow-hidden shadow-md">
                <span className="text-[var(--primary-dark)] text-sm font-semibold mb-1">Following</span>
                <span className="text-white text-2xl font-bold drop-shadow-md">410</span>
                <div className="absolute right-2 bottom-2 opacity-70">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <span className="text-[var(--primary-dark)] font-extrabold uppercase tracking-widest text-lg bg-white px-4 border-t-2 border-[var(--primary-dark)] pt-4 inline-block">PROFILE CONTENT</span>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col gap-3 bg-white">`;

content = content.replace(regexHeader, newHeader);

const regexTabs = /\{\/\* Grid Tabs \*\/\}.*?<div className="flex-1 overflow-y-auto">/s;

const newTabs = `{/* Grid Tabs */}
          <div className="flex border-b-2 border-gray-100 bg-white px-2">
            <button onClick={()=>setActiveTab('reels')} className={\`flex-1 flex justify-center items-center py-3 border-b-4 gap-2 \${activeTab==='reels'?'border-[var(--primary-dark)] text-[var(--primary-dark)] font-bold':'border-transparent text-gray-500 font-semibold'}\`}>
               <span className="text-xs uppercase tracking-widest">RECENT POSTS (GRID)</span>
            </button>
            <button onClick={()=>setActiveTab('posts')} className={\`flex-1 flex justify-center items-center py-3 border-b-4 gap-2 \${activeTab==='posts'?'border-[var(--primary-dark)] text-[var(--primary-dark)] font-bold':'border-transparent text-gray-500 font-semibold'}\`}>
               <span className="text-xs uppercase tracking-widest">CONNECTIONS (LIST)</span>
            </button>
          </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white rounded-b-3xl">`;

content = content.replace(regexTabs, newTabs);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated profile dashboard layout');
