// src/components/admin/StorageDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Users, ShoppingCart, Heart, Package, Activity, RefreshCw, Download, Upload, Trash2 } from 'lucide-react';
import { getStorageStats, getHealthCheck, performCleanup, createBackup, restoreFromBackup } from '../../utils/database';
import { getLocalStorageInfo, cleanupOldData, backupLocalStorage, restoreLocalStorageBackup } from '../../utils/localStorage';

/**
 * Comprehensive Storage Dashboard - Monitors and manages all app storage
 * Demonstrates the complete database and localStorage integration
 */
const StorageDashboard = ({ isDarkMode }) => {
  const [stats, setStats] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [localStorageInfo, setLocalStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch database and health stats
      const [storageStats, health, localInfo] = await Promise.all([
        getStorageStats().catch(err => ({ error: err.message })),
        getHealthCheck().catch(err => ({ error: err.message, status: 'error' })),
        Promise.resolve(getLocalStorageInfo())
      ]);

      setStats(storageStats);
      setHealthStatus(health);
      setLocalStorageInfo(localInfo);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (actionName, actionFn, ...args) => {
    try {
      setActionLoading(actionName);
      const result = await actionFn(...args);
      
      alert(`✅ ${actionName} completed successfully!${result.message ? `\n\n${result.message}` : ''}`);
      
      // Refresh data after action
      await fetchData();
    } catch (error) {
      alert(`❌ ${actionName} failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatAge = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const age = Date.now() - new Date(timestamp).getTime();
    const days = Math.floor(age / (24 * 60 * 60 * 1000));
    const hours = Math.floor((age % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Recent';
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-7xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className=\"flex items-center justify-center py-20\">
            <RefreshCw className=\"w-8 h-8 animate-spin mr-3\" />
            <span className=\"text-lg\">Loading storage dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const bgCard = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-7xl mx-auto ${textPrimary}`}>
        
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold mb-2 flex items-center\">
                <Database className=\"w-8 h-8 mr-3\" />
                Storage Dashboard
              </h1>
              <p className={textSecondary}>
                Comprehensive monitoring and management of all application storage
              </p>
            </div>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 
                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} 
                text-white transition-colors disabled:opacity-50`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className={`${bgCard} border rounded-2xl p-6 mb-6`}>
            <h2 className=\"text-xl font-semibold mb-4 flex items-center\">
              <Activity className=\"w-5 h-5 mr-2\" />
              System Health
            </h2>
            
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
              <div className={`p-4 rounded-xl ${
                healthStatus.status === 'healthy' 
                  ? isDarkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
                  : isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`text-sm font-medium ${
                  healthStatus.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  Overall Status
                </div>
                <div className=\"text-lg font-bold capitalize\">{healthStatus.status}</div>
              </div>

              {healthStatus.checks?.database && (
                <div className={`p-4 rounded-xl ${
                  healthStatus.checks.database.status === 'connected'
                    ? isDarkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
                    : isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    healthStatus.checks.database.status === 'connected' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Database
                  </div>
                  <div className=\"text-lg font-bold capitalize\">{healthStatus.checks.database.status}</div>
                </div>
              )}

              {healthStatus.checks?.memory && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className=\"text-sm font-medium text-blue-400\">Memory Usage</div>
                  <div className=\"text-lg font-bold\">{healthStatus.checks.memory.heapUsed}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Statistics */}
        {stats?.database && (
          <div className={`${bgCard} border rounded-2xl p-6 mb-6`}>
            <h2 className=\"text-xl font-semibold mb-4 flex items-center\">
              <Database className=\"w-5 h-5 mr-2\" />
              Database Statistics
            </h2>
            
            <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4\">
              <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Users className=\"w-6 h-6 mx-auto mb-2 text-blue-500\" />
                <div className=\"text-2xl font-bold\">{stats.database.users}</div>
                <div className={`text-sm ${textSecondary}`}>Users</div>
              </div>
              
              <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Package className=\"w-6 h-6 mx-auto mb-2 text-green-500\" />
                <div className=\"text-2xl font-bold\">{stats.database.products}</div>
                <div className={`text-sm ${textSecondary}`}>Products</div>
              </div>
              
              <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <ShoppingCart className=\"w-6 h-6 mx-auto mb-2 text-orange-500\" />
                <div className=\"text-2xl font-bold\">{stats.database.cartItems}</div>
                <div className={`text-sm ${textSecondary}`}>Cart Items</div>
              </div>
              
              <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Heart className=\"w-6 h-6 mx-auto mb-2 text-red-500\" />
                <div className=\"text-2xl font-bold\">{stats.database.wishlistItems}</div>
                <div className={`text-sm ${textSecondary}`}>Wishlist Items</div>
              </div>
              
              <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Package className=\"w-6 h-6 mx-auto mb-2 text-purple-500\" />
                <div className=\"text-2xl font-bold\">{stats.database.orders}</div>
                <div className={`text-sm ${textSecondary}`}>Orders</div>
              </div>
            </div>

            {/* File Storage */}
            {stats?.files && (
              <div className=\"mt-6 pt-6 border-t border-gray-200 dark:border-gray-700\">
                <h3 className=\"text-lg font-semibold mb-3 flex items-center\">
                  <HardDrive className=\"w-4 h-4 mr-2\" />
                  File Storage
                </h3>
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${textSecondary}`}>Database Size</div>
                    <div className=\"text-lg font-bold\">{formatBytes(stats.files.databaseSize)}</div>
                  </div>
                  
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${textSecondary}`}>Upload Files</div>
                    <div className=\"text-lg font-bold\">{stats.files.uploadCount}</div>
                  </div>
                  
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${textSecondary}`}>Total Upload Size</div>
                    <div className=\"text-lg font-bold\">{formatBytes(stats.files.totalUploadSize)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* localStorage Information */}
        {localStorageInfo && (
          <div className={`${bgCard} border rounded-2xl p-6 mb-6`}>
            <h2 className=\"text-xl font-semibold mb-4 flex items-center\">
              <HardDrive className=\"w-5 h-5 mr-2\" />
              localStorage Information
            </h2>
            
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 mb-4\">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-sm ${textSecondary}`}>Total Items</div>
                <div className=\"text-lg font-bold\">{localStorageInfo.itemCount}</div>
              </div>
              
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-sm ${textSecondary}`}>Total Size</div>
                <div className=\"text-lg font-bold\">{formatBytes(localStorageInfo.totalSize)}</div>
              </div>
              
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-sm ${textSecondary}`}>Storage Usage</div>
                <div className=\"text-lg font-bold\">{((localStorageInfo.totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* localStorage Items */}
            <div className=\"space-y-2\">
              <h3 className=\"font-semibold mb-2\">Storage Items</h3>
              {Object.entries(localStorageInfo.items).map(([key, info]) => (
                <div key={key} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}>
                  <div>
                    <div className=\"font-medium\">{key}</div>
                    <div className={`text-sm ${textSecondary}`}>
                      {formatBytes(info.size)} • Age: {formatAge(info.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Management Actions */}
        <div className={`${bgCard} border rounded-2xl p-6`}>
          <h2 className=\"text-xl font-semibold mb-4\">Storage Management</h2>
          
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
            
            {/* Database Backup */}
            <button
              onClick={() => handleAction('Database Backup', createBackup, 'current_user')}
              disabled={actionLoading === 'Database Backup'}
              className={`p-4 rounded-xl border-2 border-dashed 
                ${isDarkMode ? 'border-green-800 hover:border-green-700 hover:bg-green-900/20' : 'border-green-300 hover:border-green-400 hover:bg-green-50'} 
                transition-colors disabled:opacity-50 flex flex-col items-center`}
            >
              <Download className=\"w-6 h-6 mb-2 text-green-500\" />
              <span className=\"font-medium\">Create Backup</span>
              <span className={`text-sm ${textSecondary}`}>Database backup</span>
            </button>

            {/* Database Restore */}
            <button
              onClick={() => handleAction('Database Restore', restoreFromBackup, 'current_user')}
              disabled={actionLoading === 'Database Restore'}
              className={`p-4 rounded-xl border-2 border-dashed 
                ${isDarkMode ? 'border-blue-800 hover:border-blue-700 hover:bg-blue-900/20' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'} 
                transition-colors disabled:opacity-50 flex flex-col items-center`}
            >
              <Upload className=\"w-6 h-6 mb-2 text-blue-500\" />
              <span className=\"font-medium\">Restore Data</span>
              <span className={`text-sm ${textSecondary}`}>From backup</span>
            </button>

            {/* localStorage Cleanup */}
            <button
              onClick={() => handleAction('localStorage Cleanup', () => Promise.resolve({ message: `Cleaned ${cleanupOldData()} old items` }))}
              disabled={actionLoading === 'localStorage Cleanup'}
              className={`p-4 rounded-xl border-2 border-dashed 
                ${isDarkMode ? 'border-yellow-800 hover:border-yellow-700 hover:bg-yellow-900/20' : 'border-yellow-300 hover:border-yellow-400 hover:bg-yellow-50'} 
                transition-colors disabled:opacity-50 flex flex-col items-center`}
            >
              <Trash2 className=\"w-6 h-6 mb-2 text-yellow-500\" />
              <span className=\"font-medium\">Clean Storage</span>
              <span className={`text-sm ${textSecondary}`}>Remove old data</span>
            </button>

            {/* Database Cleanup */}
            <button
              onClick={() => handleAction('Database Cleanup', performCleanup, 30)}
              disabled={actionLoading === 'Database Cleanup'}
              className={`p-4 rounded-xl border-2 border-dashed 
                ${isDarkMode ? 'border-red-800 hover:border-red-700 hover:bg-red-900/20' : 'border-red-300 hover:border-red-400 hover:bg-red-50'} 
                transition-colors disabled:opacity-50 flex flex-col items-center`}
            >
              <Trash2 className=\"w-6 h-6 mb-2 text-red-500\" />
              <span className=\"font-medium\">Database Cleanup</span>
              <span className={`text-sm ${textSecondary}`}>Remove old records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageDashboard;