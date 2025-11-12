import CONFIG from '../config';
import { dbHelper } from '../utils/indexedDB';

const BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryService {
  constructor() {
    // Initialize IndexedDB
    dbHelper.openDatabase().catch(error => {
      console.error('Failed to open IndexedDB:', error);
    });
  }
  async register(name, email, password) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const responseJson = await response.json();
    
    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  async login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const responseJson = await response.json();
    
    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  async getAllStories(token, forceRefresh = false) {
    // Try to get from network first if online
    if (navigator.onLine && !forceRefresh) {
      try {
        const response = await fetch(`${BASE_URL}/stories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseJson = await response.json();
        
        if (response.ok) {
          // Cache the stories in IndexedDB
          const stories = responseJson.listStory;
          await Promise.all(stories.map(story => dbHelper.addStory(story)));
          return stories;
        } else {
          console.warn('Failed to fetch stories from server:', responseJson.message);
          // Continue to return cached data if available
        }
      } catch (error) {
        console.warn('Network error, using cached data:', error.message);
      }
    }

    // Fall back to IndexedDB cache
    try {
      const cachedStories = await dbHelper.getStories();
      if (cachedStories && cachedStories.length > 0) {
        return cachedStories;
      }
      throw new Error('No cached stories available');
    } catch (error) {
      console.error('Error getting stories from cache:', error);
      throw new Error('Unable to load stories. Please check your connection and try again.');
    }
  }

  async addStory(token, { description, photo, lat, lon }) {
    const storyData = { description, photo, lat, lon };
    
    // Prepare the story data for offline storage
    const storyForDb = {
      description,
      photo: photo instanceof File ? { name: photo.name, type: photo.type, size: photo.size } : photo,
      lat: lat ? parseFloat(lat) : null,
      lon: lon ? parseFloat(lon) : null,
      createdAt: new Date().toISOString(),
      isLocal: true
    };

    // If offline, save to IndexedDB and queue for sync
    if (!navigator.onLine) {
      try {
        // Save to IndexedDB
        const localStory = await dbHelper.addStory({
          ...storyForDb,
          id: `local-${Date.now()}`
        });

        // Add to sync queue
        await dbHelper.addToSyncQueue({
          type: 'sync-stories',
          data: storyData,
          method: 'POST',
          url: `${BASE_URL}/stories`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        return { 
          ...localStory,
          message: 'Story saved locally. Will be synced when online.' 
        };
      } catch (error) {
        console.error('Error saving story offline:', error);
        throw new Error('Failed to save story. Please try again later.');
      }
    }

    // If online, try to send to server
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      
      if (lat && lon) {
        formData.append('lat', lat.toString());
        formData.append('lon', lon.toString());
      }

      const response = await fetch(`${BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseJson = await response.json();
      
      if (!response.ok) {
        throw new Error(responseJson.message);
      }

      // Also save to IndexedDB for offline access
      if (responseJson.story) {
        await dbHelper.addStory(responseJson.story);
      }

      return responseJson;
    } catch (error) {
      console.error('Error adding story online, trying to save offline:', error);
      
      // If online but request fails, save offline
      if (navigator.onLine) {
        return this.addStory(token, { description, photo, lat, lon });
      }
      
      throw error;
    }
  }
}

// Create a singleton instance
const storyService = new StoryService();

export default storyService;