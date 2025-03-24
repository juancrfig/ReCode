// User authentication and data management
export class Auth {
    constructor() {
        this.currentUser = null;
        this.loadUser();
    }

    loadUser() {
        const userData = localStorage.getItem('user');
        const savedCredentials = localStorage.getItem('rememberedCredentials');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return true;
        } else if (savedCredentials) {
            const { email, password } = JSON.parse(savedCredentials);
            return this.login(email, password);
        }
        return false;
    }

    login(email, password, remember = false) {
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Create a clean copy of user data without password
            const userWithoutPassword = {
                id: user.id,
                name: user.name || email.split('@')[0], // Fallback name if not set
                email: user.email,
                createdAt: user.createdAt || new Date().toISOString(),
                stats: user.stats || {
                    totalCards: 0,
                    mastered: 0,
                    learning: 0,
                    streak: 0,
                    lastPractice: null
                }
            };
            
            this.currentUser = userWithoutPassword;
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));
            
            // Save credentials if remember me is checked
            if (remember) {
                localStorage.setItem('rememberedCredentials', JSON.stringify({ email, password }));
            }
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
            name: name || email.split('@')[0], // Fallback name if not provided
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

        // Log user in (without password)
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        this.currentUser = userWithoutPassword;
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));

        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('user');
        localStorage.removeItem('rememberedCredentials');
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

    updateUserConfig(config) {
        if (!this.currentUser) return false;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex === -1) return false;

        // Update user configuration
        users[userIndex] = {
            ...users[userIndex],
            ...config,
            id: this.currentUser.id, // Preserve the user ID
            password: users[userIndex].password // Preserve the password
        };

        // Save updated users
        localStorage.setItem('users', JSON.stringify(users));

        // Update current user (excluding password)
        const { password, ...userWithoutPassword } = users[userIndex];
        this.currentUser = userWithoutPassword;
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));

        return true;
    }
}

// Export both the class and a singleton instance
export const auth = new Auth(); 