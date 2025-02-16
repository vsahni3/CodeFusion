import React, { useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';

export function App() {
    const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
        { text: "👋 Hello! I'm your CodeFusion assistant. How can I help you today?", isUser: false },
        { text: "Hi! I need help with React", isUser: true },
        { text: "I'd be happy to help you with React! What specific aspect would you like to learn about?", isUser: false },
    ]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);

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

    const handleRecord = () => {
        setIsRecording(!isRecording);
        // TODO: Implement recording logic
    };

    return (
        <div className="min-h-screen text-white flex flex-col h-screen">
            <h1 className="text-2xl font-bold mb-4">CodeFusion</h1>
            
            <button 
                onClick={handleRecord}
                className={`mb-4 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isRecording 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {isRecording ? 'Stop' : 'Record'}
            </button>

            <div className="bg-gray-800 flex-1 flex flex-col p-4">
                <ScrollToBottom className="flex-1 overflow-auto mb-4">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-t-lg max-w-[80%] ${
                                    message.isUser
                                        ? 'bg-blue-600 rounded-bl-lg ml-auto mr-2'
                                        : 'bg-gray-700 rounded-br-lg ml-2'
                                }`}
                            >
                                {message.text}
                            </div>
                        ))}
                    </div>
                </ScrollToBottom>

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