import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen.toString());
    });

    // Handle Escape key to close drawer
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.#navigationDrawer.classList.contains('open')) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      })
    });

    // Add keyboard support for all buttons
    this._setupKeyboardNavigation();
  }

  _setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      // Handle button activation with Enter and Space keys
      if (event.key === 'Enter' || event.key === ' ') {
        if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
          event.preventDefault();
          event.target.click();
        }
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    let page = routes[url];

    // If route not found, redirect to login
    if (!page) {
      window.location.hash = '#/login';
      return;
    }

    // Use View Transition API if available
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        // Update content
        this.#content.innerHTML = await page.render();
        
        // Execute page logic
        await page.afterRender();
      });
    } else {
      // Fallback for browsers that don't support View Transition API
      // Add exit animation
      this.#content.classList.add('page-exit');
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for exit animation

      // Update content
      this.#content.innerHTML = await page.render();
      
      // Reset animation classes
      this.#content.classList.remove('page-exit');
      this.#content.classList.add('page-enter');
      
      // Execute page logic
      await page.afterRender();

      // Remove enter class after animation completes
      setTimeout(() => {
        this.#content.classList.remove('page-enter');
      }, 300);
    }
  }
}

export default App;
