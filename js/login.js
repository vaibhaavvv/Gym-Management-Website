document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    const loginForm = document.getElementById('loginForm') || document.querySelector('form');
    const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');
    const loginButton = document.getElementById('loginBtn') || document.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('errorMessage') || document.querySelector('.error-message');
    const rememberCheckbox = document.getElementById('remember') || document.querySelector('input[type="checkbox"]');

    // Function to show error messages
    const showError = (message) => {
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.style.color = 'red';
            errorElement.textContent = message;
        } else {
            alert('Error: ' + message);
        }
    };

    // Function to show success messages
    const showSuccess = (message) => {
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.style.color = 'green';
            errorElement.textContent = message;
        } else {
            alert('Success: ' + message);
        }
    };

    // Clear error when user starts typing
    [emailInput, passwordInput].forEach(input => {
        if (input && errorElement) {
            input.addEventListener('input', () => {
                errorElement.style.display = 'none';
            });
        }
    });

    // Handle login
    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        const email = emailInput?.value.trim();
        const password = passwordInput?.value.trim();

        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        // Show loading state
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Signing In...';
        }

        try {
            console.log('Attempting login for:', email);
            
            // FIXED: Use axios with proper credentials configuration
            const response = await axios.post(`${window.API_BASE_URL}/auth/login`, {
                email: email,
                password: password
            }, {
                withCredentials: true, // This is crucial for cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login response:', response.data);

            if (response.data.success) {
                showSuccess('Login successful! Redirecting...');
                
                // Clear any stored email from registration
                localStorage.removeItem('userEmail');
                
                // Store user info if remember me is checked
                if (rememberCheckbox?.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }

        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.response?.status === 403 && error.response?.data?.needsVerification) {
                // Account needs verification
                errorMessage = error.response.data.message;
                localStorage.setItem('userEmail', error.response.data.email);
                
                setTimeout(() => {
                    if (confirm('Would you like to go to the verification page?')) {
                        window.location.href = 'verify.html';
                    }
                }, 2000);
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        } finally {
            // Re-enable login button
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    };

    // Attach event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // Enter key support
    [emailInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin(e);
                }
            });
        }
    });

    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }

    // Global function for direct calls
    window.loginUser = handleLogin;
    
    console.log('Login event handlers attached');
});