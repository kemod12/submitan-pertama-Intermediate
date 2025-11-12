import StoryService from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container register-page">
        <div class="auth-container">
          <h1>Register</h1>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                aria-required="true"
                placeholder="Enter your full name">
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                aria-required="true"
                placeholder="Enter your email">
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                aria-required="true"
                placeholder="Enter your password (min. 6 characters)"
                minlength="6">
            </div>

            <div class="error-message" id="error-message"></div>

            <button type="submit" class="submit-button">Register</button>
          </form>

          <p class="auth-link">
            Already have an account? <button type="button" id="login-link" class="link-button">Login here</button>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const loginLink = document.getElementById('login-link');

    // Handle login link button
    loginLink.addEventListener('click', () => {
      window.location.hash = '#/login';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        await StoryService.register(name, email, password);

        // Redirect to login
        alert('Registration successful! Please login.');
        window.location.hash = '#/login';
      } catch (error) {
        errorMessage.textContent = error.message || 'Registration failed. Please try again.';
        errorMessage.style.display = 'block';
      }
    });
  }
}
