import React, { useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { extensionFetch } from "../utils/vscode";
import { RecordButton } from './RecordButton';

interface RecordingResponse {
  success: boolean;
  message?: string;
  file?: string;
}

export function App() {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "👋 Hello! I'm your CodeFusion assistant. How can I help you today?", isUser: false },
    { text: "Hi! I need help with React", isUser: true },
    { text: "I'd be happy to help you with React! What specific aspect would you like to learn about?", isUser: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);

    // Simple bot response
    const botMessage = { text: `You said: ${inputText}`, isUser: false };
    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputText('');
  };

  // Toggle between starting and stopping the recording.
  const handleRecord = async () => {
    if (!recording) {
      // Start recording
      try {
        const response = await extensionFetch("/startRecording", {}) as RecordingResponse;
        if (response.success) {
          console.log("Screen recording started:", response);
          setMessages(prev => [
            ...prev,
            { text: "Screen recording started!", isUser: false },
          ]);
          setRecording(true);
          // Clear any previous recording URL
          setRecordingUrl('');
        }
      } catch (error: any) {
        console.error("Error starting screen recording:", error);
        setMessages(prev => [
          ...prev,
          { text: `Error: ${error.message}`, isUser: false },
        ]);
      }
    } else {
      // Stop recording
      try {
        const response = await extensionFetch("/stopRecording", {}) as RecordingResponse;
        if (response.success) {
          console.log("Screen recording stopped:", response);
          setMessages(prev => [
            ...prev,
            { text: "Screen recording stopped!", isUser: false },
          ]);
          setRecording(false);
          // Set the returned file path so the video can be displayed.
          setRecordingUrl(response.file || '');
        }
      } catch (error: any) {
        console.error("Error stopping screen recording:", error);
        setMessages(prev => [
          ...prev,
          { text: `Error: ${error.message}`, isUser: false },
        ]);
      }
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col h-screen justify-between">
      {/* RecordButton now toggles start/stop via handleRecord */}
      <div style={{ transform: 'scale(0.18)' }}>
        <RecordButton onRecord={handleRecord} />
      </div>

      <div className="bg-gray-800 flex-1 flex flex-col p-4">
        <ScrollToBottom className="flex-1 overflow-auto mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-t-lg max-w-[80%] ${message.isUser
                  ? 'bg-blue-600 rounded-bl-lg ml-auto mr-2'
                  : 'bg-gray-700 rounded-br-lg ml-2'
                  }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        </ScrollToBottom>

        {/* If a recording is available, display it */}
        {recordingUrl && (
          <div className="mt-4">
            <video controls src={recordingUrl} style={{ width: '100%' }} />
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your response..."
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
