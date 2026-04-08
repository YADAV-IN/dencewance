import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client, Databases, Storage, ID, Query } from 'appwrite';

// Replace with your actual Gemini API key
const GEMINI_API_KEY = 'AIzaSyBQhoXkRPnh4OxwUbDln-IUEYYcvmlkxTU'; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Appwrite Connection
const appwriteClient = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Default Appwrite Cloud endpoint
    .setProject('modebook');     // Set Project ID as 'modebook' (if different, let me know)

const databases = new Databases(appwriteClient);
const storage = new Storage(appwriteClient);

// IMPORTANT: Replace these with your actual Appwrite IDs 
// Create a Database, a Collection (with dept, course, subject, fileName, fileType, fileId as String attributes), and a Storage Bucket!
const DATABASE_ID = '69d60fe8000c9bd92750';
const COLLECTION_ID = 'YOUR_APPWRITE_COLLECTION_ID';
const BUCKET_ID = 'YOUR_APPWRITE_BUCKET_ID';

const PYQAssistant = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('assistant'); 
  
  // Assistant States
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Geetings! I am DU PYQ AI, developed by Preetam. Send me a question or scan a previous year\'s paper document.' }
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

  const systemPromptIdentity = "You are 'DU PYQ AI', a highly professional educational assistant exclusively created by Preetam. Never mention that you are an AI made by Google, Gemini, or any other company outside of Preetam. Always present yourself as the 'DU PYQ AI'. Speak clearly and professionally in a mix of Hindi/English (Hinglish). Answer exam questions directly without citing Google.";

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
            { role: "model", parts: [{ text: "Understood. I am DU PYQ AI by Preetam." }] }
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
            { role: "model", parts: [{ text: "I am ready. I am DU PYQ AI created by Preetam." }] }
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      
      {/* Professional Container */}
      <div className="relative w-[95%] max-w-4xl h-[85vh] flex flex-col bg-[#0f172a] rounded-xl border border-slate-700 shadow-2xl overflow-hidden font-sans">
        
        {/* Subtle Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>

        {/* Global Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none z-0">
          <h1 className="text-8xl md:text-9xl font-black tracking-[0.2em] text-white rotate-[-45deg] whitespace-nowrap">MODEBOOK</h1>
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">DU</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide leading-tight">
                DU PYQ AI
              </h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Developed by Preetam</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl outline-none focus:outline-none">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('assistant')} 
            className={`flex-1 py-3 text-sm font-semibold tracking-wider transition-all duration-300 ${activeTab === 'assistant' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="mr-2">💬</span> AI Workspace
          </button>
          <button 
            onClick={() => setActiveTab('library')} 
            className={`flex-1 py-3 text-sm font-semibold tracking-wider transition-all duration-300 ${activeTab === 'library' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="mr-2">☁️</span> Appwrite Vault
          </button>
        </div>

        {/* === TAB: ASSISTANT === */}
        {activeTab === 'assistant' && (
          <div className="flex flex-col flex-1 overflow-hidden relative z-10">
            {/* Context Filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-slate-800/40 border-b border-slate-700/50 shadow-sm">
              <input type="text" placeholder="Depart (e.g. CS)" value={department} onChange={e => setDepartment(e.target.value)} className="flex-1 min-w-[100px] bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500" />
              <input type="text" placeholder="Course (e.g. BTech)" value={course} onChange={e => setCourse(e.target.value)} className="flex-1 min-w-[100px] bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500" />
              <input type="text" placeholder="Subject (e.g. OS)" value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 min-w-[100px] bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500" />
              <button onClick={handleAskPYQ} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer">
                Load PYQs
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] z-[-1] text-center">
                <div className="text-[120px] font-black tracking-[0.1em] text-white">MODEBOOK</div>
              </div>

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] shadow-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                  }`}>
                    {msg.role === 'model' && <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">DU PYQ AI</div>}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="self-start px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm text-slate-400 ml-2">Processing Data...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleChat} className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
              {attachment && (
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg self-start">
                  <span className="text-xs text-blue-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    {attachment.name}
                  </span>
                  <button type="button" onClick={() => setAttachment(null)} className="text-slate-400 hover:text-white transition-colors">&times;</button>
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-all hover:text-white shadow-sm">
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setAttachment(e.target.files[0])} />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                </label>

                <input 
                  type="text" 
                  value={inputVal} 
                  onChange={e => setInputVal(e.target.value)}
                  placeholder="Ask a question or upload a document to scan..." 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 shadow-inner"
                />
                
                <button type="submit" disabled={loading} className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center">
                  Send
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === TAB: LIBRARY (APPWRITE CONNECTED) === */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 p-6 relative overflow-hidden z-10">

            {/* Upload Area */}
            <div className="mb-6 p-5 bg-slate-800/40 rounded-xl border border-slate-700/60 shadow-sm relative overflow-hidden">
               {libLoading && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-400 font-semibold mt-3 text-sm tracking-widest uppercase">Uploading to Server...</p>
                  </div>
               )}
              <h3 className="text-slate-100 text-sm font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                Sync Document to Appwrite Vault
              </h3>
              <form onSubmit={handleLibraryUpload} className="flex flex-wrap gap-3">
                <input required type="text" placeholder="Dept" value={libDept} onChange={e=>setLibDept(e.target.value)} className="flex-1 min-w-[80px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400 outline-none transition-colors" />
                <input required type="text" placeholder="Course" value={libCourse} onChange={e=>setLibCourse(e.target.value)} className="flex-1 min-w-[80px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400 outline-none transition-colors" />
                <input required type="text" placeholder="Subject" value={libSubject} onChange={e=>setLibSubject(e.target.value)} className="flex-[2] min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400 outline-none transition-colors" />
                
                <input required type="file" onChange={e=>setLibFile(e.target.files[0])} className="flex-[2] min-w-[180px] text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-900/30 file:text-blue-400 hover:file:bg-blue-900/50 file:cursor-pointer file:transition-colors bg-slate-900 border border-slate-700 p-1 rounded-lg" />
                
                <button type="submit" disabled={libLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all border border-blue-500 cursor-pointer disabled:opacity-50">
                  Save to Vault
                </button>
              </form>
            </div>

            {/* Library Listing */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-slate-100 text-sm font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Cloud Documents
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {libraryItems.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl text-slate-500 bg-slate-800/20">
                    <p>No documents found or DB not connected.</p>
                    <p className="text-xs mt-2 text-slate-600">Please provide valid Appwrite PROJECT & IDs in code.</p>
                  </div>
                ) : (
                  libraryItems.map((item, idx) => (
                    <div key={idx} className="group relative flex justify-between items-center bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 p-3.5 rounded-xl transition-all duration-200">
                      <div className="flex flex-col gap-1">
                        <div className="text-[15px] font-semibold text-slate-100">
                          {item.subject} 
                          <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                            {item.dept} / {item.course}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          {item.fileName} 
                          <span className="text-slate-600 mx-1">•</span> 
                          {new Date(item.$createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-slate-700 border border-slate-600 hover:bg-blue-600 hover:border-blue-500 text-white rounded-md text-xs font-medium transition-colors" onClick={() => handleViewDocument(item.fileId)}>
                        View Document
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
