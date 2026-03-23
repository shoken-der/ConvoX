import { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon, PlusIcon, XIcon, DocumentIcon, PhotographIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";
import { useDropzone } from 'react-dropzone';
import { uploadFile } from "../../services/ChatService";
import useSocket from "../../hooks/useSocket";
import { useToast } from "../../contexts/ToastContext";

export default function ChatForm({ handleFormSubmit, currentChat, currentUser, replyMessage, setReplyMessage }) {
  const { addToast } = useToast();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  
  const { emit } = useSocket();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [showEmojiPicker, replyMessage, selectedFile, uploadProgress]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "File too large",
        message: "Max upload size is 10MB.",
      });
      return;
    }
    setSelectedFile(file);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop, 
    noClick: true,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'video/*': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    },
    onDropRejected: () => {
      addToast({
        type: "error",
        title: "Unsupported file",
        message: "Please choose an image, PDF, video, or document file.",
      });
    },
  });

  const handleEmojiClick = (arg1, arg2) => {
    // Robustly extract the emoji string from potential v3 or v4 argument structures
    const emoji = (arg1 && typeof arg1 === 'object' ? arg1.emoji : null) || 
                  (arg2 && typeof arg2 === 'object' ? arg2.emoji : null) ||
                  (typeof arg1 === 'string' ? arg1 : null);

    if (emoji && typeof emoji === 'string') {
      setMessage(prev => (prev === undefined || prev === null ? "" : prev) + emoji);
    }
    handleTyping();
  };

  const handleTyping = () => {
    if (!currentChat) return;
    const receiverId = currentChat.members.find((m) => m !== currentUser.uid);
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      emit("typing", { senderId: currentUser.uid, receiverId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit("stopTyping", { senderId: currentUser.uid, receiverId });
      setIsTypingLocal(false);
    }, 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    let fileData = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadRes = await uploadFile(selectedFile, (progress) => setUploadProgress(progress));
        fileData = {
          fileUrl: uploadRes.url,
          fileType: uploadRes.fileType,
          fileSize: uploadRes.fileSize
        };
      } catch (err) {
        console.error("Upload failed", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to upload file";
        addToast({ type: "error", title: "Upload Failed", message: errorMessage });
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        return;
      }
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      const receiverId = currentChat.members.find((m) => m !== currentUser.uid);
      emit("stopTyping", { senderId: currentUser.uid, receiverId });
      setIsTypingLocal(false);
    }

    handleFormSubmit(message, fileData);
    setMessage("");
    setShowEmojiPicker(false);
  };

  return (
    <div
      {...getRootProps()}
      className={`p-2 md:p-3 relative ${isDragActive ? "bg-black/5" : ""} transition-colors`}
      ref={scrollRef}
    >
      <input {...getInputProps()} className="hidden" />
      
      {/* Reply Preview */}
      {replyMessage && (
        <div className="max-w-4xl mx-auto mb-1.5 flex items-center justify-between p-3 bg-white/85 dark:bg-neutral-900/45 backdrop-blur-xl rounded-2xl border border-slate-200/70 dark:border-neutral-800/70 animate-in slide-in-from-bottom-2 shadow-sm relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500/90" />
          <div className="min-w-0 pl-2">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-primary-500 opacity-80">Replying to</p>
            <p className="text-sm text-slate-700 dark:text-neutral-200 truncate font-medium leading-tight">{replyMessage.message}</p>
          </div>
          <button 
            onClick={() => setReplyMessage(null)} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            type="button"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="max-w-4xl mx-auto mb-2 p-3 bg-white/85 dark:bg-neutral-900/45 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/70 dark:border-neutral-800/70 animate-in zoom-in-95">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/15">
                {selectedFile.type.startsWith("image/")
                  ? <PhotographIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  : <DocumentIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              type="button"
              aria-label="Remove selected file"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          {isUploading && (
            <div className="mt-3">
              <div className="h-2 w-full bg-slate-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-slate-200/70 dark:border-neutral-800/70">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[9px] text-primary-600 dark:text-primary-400 font-bold mt-1 text-right tracking-tight">
                {uploadProgress}% Uploading...
              </p>
            </div>
          )}
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full mb-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200/80 dark:border-neutral-800/80 ring-1 ring-black/5 bg-white/95 dark:bg-neutral-950/80 backdrop-blur">
            <Picker onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme="auto" />
          </div>
        </div>
      )}
      
      {/* The Main Pill Input */}
      <form 
        onSubmit={handleSubmit} 
        className="flex items-end gap-2 w-full mx-auto"
      >
        <div className="flex items-center gap-0.5 pb-1">
          <button
            type="button"
            onClick={open}
            className="cursor-pointer p-2.5 text-slate-500 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-neutral-800 rounded-lg"
            aria-label="Upload file"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className={`p-2.5 transition-colors focus:outline-none rounded-lg ${showEmojiPicker ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-neutral-300 focus:bg-slate-100 dark:focus:bg-neutral-800'}`}
            aria-label="Toggle emoji picker"
          >
            <EmojiHappyIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 min-w-0 bg-[#ffffff] dark:bg-[#2a3942] rounded-lg flex items-end">
          <textarea
            rows="1"
            placeholder={isDragActive ? "Drop files here..." : "Type a message"}
            className="block w-full py-2.5 px-4 min-h-[44px] max-h-32 resize-none text-[15px] bg-transparent text-[#111b21] dark:text-[#d1d7db] placeholder-[#667781] dark:placeholder-[#8696a0] border-none focus:ring-0 focus:outline-none"
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
        </div>

        <button 
          type="submit" 
          disabled={(!message.trim() && !selectedFile) || isUploading} 
          className="
            flex-shrink-0 flex items-center justify-center h-11 w-11 mb-0.5
            bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500
            text-white rounded-full shadow-lg shadow-primary-500/20 transition-all active:scale-95 focus:outline-none
          "
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5 rotate-90 relative left-0.5" />
        </button>

      </form>
    </div>
  );
}
