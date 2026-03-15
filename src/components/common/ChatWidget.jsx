import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import ChatBot from './ChatBot';

const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const user = useSelector((state) => state.auth?.user);
  const location = useLocation();

  const toggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      setIsChatMinimized(false);
    } else {
      setIsChatOpen(true);
      setIsChatMinimized(false);
      setHasUnreadMessages(false);
    }
  };

  const handleMinimizeChat = () => {
    setIsChatMinimized(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  // Don't show chat widget on landing page or auth pages
  if (location.pathname === '/' || location.pathname.includes('/auth/')) {
    return null;
  }

  return (
    <>
      {/* Chat Widget Button */}
      {(!isChatOpen || isChatMinimized) && (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={toggleChat}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative"
            aria-label="Open chat support"
          >
            <MessageSquare size={24} />
            
            {/* Unread messages indicator */}
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
            
            {/* Pulse animation for new users */}
            {!localStorage.getItem('chatWidgetInteracted') && (
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
            )}
          </button>
          
          {/* Welcome tooltip for first-time users */}
          {!localStorage.getItem('chatWidgetInteracted') && (
            <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              <div className="relative">
                Need help? Chat with us!
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Bot Component */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        isMinimized={isChatMinimized}
      />
    </>
  );
};

export default ChatWidget;