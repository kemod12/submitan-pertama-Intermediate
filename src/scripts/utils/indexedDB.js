class IndexedDBHelper {
  constructor(dbName = 'StoryMapDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async openDatabase() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for stories if it doesn't exist
        if (!db.objectStoreNames.contains('stories')) {
          const storiesStore = db.createObjectStore('stories', { keyPath: 'id' });
          storiesStore.createIndex('timestamp', 'createdAt', { unique: false });
        }
        
        // Create object store for sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async addStory(story) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      const request = store.add({
        ...story,
        id: story.id || `local-${Date.now()}`,
        isLocal: !story.id,
        createdAt: story.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Error adding story:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStories() {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Error getting stories:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStory(id) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Error getting story:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async updateStory(story) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      const updatedStory = {
        ...story,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(updatedStory);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Error updating story:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async deleteStory(id) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error deleting story:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async addToSyncQueue(operation) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const request = store.add({
        ...operation,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      request.onsuccess = () => {
        // Trigger sync if online
        if (navigator.onLine) {
          this.processSyncQueue();
        }
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error adding to sync queue:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async processSyncQueue() {
    if (!navigator.onLine) return;
    
    const db = await this.openDatabase();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('type');
    
    const request = index.openCursor(IDBKeyRange.only('sync-stories'));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value;
        
        // Process the sync item (you'll need to implement this based on your API)
        this.syncWithServer(item.data)
          .then(() => {
            // Remove from queue if sync is successful
            store.delete(cursor.primaryKey);
          })
          .catch(error => {
            console.error('Sync failed:', error);
            // Update status to failed
            const updateData = cursor.value;
            updateData.status = 'failed';
            updateData.retryCount = (updateData.retryCount || 0) + 1;
            updateData.lastError = error.message;
            cursor.update(updateData);
          });
        
        cursor.continue();
      }
    };
    
    request.onerror = (event) => {
      console.error('Error processing sync queue:', event.target.error);
    };
  }

  // This is a placeholder - implement according to your API
  async syncWithServer(data) {
    // Implement the actual sync logic with your server
    // This should match the API endpoints you're using
    return Promise.resolve();
  }

  // Listen for online/offline events
  setupSyncListeners() {
    window.addEventListener('online', () => {
      console.log('Device is online, processing sync queue...');
      this.processSyncQueue();
    });
  }
}

// Create a singleton instance
export const dbHelper = new IndexedDBHelper();

// Initialize and set up listeners when imported
dbHelper.openDatabase().then(() => {
  dbHelper.setupSyncListeners();
});
