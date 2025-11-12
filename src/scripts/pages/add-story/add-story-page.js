import StoryService from '../../data/api';
import mapService from '../../utils/map-service';

export default class AddStoryPage {
  #selectedLocation = null;
  #map = null;
  #locationMarker = null;

  async render() {
    return `
      <section class="container add-story-page">
        <h1>Add New Story</h1>
        <form id="add-story-form" class="add-story-form">
          <div class="form-group">
            <label for="description">Story Description</label>
            <textarea 
              id="description" 
              name="description" 
              required 
              placeholder="Tell your story..."
              aria-required="true"></textarea>
          </div>

          <div class="form-group">
            <label for="photo">Photo</label>
            <div class="photo-input-container">
              <input 
                type="file" 
                id="photo" 
                name="photo" 
                accept="image/*" 
                required
                aria-required="true">
              <button type="button" id="camera-button" class="camera-button">
                Take Photo
              </button>
            </div>
            <div id="photo-preview" class="photo-preview"></div>
          </div>

          <div class="form-group">
            <label>Location</label>
            <div id="location-map" class="location-map"></div>
            <p class="location-help">Click on the map to select a location for your story</p>
          </div>

          <div class="form-actions">
            <button type="button" id="cancel-button" class="cancel-button">Cancel</button>
            <button type="submit" class="submit-button">Share Story</button>
          </div>
        </form>
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

    this._initializeMap();
    this._setupForm();
    this._setupCamera();
  }

  _initializeMap() {
    this.#map = mapService.initializeMap('location-map', {
      zoom: 5
    });

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLocation = { lat, lng };
      
      if (this.#locationMarker) {
        mapService.removeMarker(this.#locationMarker);
      }
      
      this.#locationMarker = mapService.addMarker(lat, lng, {
        draggable: true
      });

      this.#locationMarker.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        this.#selectedLocation = { lat: position.lat, lng: position.lng };
      });
    });
  }

  _setupForm() {
    const form = document.getElementById('add-story-form');
    const photoInput = document.getElementById('photo');
    const previewContainer = document.getElementById('photo-preview');
    const cancelButton = document.getElementById('cancel-button');

    // Handle cancel button
    cancelButton.addEventListener('click', () => {
      window.location.hash = '#/';
    });

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="Preview" class="preview-image">
          `;
        };
        reader.readAsDataURL(file);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const formData = new FormData(form);
        const description = formData.get('description');
        const photo = formData.get('photo');

        if (!this.#selectedLocation) {
          alert('Please select a location on the map');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          window.location.hash = '#/login';
          return;
        }

        await StoryService.addStory(token, {
          description,
          photo,
          lat: this.#selectedLocation.lat,
          lon: this.#selectedLocation.lng
        });

        window.location.hash = '#/';
      } catch (error) {
        console.error('Error adding story:', error);
        alert('Failed to add story. Please try again.');
      }
    });
  }

  async _setupCamera() {
    const cameraButton = document.getElementById('camera-button');
    const previewContainer = document.getElementById('photo-preview');
    const photoInput = document.getElementById('photo');

    cameraButton.addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        previewContainer.innerHTML = `
          <video autoplay class="camera-preview"></video>
          <button type="button" class="capture-button">Take Photo</button>
        `;

        const video = document.querySelector('.camera-preview');
        video.srcObject = stream;

        const captureButton = document.querySelector('.capture-button');
        captureButton.addEventListener('click', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);

          // Convert canvas to file
          canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            
            // Create a new FileList containing the captured image
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            photoInput.files = dataTransfer.files;

            // Show preview
            previewContainer.innerHTML = `
              <img src="${canvas.toDataURL()}" alt="Preview" class="preview-image">
            `;

            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
          }, 'image/jpeg');
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please make sure you have granted camera permissions.');
      }
    });
  }
}