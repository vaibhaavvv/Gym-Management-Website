// Dashboard Functions
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000/api';

// Load user data and update dashboard
async function loadUserData() {
    try {
        // Show loading state
        const welcomeElement = document.getElementById('user-welcome');
        welcomeElement.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading your dashboard...</p>
        `;

        // Load user info
        const response = await axios.get(`${API_BASE_URL}/user/data`, {
            withCredentials: true
        });
        
        if (response.data.success) {
            const user = response.data.userData;
            
            // Update welcome message
            welcomeElement.innerHTML = `
                <h2>Welcome back, ${user.name}!</h2>
                <p class="lead">Your VR Fitness Journey</p>
                <div class="user-stats mt-4">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h4 class="stat-value">24</h4>
                                <p class="stat-label">Workouts</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h4 class="stat-value">12</h4>
                                <p class="stat-label">VR Sessions</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="stat-card p-3 rounded bg-light">
                                <h4 class="stat-value">15</h4>
                                <p class="stat-label">Achievements</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <a href="profile.html" class="btn btn-primary me-2">
                        <i class="fas fa-user me-1"></i> View Profile
                    </a>
                    <a href="workouts.html" class="btn btn-outline-primary">
                        <i class="fas fa-dumbbell me-1"></i> Start Workout
                    </a>
                </div>
            `;
            
            // Update username in navbar dropdown
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = user.name;
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        
        const welcomeElement = document.getElementById('user-welcome');
        welcomeElement.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Dashboard</h4>
                <p>${error.response?.data?.message || 'Unable to load your data. Please try again.'}</p>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-danger me-2" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-1"></i> Retry
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="logout()">
                        <i class="fas fa-sign-out-alt me-1"></i> Logout
                    </button>
                </div>
            </div>
        `;
        
        if (error.response?.status === 401) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load user data
    loadUserData();
    
    // Check authentication status periodically
    setInterval(() => {
        updateNavbar();
    }, 300000); // Every 5 minutes
});

// Add to global scope for HTML onclick attributes
window.loadUserData = loadUserData;