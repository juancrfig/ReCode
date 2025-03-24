import { auth } from './auth.js';

class Storage {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Initialize storage if it doesn't exist
        if (!localStorage.getItem('decks')) {
            localStorage.setItem('decks', '[]');
        }
        if (!localStorage.getItem('cards')) {
            localStorage.setItem('cards', '[]');
        }
    }

    // Deck Management
    createDeck(name, description) {
        const user = auth.getCurrentUser();
        if (!user) return null;

        const deck = {
            id: Date.now().toString(),
            name,
            description,
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const decks = this.getDecks();
        decks.push(deck);
        localStorage.setItem('decks', JSON.stringify(decks));

        return deck;
    }

    getDecks() {
        const user = auth.getCurrentUser();
        if (!user) return [];

        const decks = JSON.parse(localStorage.getItem('decks') || '[]');
        return decks.filter(deck => deck.userId === user.id);
    }

    getDeck(deckId) {
        const decks = this.getDecks();
        return decks.find(deck => deck.id === deckId);
    }

    updateDeck(deckId, { name, description }) {
        const decks = JSON.parse(localStorage.getItem('decks') || '[]');
        const deckIndex = decks.findIndex(d => d.id === deckId);
        
        if (deckIndex === -1) return null;

        decks[deckIndex] = {
            ...decks[deckIndex],
            name,
            description,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('decks', JSON.stringify(decks));
        return decks[deckIndex];
    }

    deleteDeck(deckId) {
        const decks = JSON.parse(localStorage.getItem('decks') || '[]');
        const deckIndex = decks.findIndex(d => d.id === deckId);
        
        if (deckIndex === -1) return false;

        // Delete all cards in the deck
        const cards = this.getCards(deckId);
        cards.forEach(card => this.deleteCard(card.id));

        // Delete the deck
        decks.splice(deckIndex, 1);
        localStorage.setItem('decks', JSON.stringify(decks));

        return true;
    }

    // Card Management
    createCard(deckId, { question, answer, type = 'code', tags = [] }) {
        const user = auth.getCurrentUser();
        if (!user) return null;

        const card = {
            id: Date.now().toString(),
            deckId,
            userId: user.id,
            question,
            answer,
            type,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
                repetitions: 0,
                interval: 0,
                easeFactor: 2.5,
                dueDate: new Date().toISOString(),
                lastReview: null
            }
        };

        const cards = this.getCards();
        cards.push(card);
        localStorage.setItem('cards', JSON.stringify(cards));

        // Update user stats
        const userStats = user.stats || {};
        auth.updateUserStats({
            totalCards: (userStats.totalCards || 0) + 1,
            learning: (userStats.learning || 0) + 1
        });

        return card;
    }

    getCards(deckId = null) {
        const user = auth.getCurrentUser();
        if (!user) return [];

        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const userCards = cards.filter(card => card.userId === user.id);
        
        return deckId 
            ? userCards.filter(card => card.deckId === deckId)
            : userCards;
    }

    getDueCards() {
        const cards = this.getCards();
        const now = new Date().toISOString();
        return cards.filter(card => card.stats.dueDate <= now);
    }

    updateCardProgress(cardId, { quality, date = new Date() }) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const cardIndex = cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return null;

        const card = cards[cardIndex];
        const stats = card.stats;
        
        // SM-2 Algorithm implementation
        if (quality >= 3) {
            if (stats.repetitions === 0) {
                stats.interval = 1;
            } else if (stats.repetitions === 1) {
                stats.interval = 6;
            } else {
                stats.interval = Math.round(stats.interval * stats.easeFactor);
            }
            stats.repetitions++;
        } else {
            stats.repetitions = 0;
            stats.interval = 0;
        }

        // Update ease factor
        stats.easeFactor = Math.max(1.3, stats.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        
        // Calculate next due date
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + stats.interval);
        stats.dueDate = dueDate.toISOString();
        stats.lastReview = date.toISOString();

        // Save updated card
        cards[cardIndex] = {
            ...card,
            stats,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('cards', JSON.stringify(cards));

        // Update user stats if card is mastered (interval > 30 days)
        if (stats.interval >= 30) {
            const user = auth.getCurrentUser();
            const userStats = user.stats || {};
            auth.updateUserStats({
                mastered: (userStats.mastered || 0) + 1,
                learning: Math.max(0, (userStats.learning || 0) - 1)
            });
        }

        return cards[cardIndex];
    }

    deleteCard(cardId) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const cardIndex = cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return false;

        cards.splice(cardIndex, 1);
        localStorage.setItem('cards', JSON.stringify(cards));

        // Update user stats
        const user = auth.getCurrentUser();
        const userStats = user.stats || {};
        auth.updateUserStats({
            totalCards: Math.max(0, (userStats.totalCards || 0) - 1),
            learning: Math.max(0, (userStats.learning || 0) - 1)
        });

        return true;
    }

    updateCard(cardId, { question, answer }) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const cardIndex = cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return null;

        cards[cardIndex] = {
            ...cards[cardIndex],
            question,
            answer,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('cards', JSON.stringify(cards));
        return cards[cardIndex];
    }

    // Practice Stats
    updatePracticeStreak() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const stats = user.stats || {};
        const lastPractice = stats.lastPractice ? new Date(stats.lastPractice) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!lastPractice) {
            // First practice
            auth.updateUserStats({
                streak: 1,
                lastPractice: today.toISOString()
            });
        } else {
            const lastPracticeDay = new Date(lastPractice);
            lastPracticeDay.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today - lastPracticeDay) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutive day
                auth.updateUserStats({
                    streak: (stats.streak || 0) + 1,
                    lastPractice: today.toISOString()
                });
            } else if (diffDays > 1) {
                // Streak broken
                auth.updateUserStats({
                    streak: 1,
                    lastPractice: today.toISOString()
                });
            }
        }
    }
}

export const storage = new Storage(); 