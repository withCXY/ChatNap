'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !disabled) {
      onSend(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudioToText(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check browser permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Process audio to text
  const processAudioToText = async (audioBlob: Blob) => {
    try {
      // Check if browser supports Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Use browser's built-in speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US'; // Fixed to use English
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prev => prev + transcript);
          setIsProcessing(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsProcessing(false);
          alert('Speech recognition failed. Please try again.');
        };

        recognition.onend = () => {
          setIsProcessing(false);
        };

        // Note: We cannot directly use recorded audio because Web Speech API requires real-time audio streams
        // So we use an alternative solution
        fallbackSpeechRecognition();
              } else {
        // If Web Speech API is not supported, use other solutions
        fallbackSpeechRecognition();
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      alert('Audio processing failed. Please try again.');
    }
  };

  // Fallback speech recognition solution
  const fallbackSpeechRecognition = () => {
    // Third-party speech recognition services can be integrated here, such as Baidu, Tencent Cloud, etc.
    // Currently using simulated approach
    setTimeout(() => {
      setMessage(prev => prev + '[Speech-to-text service needs to be configured]');
      setIsProcessing(false);
    }, 1000);
  };

  // Voice button click handler
  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Use real-time speech recognition (recommended solution)
  const startRealtimeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US'; // Fixed to use English
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert('Speech recognition failed: ' + event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="space-y-2">
      {/* Image preview area */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Voice status indicators */}
      {isRecording && (
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Recording... Click microphone to stop
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Processing speech...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#7ED3FF]"
            disabled={disabled}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            {/* Image upload button */}
            <button
              type="button"
              onClick={handleImageButtonClick}
              className="p-2 text-white/70 hover:text-white transition-colors"
              disabled={disabled}
              title="Add image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            
                          {/* Voice button */}
            <button
              type="button"
              onClick={startRealtimeSpeechRecognition}
              className={`p-2 transition-colors ${
                isRecording 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-white/70 hover:text-white'
              }`}
              disabled={disabled || isProcessing}
              title={isRecording ? 'Recording...' : 'Voice input'}
            >
              <svg
                className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-[#7ED3FF] text-black font-medium hover:bg-[#6BC3FF] transition-colors disabled:opacity-50"
          disabled={disabled || (!message.trim() && !selectedImage)}
        >
          Send
        </button>
      </form>
    </div>
  );
} 