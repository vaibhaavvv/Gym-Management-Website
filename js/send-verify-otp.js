document.addEventListener('DOMContentLoaded', () => {
    const sendVerifyForm = document.getElementById('sendVerifyForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Pre-fill email if available in localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.value = userEmail;
    }
    
    sendVerifyForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';
      
      // Get email from input
      const email = document.getElementById('email').value.trim();
      if (!email) {
        errorMessage.style.color = 'red';
        errorMessage.textContent = 'Email is required';
        return;
      }
      
      // Save email to localStorage
      localStorage.setItem('userEmail', email);
      
      // Show loading state
      errorMessage.style.color = 'blue';
      errorMessage.textContent = 'Sending verification OTP...';
      
      try {
        // Send verification OTP with email explicitly included
        const response = await axios.post(`${API_BASE_URL}/auth/send-verify-otp`, {
          email: email
        }, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });
    
        if (response.data.success) { 
          // Show success message
          errorMessage.style.color = 'green';
          errorMessage.textContent = 'OTP sent successfully. Redirecting to verification page...';
          
          // Redirect to verify page
          setTimeout(() => {
            window.location.href = 'verify.html';
          }, 1500);
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        errorMessage.style.color = 'red';
        errorMessage.textContent = error.response?.data?.message || 'Failed to send verification OTP.';
      }
    });
  });