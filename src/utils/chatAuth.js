// Simple JWT-like token utilities for chat authentication
// In a production app, you'd use proper JWT libraries

export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // For development - in production, use proper JWT decoding
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    return null;
  }
  
  const decoded = decodeToken(token);
  return decoded ? {
    id: decoded.userId || decoded.id,
    email: decoded.email,
    name: decoded.name || `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
    isAdmin: decoded.isAdmin || false,
    isSeller: decoded.isSeller || false
  } : null;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

// Simple middleware function for protecting admin routes
export const requireAuth = (callback) => {
  return (...args) => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return callback(user, ...args);
  };
};

export const requireAdmin = (callback) => {
  return (...args) => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    if (!user.isAdmin) {
      throw new Error('Admin privileges required');
    }
    return callback(user, ...args);
  };
};

// API helper functions
export const apiCall = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Chat-specific API functions
export const sendChatMessage = async (message, chatMode = 'bot', supportTicketId = null) => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to send messages');
  }
  
  return apiCall('/api/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      message,
      chatMode,
      supportTicketId,
      userId: user.id
    })
  });
};

export const getChatHistory = async (ticketId) => {
  return apiCall(`/api/chat/history/${ticketId}`);
};

export const getUserSupportTickets = async () => {
  return apiCall('/api/chat/tickets');
};

// Admin-specific API functions
export const getAdminSupportTickets = requireAdmin(async (user, status = 'all', limit = 50) => {
  const params = new URLSearchParams({
    status,
    limit: limit.toString()
  });
  
  return apiCall(`/api/admin/support/tickets?${params}`);
});

export const sendAdminResponse = requireAdmin(async (user, ticketId, message) => {
  return apiCall('/api/admin/support/respond', {
    method: 'POST',
    body: JSON.stringify({
      ticketId,
      message
    })
  });
});

export const updateTicketStatus = requireAdmin(async (user, ticketId, status) => {
  return apiCall(`/api/admin/support/tickets/${ticketId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
});

// Utility functions for chat UI
export const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getChatStatus = (lastMessageTime) => {
  if (!lastMessageTime) return 'offline';
  
  const diffMs = Date.now() - new Date(lastMessageTime).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 5) {
    return 'online';
  } else if (diffMins < 30) {
    return 'away';
  } else {
    return 'offline';
  }
};

// Local storage helpers for chat preferences
export const getChatPreferences = () => {
  try {
    const prefs = localStorage.getItem('chatPreferences');
    return prefs ? JSON.parse(prefs) : {
      soundEnabled: true,
      notificationsEnabled: true,
      chatPosition: 'bottom-right'
    };
  } catch {
    return {
      soundEnabled: true,
      notificationsEnabled: true,
      chatPosition: 'bottom-right'
    };
  }
};

export const setChatPreferences = (preferences) => {
  try {
    localStorage.setItem('chatPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save chat preferences:', error);
  }
};

// Notification helpers
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showChatNotification = (title, message, onClick = null) => {
  const prefs = getChatPreferences();
  if (!prefs.notificationsEnabled) return;
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
    
    if (onClick) {
      notification.onclick = onClick;
    }
    
    setTimeout(() => notification.close(), 5000);
  }
};