const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Verify.js loaded');
    
    // Display the user's email on the verification page
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    // Try multiple selectors for email display
    const emailDisplaySelectors = [
        '.verification-email',
        '.user-email',
        '#userEmail',
        '[data-email]'
    ];
    
    for (const selector of emailDisplaySelectors) {
        const emailDisplay = document.querySelector(selector);
        if (emailDisplay && userEmail) {
            emailDisplay.textContent = userEmail;
            break;
        }
    }

    // Find OTP input field with multiple possible selectors
    const otpInput = document.getElementById('otp') || 
                    document.querySelector('input[name="otp"]') ||
                    document.querySelector('input[placeholder*="OTP"]') ||
                    document.querySelector('input[placeholder*="code"]') ||
                    document.querySelector('input[type="text"]') ||
                    document.querySelector('input[type="number"]');
    
    console.log('OTP input found:', !!otpInput);

    // Find verify button with multiple possible selectors
    const verifyButton = document.getElementById('verifyBtn') ||
                        document.getElementById('verify-btn') ||
                        document.querySelector('button[type="submit"]') ||
                        document.querySelector('.verify-btn') ||
                        document.querySelector('button:contains("Verify")') ||
                        document.querySelector('input[type="submit"]');
    
    console.log('Verify button found:', !!verifyButton);

    // Find error message element
    const errorElement = document.getElementById('errorMessage') ||
                        document.getElementById('error-message') ||
                        document.querySelector('.error-message') ||
                        document.querySelector('.error') ||
                        document.querySelector('.alert');

    // Find form element
    const verificationForm = document.getElementById('verifyForm') ||
                            document.getElementById('verificationForm') ||
                            document.getElementById('verify-form') ||
                            document.querySelector('form') ||
                            document.querySelector('.verification-form');

    console.log('Form found:', !!verificationForm);

    // Function to handle OTP verification
    const handleVerification = async (e) => {
        if (e) {
            e.preventDefault();
        }
        
        console.log('Verification handler called');
        
        if (!otpInput) {
            console.error('OTP input field not found');
            showError('OTP input field not found. Please refresh the page.');
            return;
        }

        const otp = otpInput.value.trim();
        console.log('OTP value:', otp);
        
        if (!otp) {
            showError('Please enter the OTP');
            return;
        }

        if (!userEmail) {
            showError('Email not found. Please register again.');
            setTimeout(() => {
                window.location.href = 'register.html';
            }, 2000);
            return;
        }

        // Show loading state
        if (verifyButton) {
            verifyButton.disabled = true;
            verifyButton.textContent = 'Verifying...';
        }

        try {
            console.log('Sending verification request...');
            
            // Send verification request with both email and OTP
            const response = await axios.post(`${API_BASE_URL}/auth/verify-account`, {
                email: userEmail,
                otp: otp
            }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('Verification response:', response.data);

            if (response.data.success) {
                showSuccess('Email verified successfully! Redirecting to login...');
                
                // Clear the email from localStorage after successful verification
                localStorage.removeItem('userEmail');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Verification error:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = 'Verification failed. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        } finally {
            // Re-enable verify button
            if (verifyButton) {
                verifyButton.disabled = false;
                verifyButton.textContent = 'Verify';
            }
        }
    };

    // Function to show error messages
    const showError = (message) => {
        console.log('Error:', message);
        if (errorElement) {
            errorElement.style.color = 'red';
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            alert('Error: ' + message);
        }
    };

    // Function to show success messages
    const showSuccess = (message) => {
        console.log('Success:', message);
        if (errorElement) {
            errorElement.style.color = 'green';
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            alert('Success: ' + message);
        }
    };

    // Clear any existing error when user starts typing
    if (otpInput && errorElement) {
        otpInput.addEventListener('input', () => {
            errorElement.style.display = 'none';
        });
    }

    // Attach event listeners
    if (verificationForm) {
        console.log('Attaching form submit listener');
        verificationForm.addEventListener('submit', handleVerification);
    }

    if (verifyButton) {
        console.log('Attaching button click listener');
        verifyButton.addEventListener('click', handleVerification);
        
        // Also add keypress listener for Enter key on button
        verifyButton.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleVerification(e);
            }
        });
    }

    // Add Enter key listener to OTP input
    if (otpInput) {
        console.log('Attaching OTP input listeners');
        otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleVerification(e);
            }
        });
        
        // Auto-focus on OTP input
        otpInput.focus();
    }

    // Handle "Resend OTP" functionality
    const resendButton = document.getElementById('resendOtp') ||
                        document.getElementById('resend-otp') ||
                        document.querySelector('.resend-btn') ||
                        document.querySelector('.resend-otp') ||
                        document.querySelector('a[href*="resend"]') ||
                        document.querySelector('button:contains("Resend")');
    
    if (resendButton) {
        console.log('Resend button found, attaching listener');
        resendButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const userEmail = localStorage.getItem('userEmail');
            
            if (!userEmail) {
                showError('Email not found. Please register again.');
                return;
            }

            // Disable resend button temporarily
            resendButton.disabled = true;
            const originalText = resendButton.textContent;
            resendButton.textContent = 'Sending...';

            try {
                console.log('Sending resend OTP request for:', userEmail);
                
                const response = await axios.post(`${API_BASE_URL}/auth/send-verify-otp`, {
                    email: userEmail
                }, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log('Resend OTP response:', response.data);
                showSuccess('OTP sent successfully!');

                // Re-enable button after 30 seconds
                setTimeout(() => {
                    resendButton.disabled = false;
                    resendButton.textContent = originalText;
                }, 30000);

            } catch (error) {
                console.error('Resend OTP error:', error);
                
                let errorMessage = 'Failed to resend OTP. Please try again.';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                
                showError(errorMessage);

                // Re-enable button immediately on error
                resendButton.disabled = false;
                resendButton.textContent = originalText;
            }
        });
    }

    // Redirect to register if no email is found
    if (!userEmail) {
        console.log('No email found in localStorage, redirecting to register');
        showError('No email found. Redirecting to registration...');
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 2000);
    }

    // Global function for direct button onclick
    window.verifyOTP = handleVerification;
    window.handleVerification = handleVerification;
    
    console.log('All event listeners attached');
});

// Fallback global function
window.verifyEmail = async function() {
    const otpInput = document.getElementById('otp') || 
                    document.querySelector('input[type="text"]') ||
                    document.querySelector('input[type="number"]');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!otpInput || !userEmail) {
        alert('Required elements not found. Please refresh the page.');
        return;
    }

    const otp = otpInput.value.trim();
    
    if (!otp) {
        alert('Please enter the OTP');
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-account`, {
            email: userEmail,
            otp: otp
        }, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
            alert('Email verified successfully! Redirecting to dashboard...');
            localStorage.removeItem('userEmail');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert(error.response?.data?.message || 'Verification failed');
    }
};