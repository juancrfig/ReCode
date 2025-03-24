import { auth } from './auth.js';
import { storage } from './storage.js';
import { ContributionGraph } from './contribution-graph.js';

class App {
    constructor() {
        this.contributionGraph = null;
        this.initialize();
    }

    initialize() {
        // Ensure we're authenticated and have user data
        if (!auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        const user = auth.getCurrentUser();
        if (!user) {
            console.error('User data not loaded');
            auth.logout();
            window.location.href = 'index.html';
            return;
        }

        this.initializeUI();
        this.setupEventListeners();
        this.loadDashboard();
    }

    initializeUI() {
        const user = auth.getCurrentUser();
        const userGreeting = document.getElementById('user-greeting');
        if (userGreeting && user) {
            userGreeting.textContent = `Welcome back, ${user.name || 'User'}!`;
        }

        this.updateStats();

        const graphContainer = document.getElementById('contribution-graph');
        if (graphContainer) {
            this.contributionGraph = new ContributionGraph('contribution-graph');
        }
    }

    updateStats() {
        const user = auth.getCurrentUser();
        const dueCards = storage.getDueCards().length;

        // Update due cards count
        const dueCardsEl = document.getElementById('due-cards');
        if (dueCardsEl) dueCardsEl.textContent = dueCards;

        const todayCountEl = document.getElementById('today-count');
        if (todayCountEl) todayCountEl.textContent = dueCards;

        // Update user stats
        const stats = user.stats || {};
        const statElements = {
            'total-cards': stats.totalCards || 0,
            'mastered': stats.mastered || 0,
            'learning': stats.learning || 0,
            'streak': `${stats.streak || 0} days`
        };

        Object.entries(statElements).forEach(([key, value]) => {
            const el = document.querySelector(`[data-stat="${key}"]`);
            if (el) el.textContent = value;
        });
    }

    setupEventListeners() {
        // Logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout();
                window.location.href = 'index.html';
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openModal('settings-modal');
            });
        }

        // Start practice button
        const startPracticeBtn = document.getElementById('start-practice-btn');
        if (startPracticeBtn) {
            startPracticeBtn.addEventListener('click', () => {
                const dueCards = storage.getDueCards();
                if (dueCards.length > 0) {
                    this.startPractice(dueCards);
                } else {
                    alert('No cards due for review!');
                }
            });
        }

        // Browse cards button
        const browseCardsBtn = document.getElementById('browse-cards-btn');
        if (browseCardsBtn) {
            browseCardsBtn.addEventListener('click', () => {
                const allCards = storage.getCards();
                if (allCards.length > 0) {
                    this.openModal('deck-view-modal');
                    this.showAllCards(allCards);
                } else {
                    alert('No cards available. Create some cards first!');
                }
            });
        }

        // Create deck button
        const createDeckBtn = document.getElementById('create-deck-btn');
        if (createDeckBtn) {
            createDeckBtn.addEventListener('click', () => {
                this.openModal('create-deck-modal');
            });
        }

        // Modal handlers
        document.addEventListener('click', (e) => {
            // Close modal when clicking outside
            if (e.target.hasAttribute('data-modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close modal buttons
        document.querySelectorAll('[data-close-modal]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.closest('[data-modal]')?.id;
                if (modalId) this.closeModal(modalId);
            });
        });

        // Settings handlers
        const exportConfigBtn = document.getElementById('export-config');
        if (exportConfigBtn) {
            exportConfigBtn.addEventListener('click', () => {
                this.exportConfiguration();
            });
        }

        const importConfigBtn = document.getElementById('import-config');
        const importConfigInput = document.getElementById('import-config-input');
        if (importConfigBtn && importConfigInput) {
            importConfigBtn.addEventListener('click', () => {
                importConfigInput.click();
            });

            importConfigInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) this.importConfiguration(file);
            });
        }

        // Create deck form
        const createDeckForm = document.getElementById('create-deck-form');
        if (createDeckForm) {
            createDeckForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('deck-name');
                const descInput = document.getElementById('deck-description');
                
                if (nameInput) {
                    const name = nameInput.value;
                    const description = descInput?.value || '';
                    
                    storage.createDeck(name, description);
                    this.closeModal('create-deck-modal');
                    this.loadDashboard();
                }
            });
        }

        // Practice modal handlers
        const showAnswerBtn = document.getElementById('show-answer-btn');
        if (showAnswerBtn) {
            showAnswerBtn.addEventListener('click', () => {
                const answerEl = document.getElementById('practice-answer');
                const buttonsEl = document.getElementById('answer-buttons');
                
                if (answerEl && buttonsEl) {
                    answerEl.classList.remove('hidden');
                    showAnswerBtn.classList.add('hidden');
                    buttonsEl.classList.remove('hidden');
                }
            });
        }

        document.querySelectorAll('[data-answer-quality]').forEach(btn => {
            btn.addEventListener('click', () => {
                const quality = parseInt(btn.dataset.answerQuality || '0');
                this.handleAnswer(quality);
            });
        });

        // Add card form submission
        const addCardForm = document.getElementById('add-card-form');
        if (addCardForm) {
            addCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const deckId = document.getElementById('add-card-deck-id').value;
                const question = document.getElementById('card-question').value;
                const answer = document.getElementById('card-answer').value;

                if (!deckId || !question || !answer) {
                    alert('Please fill in all fields');
                    return;
                }

                const newCard = {
                    id: Date.now().toString(),
                    deckId,
                    question,
                    answer,
                    stats: {
                        lastReview: null,
                        dueDate: new Date().toISOString(),
                        interval: 0,
                        ease: 2.5,
                        reviews: 0
                    }
                };

                // Add card to storage
                const cards = JSON.parse(localStorage.getItem('cards') || '[]');
                cards.push(newCard);
                localStorage.setItem('cards', JSON.stringify(cards));

                // Update user stats
                const user = auth.getCurrentUser();
                if (user && user.stats) {
                    auth.updateUserStats({
                        totalCards: (user.stats.totalCards || 0) + 1,
                        learning: (user.stats.learning || 0) + 1
                    });
                }

                // Close add card modal and refresh deck view
                this.closeModal('add-card-modal');
                this.openDeck(deckId);
                this.loadDashboard();
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        // Reset forms when closing modals
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Reset practice modal state
        if (modalId === 'practice-modal') {
            const answerEl = document.getElementById('practice-answer');
            const showAnswerBtn = document.getElementById('show-answer-btn');
            const buttonsEl = document.getElementById('answer-buttons');

            if (answerEl) answerEl.classList.add('hidden');
            if (showAnswerBtn) showAnswerBtn.classList.remove('hidden');
            if (buttonsEl) buttonsEl.classList.add('hidden');
        }
    }

    loadDashboard() {
        // Load decks
        const decks = storage.getDecks();
        const decksContainer = document.getElementById('decks-container');
        if (!decksContainer) return;
        
        decksContainer.innerHTML = '';

        decks.forEach(deck => {
            const cards = storage.getCards(deck.id);
            const dueCards = cards.filter(card => {
                const dueDate = new Date(card.stats.dueDate);
                return dueDate <= new Date();
            });

            const deckEl = document.createElement('div');
            deckEl.className = 'card cursor-pointer hover:bg-dark-lighter transition-colors';
            deckEl.innerHTML = `
                <h3 class="text-xl font-semibold text-light mb-2">${deck.name}</h3>
                <p class="text-secondary mb-4">${deck.description || ''}</p>
                <div class="flex justify-between text-sm">
                    <span class="text-secondary">${cards.length} cards</span>
                    <span class="text-accent">${dueCards.length} due</span>
                </div>
            `;
            deckEl.addEventListener('click', () => this.openDeck(deck.id));
            decksContainer.appendChild(deckEl);
        });

        // Update stats
        this.updateStats();
        
        // Refresh contribution graph
        if (this.contributionGraph) {
            this.contributionGraph.refresh();
        }
    }

    showAllCards(cards) {
        const titleEl = document.getElementById('deck-view-title');
        const container = document.getElementById('deck-cards-container');
        if (!titleEl || !container) return;

        titleEl.textContent = 'All Cards';
        container.innerHTML = '';

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'bg-dark/50 rounded-lg p-4 border border-secondary/20 mb-4';
            cardEl.innerHTML = `
                <pre class="text-light font-mono mb-4 overflow-x-auto">${card.question}</pre>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-secondary">
                        Last review: ${card.stats.lastReview ? new Date(card.stats.lastReview).toLocaleDateString() : 'Never'}
                    </div>
                    <div class="text-sm text-accent">
                        Due: ${new Date(card.stats.dueDate).toLocaleDateString()}
                    </div>
                </div>
            `;
            container.appendChild(cardEl);
        });
    }

    exportConfiguration() {
        const config = {
            decks: storage.getDecks(),
            cards: storage.getCards(),
            user: auth.getCurrentUser()
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recode-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importConfiguration(file) {
        try {
            const text = await file.text();
            const config = JSON.parse(text);

            // Validate configuration
            if (!config.decks || !config.cards || !config.user) {
                throw new Error('Invalid configuration file');
            }

            // Import configuration
            localStorage.setItem('decks', JSON.stringify(config.decks));
            localStorage.setItem('cards', JSON.stringify(config.cards));
            
            // Update user configuration
            if (!auth.updateUserConfig(config.user)) {
                throw new Error('Failed to update user configuration');
            }

            // Refresh UI
            this.loadDashboard();
            this.updateStats();
            if (this.contributionGraph) {
                this.contributionGraph.refresh();
            }
            
            alert('Configuration imported successfully!');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import configuration. Please check the file format.');
        }
    }

    openDeck(deckId) {
        const deck = storage.getDeck(deckId);
        if (!deck) return;

        // Show deck view modal
        const modal = document.getElementById('deck-view-modal');
        modal.classList.remove('hidden');

        // Update modal content
        document.getElementById('deck-view-title').textContent = deck.name;
        
        // Store current deck ID for adding cards
        document.getElementById('add-card-deck-id').value = deck.id;
        
        // Load cards
        const cards = storage.getCards(deckId);
        const cardsContainer = document.getElementById('deck-cards-container');
        cardsContainer.innerHTML = '';

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'bg-dark/50 rounded-lg p-4 border border-secondary/20 mb-4';
            cardEl.innerHTML = `
                <pre class="text-light font-mono mb-4 overflow-x-auto">${card.question}</pre>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-secondary">
                        Last review: ${card.stats.lastReview ? new Date(card.stats.lastReview).toLocaleDateString() : 'Never'}
                    </div>
                    <div class="text-sm text-accent">
                        Due: ${new Date(card.stats.dueDate).toLocaleDateString()}
                    </div>
                </div>
            `;
            cardsContainer.appendChild(cardEl);
        });

        // Setup add card button
        const addCardBtn = document.getElementById('add-card-btn');
        if (addCardBtn) {
            addCardBtn.onclick = () => {
                this.openModal('add-card-modal');
            };
        }
    }

    startPractice(cards) {
        let currentCardIndex = 0;
        const shuffledCards = this.shuffleArray(cards);

        const practiceModal = document.getElementById('practice-modal');
        const questionContainer = document.getElementById('practice-question');
        const answerContainer = document.getElementById('practice-answer');
        const showAnswerBtn = document.getElementById('show-answer-btn');
        const answerButtons = document.getElementById('answer-buttons');
        
        const showNextCard = () => {
            if (currentCardIndex >= shuffledCards.length) {
                practiceModal.classList.add('hidden');
                this.loadDashboard();
                return;
            }

            const card = shuffledCards[currentCardIndex];
            questionContainer.innerHTML = `<pre class="text-light font-mono">${card.question}</pre>`;
            answerContainer.innerHTML = `<pre class="text-light font-mono">${card.answer}</pre>`;
            answerContainer.classList.add('hidden');
            showAnswerBtn.classList.remove('hidden');
            answerButtons.classList.add('hidden');
        };

        showAnswerBtn.addEventListener('click', () => {
            answerContainer.classList.remove('hidden');
            showAnswerBtn.classList.add('hidden');
            answerButtons.classList.remove('hidden');
        });

        const handleAnswer = (quality) => {
            const card = shuffledCards[currentCardIndex];
            storage.updateCardProgress(card.id, { quality });
            storage.updatePracticeStreak();
            currentCardIndex++;
            showNextCard();
        };

        // Set up answer buttons
        document.querySelectorAll('[data-answer-quality]').forEach(btn => {
            btn.addEventListener('click', () => {
                const quality = parseInt(btn.dataset.answerQuality);
                handleAnswer(quality);
            });
        });

        practiceModal.classList.remove('hidden');
        showNextCard();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 