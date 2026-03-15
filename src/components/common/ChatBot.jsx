import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  User, 
  Bot,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import '../../styles/chat.css';

const ChatBot = ({ isOpen, onClose, onMinimize, isMinimized }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState(null);
  const [chatMode, setChatMode] = useState('bot'); // 'bot' or 'human'
  const messagesEndRef = useRef(null);
  
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: `Hi ${user?.name || 'there'}! 👋 I'm your ThriftIt support assistant. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Track my order',
        'Return/Exchange',
        'Payment issues',
        'Seller questions',
        'Account help',
        'Talk to human support'
      ]
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage.text,
          chatMode,
          supportTicketId,
          userId: user?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: chatMode === 'bot' ? 'bot' : 'support',
          timestamp: new Date().toISOString(),
          suggestions: data.suggestions || [],
          source: data.source || 'local' // Track if response came from Python guard
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (data.supportTicketId && !supportTicketId) {
          setSupportTicketId(data.supportTicketId);
        }
        
        if (data.switchToHuman) {
          setChatMode('human');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const requestHumanSupport = async () => {
    setChatMode('human');
    const humanMessage = {
      id: Date.now(),
      text: 'Connecting you to human support...',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isSystemMessage: true
    };
    setMessages(prev => [...prev, humanMessage]);
  };

  if (!isOpen) return null;

  return (
    <div className={`chat-container fixed bottom-20 right-4 w-96 md:w-[28rem] lg:w-[32rem] h-[32rem] lg:h-[36rem] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 ${isMinimized ? 'h-12' : 'h-[32rem] lg:h-[36rem]'} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} />
          <h3 className="font-semibold">
            {chatMode === 'human' ? 'Human Support' : 'ThriftIt Support'}
          </h3>
          {supportTicketId && (
            <span className="text-xs bg-blue-600 px-2 py-1 rounded">
              #{supportTicketId.toString().slice(-6)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="hover:bg-blue-600 p-1 rounded"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-600 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {chatMode === 'human' && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Connected to support agent</span>
          </div>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isSystemMessage
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center italic'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  } ${message.isError ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender !== 'user' && !message.isSystemMessage && (
                      <div className="mt-1 flex items-center space-x-1">
                        {message.sender === 'bot' ? (
                          <Bot size={16} className="text-blue-500" />
                        ) : (
                          <User size={16} className="text-green-500" />
                        )}
                        {message.source === 'python_guard' && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-1 py-0.5 rounded">
                            🐍 Guard
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot size={16} className="text-blue-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {chatMode === 'bot' && (
              <button
                onClick={requestHumanSupport}
                className="w-full mb-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center space-x-1 py-1"
              >
                <User size={12} />
                <span>Need human support?</span>
              </button>
            )}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg px-3 py-2 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;