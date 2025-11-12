import CONFIG from '../config';

const BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryService {
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

  async getAllStories(token) {
    const response = await fetch(`${BASE_URL}/stories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();
    
    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson.listStory;
  }

  async addStory(token, { description, photo, lat, lon }) {
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
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();
    
    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }
}

export default new StoryService();