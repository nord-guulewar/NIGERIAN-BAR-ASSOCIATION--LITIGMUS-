/**
 * Offline Mode Service
 * Handles offline detection, local data storage, and syncing when online
 */

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.offlineData = {};
    this.lastSyncTime = null;
    this.initializeOfflineListeners();
    this.loadOfflineData();
  }

  // Initialize online/offline listeners
  initializeOfflineListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // Handle when device comes online
  async handleOnline() {
    console.log('📡 Device is now ONLINE');
    this.isOnline = true;
    
    // Show notification
    this.showNotification('✅ You are back online!', 'success');
    
    // Start syncing queued operations
    await this.syncOfflineQueue();
  }

  // Handle when device goes offline
  handleOffline() {
    console.log('📡 Device is now OFFLINE - Local mode enabled');
    this.isOnline = false;
    
    // Show notification
    this.showNotification('⚠️ You are offline - Changes will be synced when online', 'warning');
  }

  // Add operation to sync queue
  queueOperation(operation) {
    const queueItem = {
      id: `op-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...operation
    };

    this.syncQueue.push(queueItem);
    this.saveQueueToStorage();
    
    console.log(`📋 Operation queued:`, queueItem);
    return queueItem;
  }

  // Save queue to localStorage
  saveQueueToStorage() {
    try {
      localStorage.setItem('offlineSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load queue from localStorage
  loadOfflineData() {
    try {
      const queue = localStorage.getItem('offlineSyncQueue');
      this.syncQueue = queue ? JSON.parse(queue) : [];
      
      const data = localStorage.getItem('offlineData');
      this.offlineData = data ? JSON.parse(data) : {};
      
      console.log(`📂 Loaded ${this.syncQueue.length} queued operations`);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  // Save data for offline access
  saveOfflineData(key, data) {
    try {
      this.offlineData[key] = {
        data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('offlineData', JSON.stringify(this.offlineData));
      console.log(`💾 Saved offline data: ${key}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  // Get offline data
  getOfflineData(key) {
    return this.offlineData[key]?.data || null;
  }

  // Sync offline queue with server
  async syncOfflineQueue(api) {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`🔄 Syncing ${this.syncQueue.length} operations...`);
    const failedOperations = [];

    for (const operation of this.syncQueue) {
      try {
        await this.processQueuedOperation(operation, api);
        console.log(`✅ Synced: ${operation.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${operation.id}:`, error);
        failedOperations.push(operation);
      }
    }

    // Remove successful operations from queue
    this.syncQueue = failedOperations;
    this.saveQueueToStorage();

    if (failedOperations.length === 0) {
      this.showNotification('✅ All changes synced successfully!', 'success');
      this.lastSyncTime = new Date().toISOString();
    } else {
      this.showNotification(`⚠️ ${failedOperations.length} operations need retry`, 'warning');
    }
  }

  // Process a single queued operation
  async processQueuedOperation(operation, api) {
    const { method, endpoint, data } = operation;

    if (!api) {
      throw new Error('API service not provided');
    }

    switch (method) {
      case 'POST':
        return await api.post(endpoint, data);
      case 'PUT':
        return await api.put(endpoint, data);
      case 'DELETE':
        return await api.delete(endpoint);
      case 'GET':
        return await api.get(endpoint);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Show notification to user
  showNotification(message, type = 'info') {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = `offline-notification notification-${type}`;
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${type === 'warning' ? '#000' : '#fff'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
      ">
        ${message}
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Get status for UI
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      offlineDataKeys: Object.keys(this.offlineData)
    };
  }

  // Clear all offline data
  clearOfflineData() {
    this.syncQueue = [];
    this.offlineData = {};
    localStorage.removeItem('offlineSyncQueue');
    localStorage.removeItem('offlineData');
    console.log('🗑️ Cleared all offline data');
  }
}

// Export singleton instance
const offlineService = new OfflineService();
export default offlineService;
