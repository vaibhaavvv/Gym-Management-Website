// forget-password.js - Improved version with better error handling and user feedback

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000/api';
const form = document.getElementById('forgotPasswordForm');
const submitBtn = document.getElementById('submitBtn');
const errorElement = document.getElementById('errorMessage');
const successElement = document.getElementById('successMessage');
const emailInput = document.getElementById('email');

// Enhanced email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show loading state
function showLoading() {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
    submitBtn.classList.add('loading');
}

// Reset button state
function resetSubmitButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
    submitBtn.classList.remove('loading');
}

// Enhanced error display
function showError(message) {
    errorElement.innerHTML = `<i class="error-icon">⚠️</i> ${message}`;
    errorElement.style.display = 'block';
    errorElement.classList.add('shake');
    
    // Remove shake animation after it completes
    setTimeout(() => {
        errorElement.classList.remove('shake');
    }, 500);
    
    // Hide success message
    successElement.style.display = 'none';
}

// Enhanced success display
function showSuccess(message) {
    successElement.innerHTML = `<i class="success-icon">✅</i> ${message}`;
    successElement.style.display = 'block';
    successElement.classList.add('slide-in');
    
    // Hide error message
    errorElement.style.display = 'none';
}

// Clear all messages
function clearMessages() {
    errorElement.style.display = 'none';
    successElement.style.display = 'none';
    errorElement.classList.remove('shake');
    successElement.classList.remove('slide-in');
}

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearMessages();
    
    const email = emailInput.value.trim();
    
    // Validation
    if (!email) {
        showError('Email address is required');
        emailInput.focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        emailInput.focus();
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        console.log('Sending reset OTP request to:', `${API_BASE_URL}/auth/send-reset-otp`);
        console.log('Email:', email);
        
        const response = await axios.post(`${API_BASE_URL}/auth/send-reset-otp`, 
            { email }, 
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000, // 30 second timeout
                withCredentials: true
            }
        );
        
        console.log('Response:', response.data);
        
        if (response.data.success) {
            showSuccess('Reset OTP sent successfully! Check your email inbox.');
            
            // Store email for the next step
            localStorage.setItem('resetEmail', email);
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
            }, 2000);
            
        } else {
            showError(response.data.message || 'Failed to send reset OTP');
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        
        let errorMessage = 'Failed to send reset OTP. Please try again.';
        
        if (error.response) {
            // Server responded with error status
            if (error.response.status === 403) {
                errorMessage = error.response.data.message || 'Account not verified';
            } else {
                errorMessage = error.response.data.message || 
                             `Server error (${error.response.status})`;
            }
        }
        
        showError(errorMessage);
        
    } finally {
        resetSubmitButton();
    }
});

// Real-time email validation
emailInput.addEventListener('input', function() {
    const email = this.value.trim();
    
    // Clear previous validation styles
    this.classList.remove('invalid', 'valid');
    
    if (email) {
        if (isValidEmail(email)) {
            this.classList.add('valid');
        } else {
            this.classList.add('invalid');
        }
    }
});

// Auto-fill email from URL parameter
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
        emailInput.value = decodeURIComponent(email);
        emailInput.dispatchEvent(new Event('input')); // Trigger validation
    }
    
    // Focus on email input if empty
    if (!emailInput.value) {
        emailInput.focus();
    }
});

// Add retry functionality
window.retryForgotPassword = function() {
    clearMessages();
    resetSubmitButton();
    emailInput.focus();
};

// Test API connection (for debugging)
window.testApiConnection = async function() {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/test`, {
            timeout: 5000
        });
        console.log('API test successful:', response.data);
        return true;
    } catch (error) {
        console.error('API test failed:', error);
        return false;
    }
};