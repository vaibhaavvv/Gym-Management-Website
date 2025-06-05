const API_BASE_URL = 'http://localhost:4000/api';
const form = document.getElementById('resetPasswordForm');
const submitBtn = document.getElementById('submitBtn');
const errorElement = document.getElementById('errorMessage');
const successElement = document.getElementById('successMessage');
const resendBtn = document.getElementById('resendOtp');

// Function to check password strength
function checkPasswordStrength(password) {
    const strengthText = document.getElementById('passwordStrength');
    if (!strengthText) return;
    
    // Reset classes
    strengthText.className = 'password-strength';
    
    if (password.length === 0) {
        strengthText.textContent = '';
        return;
    }
    
    if (password.length < 6) {
        strengthText.textContent = 'Weak';
        strengthText.classList.add('weak');
    } else if (password.length < 10) {
        strengthText.textContent = 'Medium';
        strengthText.classList.add('medium');
    } else {
        strengthText.textContent = 'Strong';
        strengthText.classList.add('strong');
    }
}

// Toggle password visibility
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// Resend OTP functionality
async function resendOtp() {
    const email = document.getElementById('email').value || localStorage.getItem('resetEmail');
    
    if (!email) {
        errorElement.textContent = 'Email not found. Please go back to forgot password page.';
        return;
    }
    
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/send-reset-otp`, {
            email
        });
        
        if (response.data.success) {
            successElement.textContent = 'New OTP sent to your email!';
            errorElement.textContent = '';
        }
    } catch (error) {
        console.error('Resend OTP Error:', error);
        errorElement.textContent = error.response?.data?.message || 'Failed to resend OTP';
        successElement.textContent = '';
    } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend OTP';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const otp = document.getElementById('otp').value.trim();
    const email = document.getElementById('email').value || localStorage.getItem('resetEmail');
    
    // Clear previous messages
    errorElement.textContent = '';
    successElement.textContent = '';
    
    // Client-side validation
    if (!email) {
        errorElement.textContent = 'Email is required. Please go back to forgot password page.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
        return;
    }
    
    if (!otp) {
        errorElement.textContent = 'OTP is required';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
        return;
    }
    
    if (newPassword.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
            email,
            otp,
            newPassword
        });
        
        if (response.data.success) {
            successElement.textContent = 'Password reset successfully! Redirecting to login...';
            errorElement.textContent = '';
            
            // Clear stored email
            localStorage.removeItem('resetEmail');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Reset Password Error:', error);
        errorElement.textContent = error.response?.data?.message || 'Failed to reset password. Please try again.';
        successElement.textContent = '';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get email from URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const emailFromStorage = localStorage.getItem('resetEmail');
    
    const email = emailFromUrl || emailFromStorage;
    
    if (email) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = decodeURIComponent(email);
        }
        // Update localStorage
        localStorage.setItem('resetEmail', email);
    } else {
        // If no email found, redirect to forgot password
        alert('No email found. Redirecting to forgot password page.');
        window.location.href = 'forgot-password.html';
        return;
    }
    
    // Add password strength indicator
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
        newPasswordField.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
    
    // Add resend OTP functionality
    if (resendBtn) {
        resendBtn.addEventListener('click', resendOtp);
    }
});