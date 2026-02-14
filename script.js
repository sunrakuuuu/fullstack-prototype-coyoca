/**
 * Initialize authentication UI on page load
 * - Shows login/register links by default
 * - Shows user dropdown if logged in
 * - Handles logout functionality
 * - Manages page navigation
 */
document.addEventListener('DOMContentLoaded', () => {
  const authLinks = document.getElementById('authLinks');
  const userDropdown = document.getElementById('userDropdown');
  const usernameDisplay = document.getElementById('username');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerForm = document.getElementById('registerForm');

  function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'User';

    if (isLoggedIn) {
      // Show dropdown, hide login/register
      authLinks.classList.add('d-none');
      userDropdown.classList.remove('d-none');
      usernameDisplay.textContent = username;
    } else {
      // Show login/register, hide dropdown
      authLinks.classList.remove('d-none');
      userDropdown.classList.add('d-none');
    }
  }

  function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.classList.add('d-none'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.remove('d-none');
    }
  }

  // Handle hash navigation
  function handleNavigation() {
    const hash = window.location.hash.slice(1) || 'home';
    showPage(hash);
  }

  // Register form submission
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    
    // Store registration data
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('email', email);
    
    // Clear form
    registerForm.reset();
    
    // Navigate to verify email page
    window.location.hash = '#verify-email';
  });

  // Logout functionality
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    updateAuthUI();
    window.location.hash = '#home';
  });

  // Listen to hash changes
  window.addEventListener('hashchange', handleNavigation);

  // Initial UI setup
  updateAuthUI();
  handleNavigation();
});