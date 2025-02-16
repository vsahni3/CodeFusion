import React, { useState, useEffect } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { extensionFetch } from "../utils/vscode";
import { RecordButton } from './RecordButton';

interface RecordingResponse {
  success?: boolean;
  recording?: boolean;
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

  const handleSendRecording = (e: React.FormEvent) => {
    e.preventDefault();
    extensionFetch("/uploadFile", { file: recordingUrl });
    setRecordingUrl('');
  };

  // When the component mounts, check if recording is active.
  useEffect(() => {
    (async () => {
      try {
        const response = await extensionFetch("/isRecording", {}) as RecordingResponse;
        if (response.recording) {
          setRecording(true);
        }
      } catch (error: any) {
        console.error("Error fetching recording status:", error);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col h-screen justify-start">
      {/* RecordButton now toggles start/stop via handleRecord and shows proper label */}
      <div style={{ transform: 'scale(0.18)' }}>
        <RecordButton onRecord={handleRecord} recording={recording} />
      </div>

      {/* If a recording is available, display it */}
      {recordingUrl && (
          <div className="mt-4">
            <video controls src={recordingUrl} style={{ width: '100%' }} />
          </div>
        )}

      <button onClick={handleSendRecording}>UPLOAD</button>
    </div>
  );
}
