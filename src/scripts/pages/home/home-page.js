import StoryService from '../../data/api';

export default class HomePage {
  #map = null;
  #stories = [];
  #activeMarkerId = null;

  async render() {
    return `
      <section class="container home-page">
        <div class="page-header">
          <div class="header-content">
            <h1>Story Map</h1>
            <button id="logout-button" class="logout-button">Logout</button>
          </div>
          <button id="add-story-button" class="add-story-button">Add New Story</button>
        </div>
        <div class="content-wrapper">
          <div class="story-list" id="story-list">
            <h2>Stories</h2>
            <div class="stories-container">Loading stories...</div>
          </div>
          <div class="map-container">
            <div id="map"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.hash = '#/login';
      return;
    }

    // Setup logout button
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('name');
      window.location.hash = '#/login';
    });

    // Setup add story button
    const addStoryButton = document.getElementById('add-story-button');
    addStoryButton.addEventListener('click', () => {
      window.location.hash = '#/add';
    });

    await this._initializeMap();
    await this._loadStories();
  }

  async _initializeMap() {
    const { default: mapService } = await import('../../utils/map-service');
    this.#map = mapService.initializeMap('map');
  }

  async _loadStories() {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      const stories = await StoryService.getAllStories(token);
      this.#stories = stories;

      this._renderStories(stories);
      this._renderMarkers(stories);
    } catch (error) {
      console.error('Error loading stories:', error);
      document.querySelector('.stories-container').innerHTML = 'Error loading stories. Please try again later.';
    }
  }

  _renderStories(stories) {
    const storiesContainer = document.querySelector('.stories-container');
    if (!stories.length) {
      storiesContainer.innerHTML = '<p>No stories found.</p>';
      return;
    }

    const storiesHtml = stories.map((story) => {
      const createdDate = new Date(story.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <article class="story-item ${story.id === this.#activeMarkerId ? 'active' : ''}" data-id="${story.id}">
          <img src="${story.photoUrl}" alt="Photo from ${story.name}" class="story-image">
          <div class="story-content">
            <h3>${story.name}</h3>
            <p class="story-description">${story.description}</p>
            <time class="story-date">${createdDate}</time>
          </div>
        </article>
      `;
    }).join('');

    storiesContainer.innerHTML = storiesHtml;

    // Add click event listeners to story items
    document.querySelectorAll('.story-item').forEach((item) => {
      item.addEventListener('click', () => {
        const storyId = item.dataset.id;
        const story = this.#stories.find((s) => s.id === storyId);
        if (story && story.lat && story.lon) {
          const { default: mapService } = require('../../utils/map-service');
          mapService.setView(story.lat, story.lon, 15);
          this.#activeMarkerId = storyId;
          this._highlightActiveStory(storyId);
        }
      });
    });
  }

  _renderMarkers(stories) {
    const { default: mapService } = require('../../utils/map-service');
    mapService.clearMarkers();

    const bounds = L.latLngBounds();
    let hasValidCoordinates = false;

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        hasValidCoordinates = true;
        
        const createdDate = new Date(story.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        const marker = mapService.addMarker(story.lat, story.lon, {
          title: story.name,
        });

        marker.bindPopup(`
          <div class="marker-popup">
            <img src="${story.photoUrl}" alt="Photo from ${story.name}" class="popup-image">
            <h3>${story.name}</h3>
            <p>${story.description}</p>
            <time class="popup-date">${createdDate}</time>
          </div>
        `);

        marker.on('click', () => {
          this.#activeMarkerId = story.id;
          this._highlightActiveStory(story.id);
        });

        bounds.extend([story.lat, story.lon]);
      }
    });

    if (hasValidCoordinates) {
      mapService.getMap().fitBounds(bounds, {
        padding: [50, 50],
      });
    }
  }

  _highlightActiveStory(storyId) {
    document.querySelectorAll('.story-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.id === storyId);
    });
  }
}
