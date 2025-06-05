const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000/api';

// Password Visibility Toggle
window.togglePassword = function(fieldId = 'password') {
  const input = document.getElementById(fieldId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

// Form Handlers
document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorElement = document.getElementById('errorMessage');
      errorElement.textContent = '';
      
      try {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password
        }, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          // Get user data after successful login
          const userResponse = await axios.get(`${API_BASE_URL}/user/data`, {
            withCredentials: true
          });
          
          if (userResponse.data.success) {
            // Store user data in localStorage
            localStorage.setItem('userName', userResponse.data.userData.name);
            localStorage.setItem('userEmail', userResponse.data.userData.email);
          }
          
          window.location.href = 'index.html'; // Redirect to home page after successful login
        }
      } catch (error) {
        console.error('Login error:', error);
        
        // Check if the error is about account verification
        if (error.response?.data?.message?.includes('not verified')) {
          // Store the email for verification process
          const userEmail = document.getElementById('email').value.trim();
          localStorage.setItem('userEmail', userEmail);
          
          // Show verification prompt with a button instead of a link
          errorElement.innerHTML = 'Account not verified. <button id="sendOtpBtn" class="text-link" style="background:none;border:none;color:#3498db;text-decoration:underline;cursor:pointer;padding:0;font:inherit;">Send verification OTP</button>';
          
          // Add event listener to the new button
          document.getElementById('sendOtpBtn').addEventListener('click', async () => {
            try {
              // Show loading state
              errorElement.innerHTML = 'Sending verification OTP...';
              
              // Send OTP with the email explicitly included
              await axios.post(`${API_BASE_URL}/auth/send-verify-otp`, {
                email: userEmail
              }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update UI and redirect
              errorElement.innerHTML = 'OTP sent successfully! Redirecting to verification page...';
              setTimeout(() => {
                window.location.href = 'verify.html';
              }, 1500);
            } catch (otpError) {
              console.error('Error sending OTP:', otpError);
              errorElement.innerHTML = `Failed to send OTP: ${otpError.response?.data?.message || 'Unknown error'}. <button id="retrySendOtp" class="text-link" style="background:none;border:none;color:#3498db;text-decoration:underline;cursor:pointer;padding:0;font:inherit;">Retry</button>`;
              
              // Add retry functionality
              document.getElementById('retrySendOtp').addEventListener('click', async () => {
                errorElement.innerHTML = 'Account not verified. <button id="sendOtpBtn" class="text-link" style="background:none;border:none;color:#3498db;text-decoration:underline;cursor:pointer;padding:0;font:inherit;">Send verification OTP</button>';
                document.getElementById('sendOtpBtn').click();
              });
            }
          });
        } else {
          errorElement.textContent = error.response?.data?.message || 'Login failed. Please try again.';
        }
      }
    });
  }

  // Registration Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorElement = document.getElementById('errorMessage');
      errorElement.textContent = '';
      
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();

      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return;
      }

      try {
        // Step 1: Register the user
        const email = document.getElementById('email').value.trim();
        const name = document.getElementById('name').value.trim();
        
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          name,
          email,
          password
        }, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          // Store user information for the verification process
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userName', name);
          
          // Step 2: Send OTP automatically after registration
          try {
            await axios.post(`${API_BASE_URL}/auth/send-verify-otp`, {}, {
              withCredentials: true
            });
            
            // Redirect to verification page
            window.location.href = 'verify.html';
          } catch (otpError) {
            console.error('Error sending verification OTP:', otpError);
            errorElement.textContent = 'Registration successful but failed to send verification OTP. Please log in to request a new OTP.';
            
            // Redirect to login page after short delay
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        errorElement.textContent = error.response?.data?.message || 'Registration failed. Please try again.';
      }
    });
  }

  // Auth status check and navbar update
  updateNavbar();
});

// Auth Utilities
async function updateNavbar() {
  try {
    // FIXED: Changed from POST to GET request to match the backend route
    const response = await axios.get(`${API_BASE_URL}/auth/is-auth`, {
      withCredentials: true
    });
    
    const isAuthenticated = response.data.success;
    ['login-btn', 'register-btn', 'logout-btn', 'dashboard-btn'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 
          (id === 'logout-btn' || id === 'dashboard-btn') ? 
          (isAuthenticated ? 'inline-block' : 'none') :
          (isAuthenticated ? 'none' : 'inline-block');
      }
    });

    // Update user greeting
    const userGreeting = document.getElementById('user-greeting');
    const usernameDisplay = document.getElementById('username-display');
    
    if (userGreeting && usernameDisplay) {
      if (isAuthenticated) {
        const userName = localStorage.getItem('userName');
        if (userName) {
          usernameDisplay.textContent = userName;
          userGreeting.style.display = 'inline-block';
        } else {
          // If no username in localStorage but user is authenticated, fetch it
          try {
            const userResponse = await axios.get(`${API_BASE_URL}/user/data`, {
              withCredentials: true
            });
            
            if (userResponse.data.success) {
              const userData = userResponse.data.userData;
              localStorage.setItem('userName', userData.name);
              localStorage.setItem('userEmail', userData.email);
              
              usernameDisplay.textContent = userData.name;
              userGreeting.style.display = 'inline-block';
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      } else {
        userGreeting.style.display = 'none';
      }
    }
  } catch (error) {
    console.log('Auth check error:', error.message);
    
    // If we get a 401 or authentication error, clear localStorage
    if (error.response?.status === 401) {
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
    }
  }
}

// Logout Handler
async function logout() {
  try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          withCredentials: true
      });
      
      // Clear localStorage regardless of response
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');

      // Redirect to login page
      window.location.href = 'login.html';
  } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails on server, clear client-side data
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      
      // Still redirect to login page
      window.location.href = 'login.html';
  }
}

window.logout = logout;
window.updateNavbar = updateNavbar;