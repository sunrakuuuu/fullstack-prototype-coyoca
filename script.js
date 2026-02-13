// Check if user is logged in (example: from localStorage)
document.addEventListener('DOMContentLoaded', function() {
  const authLinks = document.getElementById('authLinks');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Hide login/register links if user is logged in
  if (isLoggedIn) {
    authLinks.style.display = 'none';
  }
});