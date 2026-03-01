// src/utils/database.js
import { API_BASE_URL } from './api';

/**
 * Comprehensive database utility for ThriftApp
 * Provides easy interface to all database operations
 */

// ============= USER MANAGEMENT =============

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ User registration failed:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ User login failed:', error);
    throw error;
  }
};

// ============= CART MANAGEMENT =============

export const getCart = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Cart fetch failed:', error);
    throw error;
  }
};

export const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Add to cart failed:', error);
    throw error;
  }
};

export const removeFromCart = async (userId, productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/${productId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Remove from cart failed:', error);
    throw error;
  }
};

// ============= WISHLIST MANAGEMENT =============

export const getWishlist = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Wishlist fetch failed:', error);
    throw error;
  }
};

export const toggleWishlist = async (userId, productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Wishlist toggle failed:', error);
    throw error;
  }
};

// ============= ORDER MANAGEMENT =============

export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    throw error;
  }
};

export const getUserOrders = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Orders fetch failed:', error);
    throw error;
  }
};

// ============= DATA SYNCHRONIZATION =============

export const syncUserData = async (userId, localStorageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/user-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, localStorageData })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/user-data/${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ User data fetch failed:', error);
    throw error;
  }
};

// ============= BACKUP & RESTORE =============

export const createBackup = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/backup/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw error;
  }
};

export const restoreFromBackup = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Backup restore failed:', error);
    throw error;
  }
};

// ============= MONITORING & ANALYTICS =============

export const getStorageStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/storage-stats`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Storage stats fetch failed:', error);
    throw error;
  }
};

export const getHealthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/health-check`);
    const data = await response.json();
    // Note: Health check may return 500 for unhealthy status
    return { ...data, responseOk: response.ok };
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return {
      timestamp: new Date().toISOString(),
      status: "error",
      error: error.message,
      responseOk: false
    };
  }
};

export const performCleanup = async (olderThanDays = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ olderThanDays })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// ============= AUTOMATIC SYNC HELPERS =============

/**
 * Automatically sync localStorage data to database when user is online
 */
export const autoSyncToDatabase = async (userId) => {
  try {
    if (!userId || !navigator.onLine) return false;

    const localData = {
      cartItems: JSON.parse(localStorage.getItem('cartItems') || '[]'),
      wishlistItems: JSON.parse(localStorage.getItem('wishlistItems') || '[]')
    };

    await syncUserData(userId, localData);
    console.log('✅ Auto-sync to database successful');
    return true;
  } catch (error) {
    console.warn('⚠️ Auto-sync to database failed:', error.message);
    return false;
  }
};

/**
 * Restore data from database to localStorage
 */
export const restoreFromDatabase = async (userId) => {
  try {
    if (!userId) return false;

    const userData = await getUserData(userId);
    
    // Update localStorage with database data
    localStorage.setItem('cartItems', JSON.stringify(userData.cartItems || []));
    localStorage.setItem('wishlistItems', JSON.stringify(userData.wishlistItems || []));
    localStorage.setItem('user', JSON.stringify(userData.user));
    
    console.log('✅ Data restored from database to localStorage');
    return true;
  } catch (error) {
    console.warn('⚠️ Database restore failed:', error.message);
    return false;
  }
};

/**
 * Initialize periodic auto-sync
 */
export const initializeAutoSync = (userId) => {
  if (!userId) return null;

  const syncInterval = setInterval(() => {
    autoSyncToDatabase(userId);
  }, 60000); // Sync every minute

  // Sync on page visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      autoSyncToDatabase(userId);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Sync on online event
  const handleOnline = () => {
    autoSyncToDatabase(userId);
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    clearInterval(syncInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
  };
};

// Default export with all methods
export default {
  // User management
  registerUser,
  loginUser,
  
  // Cart management
  getCart,
  addToCart,
  removeFromCart,
  
  // Wishlist management
  getWishlist,
  toggleWishlist,
  
  // Order management
  createOrder,
  getUserOrders,
  
  // Data synchronization
  syncUserData,
  getUserData,
  
  // Backup & restore
  createBackup,
  restoreFromBackup,
  
  // Monitoring
  getStorageStats,
  getHealthCheck,
  performCleanup,
  
  // Auto-sync helpers
  autoSyncToDatabase,
  restoreFromDatabase,
  initializeAutoSync
};