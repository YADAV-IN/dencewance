const fs = require('fs');
let code = fs.readFileSync('src/components/CreateInstagramMenu.jsx', 'utf8');

const regexPost = /const handleCreatePost = async \(e\) => \{[\s\S]*?setIsUploading\(false\);\n  \};/;
const nextPost = `const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postCover) return alert("Please select an image");
    setIsUploading(true);
    try {
      let currentCoverUrl = '';
      const formData = new FormData();
      formData.append('cover', postCover);
      const uploadRes = await fetch(\`\${API_URL}/api/uploads/cover\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
        body: formData
      });
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        currentCoverUrl = uploadData.data?.url || uploadData.data;
      } else {
        const errData = await uploadRes.json().catch(()=>({}));
        alert('Image upload failed: ' + (errData.error || uploadRes.statusText));
        setIsUploading(false);
        return;
      }

      const payload = {
        title: postTitle || "Untitled",
        content: postContent || " ", 
        excerpt: postContent.substring(0, 50) || " ",
        status: 'published',
        creator_mode: 'official',
        cover_image_url: currentCoverUrl
      };

      const res = await fetch(\`\${API_URL}/api/news\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Post published successfully!');
        setPostCover(null); setPostCoverPreview(''); setPostTitle(''); setPostContent('');
        if (onComplete) onComplete();
      } else {
        const errData = await res.json().catch(()=>({}));
        alert('Failed to publish post: ' + (errData.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
      alert('Error creating post: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };`;

code = code.replace(regexPost, nextPost);

const regexReel = /const handleCreateReel = async \(e\) => \{[\s\S]*?setIsUploading\(false\);\n  \};/;
const nextReel = `const handleCreateReel = async (e) => {
    e.preventDefault();
    if (!reelVideoFile) return alert("Please select a video file!");
    
    // Check file size on client-side to prevent network hang. Max 4.5MB for Vercel Serverless payload if no R2.
    if (reelVideoFile.size > 4.4 * 1024 * 1024) {
      return alert("File is too large (max 4MB). Please select a smaller video or configure Cloudflare R2 on backend.");
    }
    
    setIsUploading(true);
    try {
      let videoUrl = '';
      const formData = new FormData();
      formData.append('media', reelVideoFile);
      
      const uploadRes = await fetch(\`\${API_URL}/api/uploads/media\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
        body: formData
      });
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        videoUrl = uploadData.data?.url || uploadData.data;
      } else {
        const errData = await uploadRes.json().catch(()=>({}));
        alert('Failed to upload video: ' + (errData.error || uploadRes.statusText));
        setIsUploading(false);
        return;
      }

      const payload = {
        title: reelTitle || "My Reel",
        caption: reelCaption,
        video_url: videoUrl,
        creator_mode: 'official'
      };

      const res = await fetch(\`\${API_URL}/api/reels\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Reel published successfully!');
        setReelVideoFile(null); setReelVideoPreview(''); setReelTitle(''); setReelCaption('');
        if (onComplete) onComplete();
      } else {
        const errData = await res.json().catch(()=>({}));
        alert('Failed to publish reel: ' + (errData.error || res.statusText));
      }
    } catch(err) {
      console.error(err);
      alert('Error creating reel: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };`;

code = code.replace(regexReel, nextReel);

fs.writeFileSync('src/components/CreateInstagramMenu.jsx', code);
