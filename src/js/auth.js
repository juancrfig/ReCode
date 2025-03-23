// User authentication and data management
export class Auth {
    constructor() {
        this.currentUser = null;
        this.loadUser();
    }

    loadUser() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return true;
        }
        return false;
    }

    login(email, password) {
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            delete user.password; // Don't store password in session
            this.currentUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        }
        
        return false;
    }

    signup(name, email, password) {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user already exists
        if (users.some(u => u.email === email)) {
            return false;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString(),
            stats: {
                totalCards: 0,
                mastered: 0,
                learning: 0,
                streak: 0,
                lastPractice: null
            }
        };

        // Save user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Log user in
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        this.currentUser = userWithoutPassword;
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));

        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUserStats(stats) {
        if (!this.currentUser) return false;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex === -1) return false;

        // Update stats
        users[userIndex].stats = {
            ...users[userIndex].stats,
            ...stats
        };

        // Save updated users
        localStorage.setItem('users', JSON.stringify(users));

        // Update current user
        this.currentUser.stats = users[userIndex].stats;
        localStorage.setItem('user', JSON.stringify(this.currentUser));

        return true;
    }
}

// Export both the class and a singleton instance
export const auth = new Auth(); 