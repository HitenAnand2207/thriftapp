// src/utils/localStorage.js

// Safe check for browser/localStorage exists
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

// Enhanced localStorage operations with error recovery

export const saveToLocalStorage = (key, value) => {
  if (!isBrowser) return false;
  try {
    const data = JSON.stringify(value);
    window.localStorage.setItem(key, data);
    
    // Also save a timestamp for data freshness tracking
    window.localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
    return true;
  } catch (error) {
    console.error("❌ Error saving to localStorage:", error);
    
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn("⚠️ localStorage quota exceeded, attempting cleanup...");
      cleanupOldData();
      
      // Retry once after cleanup
      try {
        const data = JSON.stringify(value);
        window.localStorage.setItem(key, data);
        window.localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
        return true;
      } catch (retryError) {
        console.error("❌ Failed to save after cleanup:", retryError);
      }
    }
    return false;
  }
};

export const getFromLocalStorage = (key, defaultValue = null) => {
  if (!isBrowser) return defaultValue;
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null || storedValue === undefined) return defaultValue;
    
    const parsed = JSON.parse(storedValue);
    
    // Check data freshness (warn if older than 7 days)
    const timestamp = window.localStorage.getItem(`${key}_timestamp`);
    if (timestamp) {
      const age = Date.now() - new Date(timestamp).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (age > sevenDays) {
        console.warn(`⚠️ localStorage data for '${key}' is ${Math.round(age / (24 * 60 * 60 * 1000))} days old`);
      }
    }
    
    return parsed;
  } catch (error) {
    console.error("❌ Error reading from localStorage:", error);
    
    // Attempt to recover corrupted data
    try {
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(`${key}_timestamp`);
      console.log(`🔧 Cleared corrupted localStorage entry: ${key}`);
    } catch (cleanupError) {
      console.error("❌ Failed to cleanup corrupted data:", cleanupError);
    }
    
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  if (!isBrowser) return false;
  try {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}_timestamp`);
    return true;
  } catch (error) {
    console.error("❌ Error removing from localStorage:", error);
    return false;
  }
};

// Enhanced utility functions for better storage management

export const getLocalStorageSize = () => {
  if (!isBrowser) return 0;
  
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

export const getLocalStorageInfo = () => {
  if (!isBrowser) return null;
  
  const info = {
    itemCount: localStorage.length,
    totalSize: getLocalStorageSize(),
    items: {}
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.endsWith('_timestamp')) {
      const value = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      
      info.items[key] = {
        size: (key.length + (value?.length || 0)),
        timestamp: timestamp,
        age: timestamp ? Date.now() - new Date(timestamp).getTime() : null
      };
    }
  }
  
  return info;
};

export const cleanupOldData = (maxAge = 30) => {
  if (!isBrowser) return 0;
  
  let cleanedCount = 0;
  const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const now = Date.now();
  
  // Get all keys first to avoid modifying during iteration
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  
  keys.forEach(key => {
    if (key.endsWith('_timestamp')) return;
    
    const timestamp = localStorage.getItem(`${key}_timestamp`);
    if (timestamp) {
      const age = now - new Date(timestamp).getTime();
      if (age > maxAgeMs) {
        try {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
          cleanedCount++;
          console.log(`🧹 Cleaned up old localStorage item: ${key} (${Math.round(age / (24 * 60 * 60 * 1000))} days old)`);
        } catch (error) {
          console.error(`❌ Failed to clean up ${key}:`, error);
        }
      }
    }
  });
  
  return cleanedCount;
};

export const backupLocalStorage = () => {
  if (!isBrowser) return null;
  
  const backup = {
    timestamp: new Date().toISOString(),
    data: {}
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      backup.data[key] = localStorage.getItem(key);
    }
  }
  
  // Save backup to localStorage itself
  try {
    localStorage.setItem('__localStorage_backup__', JSON.stringify(backup));
    console.log('✅ localStorage backup created');
    return backup;
  } catch (error) {
    console.error('❌ Failed to create localStorage backup:', error);
    return null;
  }
};

export const restoreLocalStorageBackup = () => {
  if (!isBrowser) return false;
  
  try {
    const backupData = localStorage.getItem('__localStorage_backup__');
    if (!backupData) {
      console.warn('⚠️ No localStorage backup found');
      return false;
    }
    
    const backup = JSON.parse(backupData);
    let restoredCount = 0;
    
    Object.entries(backup.data).forEach(([key, value]) => {
      if (key !== '__localStorage_backup__') {
        try {
          localStorage.setItem(key, value);
          restoredCount++;
        } catch (error) {
          console.error(`❌ Failed to restore ${key}:`, error);
        }
      }
    });
    
    console.log(`✅ Restored ${restoredCount} items from localStorage backup (created: ${backup.timestamp})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to restore localStorage backup:', error);
    return false;
  }
};

// Automatic cleanup on page load
if (isBrowser) {
  // Clean up data older than 30 days on initialization
  setTimeout(() => {
    const cleaned = cleanupOldData();
    if (cleaned > 0) {
      console.log(`🧹 Automatic cleanup removed ${cleaned} old localStorage items`);
    }
  }, 1000);
}
