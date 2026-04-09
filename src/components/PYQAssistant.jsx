import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client, Databases, Storage, ID, Query } from 'appwrite';

// Replace with your actual Gemini API key
const GEMINI_API_KEY = 'AIzaSyBQhoXkRPnh4OxwUbDln-IUEYYcvmlkxTU'; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Appwrite Connection
const appwriteClient = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1') // Default Appwrite Cloud endpoint
    .setProject('69d60fbe002bae1e32d5');     // Set Project ID as 'modebook' (if different, let me know)

const databases = new Databases(appwriteClient);
const storage = new Storage(appwriteClient);

// IMPORTANT: Replace these with your actual Appwrite IDs 
// Create a Database, a Collection (with dept, course, subject, fileName, fileType, fileId as String attributes), and a Storage Bucket!
const DATABASE_ID = '69d60fe8000c9bd92750';
const COLLECTION_ID = '69d6126a0031232a50d0';
const BUCKET_ID = 'alok_media';

const PYQAssistant = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('assistant'); 
  
  // Assistant States
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am ModeBook AI. How can I assist you with your studies or analyze your documents today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  
  // Appwrite Library States
  const [libraryItems, setLibraryItems] = useState([]);
  const [libDept, setLibDept] = useState('');
  const [libCourse, setLibCourse] = useState('');
  const [libSubject, setLibSubject] = useState('');
  const [libFile, setLibFile] = useState(null);
  const [libLoading, setLibLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLibraryItems = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.orderDesc('$createdAt')]);
      setLibraryItems(response.documents);
    } catch (error) {
      console.log("Appwrite DB not configured properly yet or Empty:", error.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'assistant') {
      scrollToBottom();
    } else if (activeTab === 'library') {
      fetchLibraryItems(); // Fetch live from Appwrite on tab change
    }
  }, [messages, activeTab]);

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const systemPromptIdentity = "You are 'ModeBook AI', a highly professional educational AI assistant exclusively created by Preetam. Never mention that you are an AI made by Google, Gemini, or any other company outside of Preetam. Always present yourself as the 'ModeBook AI'. Speak clearly and professionally in a mix of Hindi/English (Hinglish). Provide structured, high-quality answers.";

  const handleAskPYQ = async () => {
    if (!department || !course || !subject) {
      alert("Please specify Department, Course, and Subject.");
      return;
    }
    
    const userQuery = `Can you provide some PYQs logic for ${department} department, ${course} course, ${subject} subject?`;
    const newMessages = [...messages, { role: 'user', text: userQuery }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemContext = `${systemPromptIdentity} Provide 2-3 conceptual previous year questions for ${subject}.`;

      const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemContext }] },
            { role: "model", parts: [{ text: "Understood. I am ModeBook AI." }] }
        ],
      });

      const result = await chat.sendMessage(userQuery);
      setMessages([...newMessages, { role: 'model', text: result.response.text() }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', text: 'Error connecting to DU PYQ Servers. Try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() && !attachment) return;

    const userText = inputVal.trim() || (attachment ? "Please analyze this uploaded document." : "");
    setInputVal('');
    
    let parts = [{ text: userText }];
    let userMsgText = userText;
    
    if (attachment) {
      userMsgText = `[Attached: ${attachment.name}] ` + userMsgText;
      try {
        const genPart = await fileToGenerativePart(attachment);
        parts.push(genPart);
      } catch (err) {
        console.error("Scan error", err);
      }
      setAttachment(null);
    }

    const newMessages = [...messages, { role: 'user', text: userMsgText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPromptIdentity }] },
            { role: "model", parts: [{ text: "I am ready. I am ModeBook AI." }] }
        ],
      });
      const result = await chat.sendMessage(parts);
      setMessages([...newMessages, { role: 'model', text: result.response.text() }]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages([...newMessages, { role: 'model', text: `SCAN FAILED: ${error.message}. (Tip: If it's a large PDF, try taking a clear screenshot instead.)` }]);
    } finally {
      setLoading(false);
    }
  };

  // APPWRITE UPLOAD LOGIC
  const handleLibraryUpload = async (e) => {
    e.preventDefault();
    if (!libDept || !libCourse || !libSubject || !libFile) {
      alert("Incomplete data provided.");
      return;
    }

    setLibLoading(true);
    try {
      // 1. Upload File to Appwrite Storage
      const fileUpload = await storage.createFile(BUCKET_ID, ID.unique(), libFile);

      // 2. Extract Document Metadata and save to Appwrite DB
      const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        dept: libDept,
        course: libCourse,
        subject: libSubject,
        fileName: libFile.name,
        fileType: libFile.type,
        fileId: fileUpload.$id // Link file 
      });

      setLibraryItems([newDoc, ...libraryItems]);
      setLibDept(''); setLibCourse(''); setLibSubject(''); setLibFile(null);
      alert("Document successfully uploaded to Appwrite Vault!");
    } catch (error) {
      console.error("Appwrite Upload Failed", error);
      alert("Failed to upload: Make sure your Appwrite Project, DB, Collection, and Bucket IDs are correct in PYQAssistant.jsx!");
    } finally {
      setLibLoading(false);
    }
  };

  // APPWRITE VIEW/DOWNLOAD LOGIC
  const handleViewDocument = (fileId) => {
    try {
      // getFileView opens in browser, getFileDownload downloads it
      const result = storage.getFileView(BUCKET_ID, fileId);
      window.open(result.href, '_blank');
    } catch (error) {
      alert("Error fetching document from vault.");
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300">
      
      {/* Professional Container */}
      <div className="relative w-[95%] max-w-5xl h-[90vh] flex flex-col bg-[#0b0f19] rounded-[24px] border border-gray-800 shadow-2xl overflow-hidden font-sans">
        
        {/* Subtle Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center px-6 py-5 bg-[#0f1423] border-b border-gray-800/80">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold font-inter text-gray-100 tracking-tight">
                ModeBook AI
              </h2>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase mt-0.5">Powered by Preetam</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all outline-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex px-4 pt-3 bg-[#0f1423] border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('assistant')} 
            className={`px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-t-lg flex items-center gap-2 ${activeTab === 'assistant' ? 'text-blue-400 bg-gray-800/40 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            AI Assistant
          </button>
          <button 
            onClick={() => setActiveTab('library')} 
            className={`px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-t-lg flex items-center gap-2 ${activeTab === 'library' ? 'text-blue-400 bg-gray-800/40 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Cloud Library
          </button>
        </div>

        {/* === TAB: ASSISTANT === */}
        {activeTab === 'assistant' && (
          <div className="flex flex-col flex-1 overflow-hidden relative z-10 bg-[#0b0f19]">
            {/* Context Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-[#0d121f] border-b border-gray-800 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Context:</span>
              <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
                <input type="text" placeholder="Depart (e.g. CS)" value={department} onChange={e => setDepartment(e.target.value)} className="w-[110px] bg-transparent border-0 px-3 py-1.5 text-sm text-gray-200 focus:outline-none placeholder-gray-600 border-r border-gray-700/50" />
                <input type="text" placeholder="Course (e.g. BTech)" value={course} onChange={e => setCourse(e.target.value)} className="w-[120px] bg-transparent border-0 px-3 py-1.5 text-sm text-gray-200 focus:outline-none placeholder-gray-600 border-r border-gray-700/50" />
                <input type="text" placeholder="Subject (e.g. OS)" value={subject} onChange={e => setSubject(e.target.value)} className="w-[120px] bg-transparent border-0 px-3 py-1.5 text-sm text-gray-200 focus:outline-none placeholder-gray-600" />
              </div>
              <button onClick={handleAskPYQ} disabled={loading} className="px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-lg font-medium text-sm transition-all cursor-pointer ml-auto flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Generate PYQs
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-md shadow-blue-900/20">
                       <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                  )}
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-[20px] text-[15px] shadow-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-[#151b2b] text-gray-200 rounded-bl-sm border border-gray-800/80 shadow-inner shadow-white/5'
                  }`}>
                    {msg.role === 'model' && <div className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">ModeBook AI</div>}
                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex w-full justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-md shadow-blue-900/20">
                     <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div className="px-5 py-4 bg-[#151b2b] border border-gray-800/80 rounded-[20px] rounded-bl-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleChat} className="p-4 md:p-5 bg-[#0b0f19] border-t border-gray-800 flex flex-col gap-3">
              {attachment && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-xl self-start backdrop-blur-sm">
                  <span className="text-sm font-medium text-blue-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    {attachment.name}
                  </span>
                  <button type="button" onClick={() => setAttachment(null)} className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 hover:text-white hover:bg-red-500 transition-colors">&times;</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 relative">
                <div className="flex-1 relative flex items-center">
                  <label className="absolute left-3 w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-full cursor-pointer transition-all hover:text-white shadow-sm z-10 group">
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setAttachment(e.target.files[0])} />
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </label>

                  <input 
                    type="text" 
                    value={inputVal} 
                    onChange={e => setInputVal(e.target.value)}
                    placeholder="Ask ModeBook AI anything..." 
                    className="w-full bg-[#151b2b] border border-gray-700 focus:border-blue-500/50 rounded-2xl pl-14 pr-4 py-3.5 text-[15px] font-medium text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-500 shadow-inner font-sans"
                  />
                </div>
                
                <button type="submit" disabled={loading || (!inputVal.trim() && !attachment)} className="sm:w-[12%] h-[52px] bg-white text-gray-900 hover:bg-gray-100 rounded-2xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === TAB: LIBRARY (APPWRITE CONNECTED) === */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 p-6 relative overflow-hidden z-10 bg-[#0b0f19]">

            {/* Upload Area */}
            <div className="mb-6 p-5 bg-[#151b2b] rounded-[20px] border border-gray-800 shadow-sm relative overflow-hidden">
               {libLoading && (
                  <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                    <p className="text-blue-400 font-semibold mt-3 text-sm tracking-widest uppercase">Uploading to Cloud...</p>
                  </div>
               )}
              <h3 className="text-gray-100 text-[15px] font-bold mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                Secure Cloud Upload
              </h3>
              <form onSubmit={handleLibraryUpload} className="flex flex-wrap gap-3">
                <input required type="text" placeholder="Dept" value={libDept} onChange={e=>setLibDept(e.target.value)} className="flex-1 min-w-[80px] bg-[#0b0f19] border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200 focus:border-blue-500/50 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-600" />
                <input required type="text" placeholder="Course" value={libCourse} onChange={e=>setLibCourse(e.target.value)} className="flex-1 min-w-[80px] bg-[#0b0f19] border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200 focus:border-blue-500/50 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-600" />
                <input required type="text" placeholder="Subject" value={libSubject} onChange={e=>setLibSubject(e.target.value)} className="flex-[2] min-w-[120px] bg-[#0b0f19] border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200 focus:border-blue-500/50 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-600" />
                
                <input required type="file" onChange={e=>setLibFile(e.target.files[0])} className="flex-[2] min-w-[180px] text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer file:transition-colors bg-[#0b0f19] border border-gray-700/80 p-1.5 rounded-xl outline-none" />
                
                <button type="submit" disabled={libLoading} className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer disabled:opacity-50">
                  Upload
                </button>
              </form>
            </div>

            {/* Library Listing */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-gray-100 text-[15px] font-bold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                Available Resources
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {libraryItems.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-[20px] text-gray-500 bg-[#0d121f]">
                    <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p className="font-medium">No documents securely stored yet.</p>
                    <p className="text-xs mt-1 text-gray-600">Connect to Appwrite DB to load files.</p>
                  </div>
                ) : (
                  libraryItems.map((item, idx) => (
                    <div key={idx} className="group flex justify-between items-center bg-[#151b2b] border border-gray-800 hover:border-blue-500/30 p-4 rounded-[16px] transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[15px] font-bold text-gray-100 flex items-center gap-2">
                          {item.subject} 
                          <span className="text-[10px] bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {item.dept} - {item.course}
                          </span>
                        </div>
                        <div className="text-[12px] font-medium text-gray-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          <span className="truncate max-w-[200px]">{item.fileName}</span>
                          <span className="text-gray-600 mx-1">•</span> 
                          {new Date(item.$createdAt || Date.now()).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                        </div>
                      </div>
                      <button className="px-5 py-2 bg-gray-800 border border-gray-700 hover:bg-white hover:border-white hover:text-gray-900 text-gray-300 rounded-xl text-xs font-bold transition-all shadow-sm" onClick={() => handleViewDocument(item.fileId)}>
                        View
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PYQAssistant;
