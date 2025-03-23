import { auth } from './auth.js';

class Login {
    constructor() {
        this.initialize();
    }

    initialize() {
        if (auth.isAuthenticated()) {
            window.location.href = 'main.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;
                this.switchTab(targetId);
            });
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (auth.login(email, password)) {
                window.location.href = 'main.html';
            } else {
                alert('Invalid email or password');
            }
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            if (auth.signup(name, email, password)) {
                window.location.href = 'main.html';
            } else {
                alert('Email already exists');
            }
        });
    }

    switchTab(targetId) {
        // Update active tab
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.toggle('active-tab', tab.dataset.tab === targetId);
        });

        // Show/hide forms
        document.getElementById('login-form').classList.toggle('hidden', targetId !== 'login');
        document.getElementById('signup-form').classList.toggle('hidden', targetId !== 'signup');
    }
}

// Initialize login when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Login();
}); 