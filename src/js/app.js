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

                // Create card using storage method
                const newCard = storage.createCard(deckId, {
                    question,
                    answer,
                    type: 'code'
                });

                if (!newCard) {
                    alert('Failed to create card');
                    return;
                }

                // Close add card modal and refresh views
                this.closeModal('add-card-modal');
                
                // Update all relevant views
                this.openDeck(deckId); // Refresh deck view
                this.loadDashboard(); // Update dashboard stats
                
                // Update practice button if the card is due
                const dueCards = storage.getDueCards();
                const dueCardsEl = document.getElementById('due-cards');
                if (dueCardsEl) {
                    dueCardsEl.textContent = dueCards.length;
                }
            });
        }

        // Edit deck button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'edit-deck-btn') {
                const deckId = document.getElementById('add-card-deck-id').value;
                this.openEditDeckModal(deckId);
            }
        });

        // Edit deck form
        const editDeckForm = document.getElementById('edit-deck-form');
        if (editDeckForm) {
            editDeckForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const deckId = document.getElementById('edit-deck-id').value;
                const name = document.getElementById('edit-deck-name').value;
                const description = document.getElementById('edit-deck-description').value;

                const updatedDeck = storage.updateDeck(deckId, { name, description });
                if (updatedDeck) {
                    this.closeModal('edit-deck-modal');
                    this.openDeck(deckId);
                    this.loadDashboard();
                }
            });
        }

        // Edit card handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-edit-card]')) {
                const cardId = e.target.closest('[data-edit-card]').dataset.editCard;
                this.openEditCardModal(cardId);
            }
        });

        // Edit card form
        const editCardForm = document.getElementById('edit-card-form');
        if (editCardForm) {
            editCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const cardId = document.getElementById('edit-card-id').value;
                const question = document.getElementById('edit-card-question').value;
                const answer = document.getElementById('edit-card-answer').value;

                const updatedCard = storage.updateCard(cardId, { question, answer });
                if (updatedCard) {
                    this.closeModal('edit-card-modal');
                    this.openDeck(updatedCard.deckId);
                }
            });
        }

        // Delete card button
        const deleteCardBtn = document.getElementById('delete-card-btn');
        if (deleteCardBtn) {
            deleteCardBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this card?')) {
                    const cardId = document.getElementById('edit-card-id').value;
                    const card = storage.getCards().find(c => c.id === cardId);
                    if (card && storage.deleteCard(cardId)) {
                        this.closeModal('edit-card-modal');
                        this.openDeck(card.deckId);
                        this.loadDashboard();
                    }
                }
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
                <div class="mb-4">${this.formatCodeBlock(card.question)}</div>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-secondary">
                        Last review: ${card.stats.lastReview ? new Date(card.stats.lastReview).toLocaleDateString() : 'Never'}
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="btn btn-primary btn-sm" data-edit-card="${card.id}">Edit</button>
                        <div class="text-sm text-accent">
                            Due: ${new Date(card.stats.dueDate).toLocaleDateString()}
                        </div>
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

        const modal = document.getElementById('deck-view-modal');
        modal.classList.remove('hidden');

        document.getElementById('deck-view-title').textContent = deck.name;
        document.getElementById('add-card-deck-id').value = deck.id;

        const cards = storage.getCards(deckId);
        const cardsContainer = document.getElementById('deck-cards-container');
        cardsContainer.innerHTML = '';

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'bg-dark/50 rounded-lg p-4 border border-secondary/20 mb-4';
            cardEl.innerHTML = `
                <div class="mb-4">${this.formatCodeBlock(card.question)}</div>
                <div class="mb-4">${this.formatCodeBlock(card.answer)}</div>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-secondary">
                        Last review: ${card.stats.lastReview ? new Date(card.stats.lastReview).toLocaleDateString() : 'Never'}
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="btn btn-primary btn-sm" data-edit-card="${card.id}">Edit</button>
                        <div class="text-sm text-accent">
                            Due: ${new Date(card.stats.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(cardEl);
        });
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
            questionContainer.innerHTML = this.formatCodeBlock(card.question);
            answerContainer.innerHTML = this.formatCodeBlock(card.answer);
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

    openEditDeckModal(deckId) {
        const deck = storage.getDeck(deckId);
        if (!deck) return;

        document.getElementById('edit-deck-id').value = deck.id;
        document.getElementById('edit-deck-name').value = deck.name;
        document.getElementById('edit-deck-description').value = deck.description || '';

        this.openModal('edit-deck-modal');
    }

    openEditCardModal(cardId) {
        const cards = storage.getCards();
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        document.getElementById('edit-card-id').value = card.id;
        document.getElementById('edit-card-question').value = card.question;
        document.getElementById('edit-card-answer').value = card.answer;

        this.openModal('edit-card-modal');
    }

    // Update the card display methods to handle code blocks
    formatCodeBlock(text) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        return text.replace(codeBlockRegex, (match, language, code) => {
            const lang = language || 'plaintext';
            const highlightedCode = Prism.highlight(
                code.trim(),
                Prism.languages[lang] || Prism.languages.plaintext,
                lang
            );
            return `<pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre>`;
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 