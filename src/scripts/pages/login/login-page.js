import StoryService from '../../data/api';

export default class LoginPage {
  async render() {
    return `
      <section class="container login-page">
        <div class="auth-container">
          <h1>Login</h1>
          <form id="login-form" class="auth-form">
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
                placeholder="Enter your password">
            </div>

            <div class="error-message" id="error-message"></div>

            <button type="submit" class="submit-button">Login</button>
          </form>

          <p class="auth-link">
            Don't have an account? <button type="button" id="register-link" class="link-button">Register here</button>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const registerLink = document.getElementById('register-link');

    // Handle register link button
    registerLink.addEventListener('click', () => {
      window.location.hash = '#/register';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await StoryService.login(email, password);
        
        // Save token to localStorage
        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('userId', response.loginResult.userId);
        localStorage.setItem('name', response.loginResult.name);

        // Redirect to home
        window.location.hash = '#/';
      } catch (error) {
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorMessage.style.display = 'block';
      }
    });
  }
}
