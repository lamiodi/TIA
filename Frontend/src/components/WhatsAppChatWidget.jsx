import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Check } from 'lucide-react';

const WhatsAppChatWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [widgetClosed, setWidgetClosed] = useState(false);
  const messagesEndRef = useRef(null);
  
  const phoneNumber = '2348104117122';
  const defaultMessage = "Hi! I'm interested in your products.";

  useEffect(() => {
    // Check if widget was previously closed
    const widgetClosedTime = localStorage.getItem('whatsappWidgetClosed');
    if (widgetClosedTime) {
      const closedTime = parseInt(widgetClosedTime);
      const currentTime = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (currentTime - closedTime < twentyFourHours) {
        setWidgetClosed(true);
      }
    }
    
    // Show widget after delay if not closed
    const timer = setTimeout(() => {
      if (!widgetClosed) {
        setIsVisible(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [widgetClosed]);

  useEffect(() => {
    // Scroll to bottom of messages when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Simulate typing indicator when widget is expanded
    if (isExpanded && messages.length === 0) {
      setIsTyping(true);
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        // Add initial message
        setMessages([
          {
            id: 1,
            text: "Hi! 👋 Welcome to our store. How can we help you today?",
            time: "Just now",
            sender: 'support'
          }
        ]);
      }, 2000);
      
      return () => clearTimeout(typingTimer);
    }
  }, [isExpanded, messages.length]);

  const handleChat = () => {
    const messageToSend = customMessage || defaultMessage;
    const encodedMessage = encodeURIComponent(messageToSend);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Add user message to chat
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: messageToSend,
        time: "Just now",
        sender: 'user'
      }
    ]);
    
    setIsSending(true);
    
    // Simulate sending delay
    setTimeout(() => {
      setIsSending(false);
      window.open(url, '_blank');
      setIsExpanded(false);
    }, 1000);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCustomMessage('');
    }
  };

  const handleCloseWidget = () => {
    setIsVisible(false);
    // Save timestamp to localStorage
    localStorage.setItem('whatsappWidgetClosed', new Date().getTime().toString());
    setWidgetClosed(true);
  };

  const handleQuickReply = (replyText) => {
    setCustomMessage(replyText);
    // Focus on textarea after setting message
    setTimeout(() => {
      document.getElementById('whatsapp-message-input')?.focus();
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <>
      {isExpanded && (
        <div className="fixed bottom-16 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 ease-out animate-slide-up md:bottom-20 md:right-5">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 md:p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm md:text-base">Chat with us</h3>
                  <p className="text-green-100 text-xs md:text-sm">We're online now</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleExpanded}
                  className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={handleCloseWidget}
                  className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                  title="Close for 24 hours"
                >
                  <span className="text-xs">24h</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3 md:p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {/* Messages */}
            <div className="space-y-3">
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-md p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.sender === 'support' && (
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl p-3 ${msg.sender === 'user' 
                      ? 'bg-green-500 text-white rounded-tr-md' 
                      : 'bg-gray-100 rounded-tl-md'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{msg.time}</p>
                  </div>
                  
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick options */}
            {messages.length > 0 && !isSending && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Quick options:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickReply("Hi, I need information about your products")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
                  >
                    📦 Product Info
                  </button>
                  <button
                    onClick={() => handleQuickReply("What are your shipping options and rates?")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
                  >
                    🚚 Shipping
                  </button>
                  <button
                    onClick={() => handleQuickReply("I have a general question")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
                  >
                    💬 General Chat
                  </button>
                </div>
              </div>
            )}
            
            {/* Message input */}
            {messages.length > 0 && (
              <div className="space-y-2">
                <textarea
                  id="whatsapp-message-input"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleChat}
                  disabled={isSending || !customMessage.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 md:py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 active:scale-95 transform transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs md:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 md:w-4 md:h-4" />
                      Send on WhatsApp
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-50">
        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
        <button
          onClick={isExpanded ? handleChat : toggleExpanded}
          className="relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 hover:shadow-3xl cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
          <div className="relative">
            <svg
              className={`w-6 h-6 md:w-8 md:h-8 transition-transform duration-300 ${isExpanded ? 'rotate-12' : 'group-hover:rotate-12'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </button>
        
        {isExpanded && (
          <div className="absolute right-14 md:right-20 top-1/2 transform -translate-y-1/2 transition-all duration-300 opacity-100 translate-x-0">
            <div className="bg-white text-gray-800 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg border border-gray-200 font-semibold text-xs md:text-sm whitespace-nowrap flex items-center gap-2">
              <span>Send us a message</span>
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-l-white"></div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes pulse-green {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        .animate-pulse {
          animation: pulse-green 2s infinite;
        }
      `}</style>
    </>
  );
};

export default WhatsAppChatWidget;