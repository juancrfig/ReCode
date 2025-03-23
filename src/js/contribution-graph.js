import { auth } from './auth.js';
import { storage } from './storage.js';

export class ContributionGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initialize();
    }

    initialize() {
        if (!this.container) return;
        this.refresh();
    }

    refresh() {
        if (!this.container) return;
        
        // Clear existing content
        this.container.innerHTML = '';

        // Create graph structure
        const graphContainer = document.createElement('div');
        graphContainer.className = 'relative';

        // Add month labels
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'flex text-xs text-secondary mb-1 pl-8';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(month => {
            const monthEl = document.createElement('div');
            monthEl.className = 'w-12 text-center';
            monthEl.textContent = month;
            monthsContainer.appendChild(monthEl);
        });
        graphContainer.appendChild(monthsContainer);

        // Create graph grid
        const gridContainer = document.createElement('div');
        gridContainer.className = 'flex';

        // Add day labels
        const daysContainer = document.createElement('div');
        daysContainer.className = 'flex flex-col justify-between text-xs text-secondary pr-2 py-1';
        ['Mon', 'Wed', 'Fri'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            daysContainer.appendChild(dayEl);
        });
        gridContainer.appendChild(daysContainer);

        // Generate contribution cells
        const cellsContainer = document.createElement('div');
        cellsContainer.className = 'grid grid-flow-col gap-1';
        cellsContainer.style.gridTemplateRows = 'repeat(7, 1fr)';

        // Get user's review history
        const user = auth.getCurrentUser();
        const cards = storage.getCards();
        const reviewMap = new Map();

        // Count reviews per day
        cards.forEach(card => {
            if (card.stats.lastReview) {
                const date = new Date(card.stats.lastReview);
                const dateKey = date.toISOString().split('T')[0];
                reviewMap.set(dateKey, (reviewMap.get(dateKey) || 0) + 1);
            }
        });

        // Generate cells for the past year
        const today = new Date();
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);

        for (let d = yearAgo; d <= today; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const reviews = reviewMap.get(dateKey) || 0;
            const level = this.getContributionLevel(reviews);

            const cell = document.createElement('div');
            cell.className = `contribution-cell contribution-level-${level}`;
            
            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'contribution-tooltip';
            tooltip.textContent = `${reviews} reviews on ${d.toLocaleDateString()}`;
            cell.appendChild(tooltip);

            cellsContainer.appendChild(cell);
        }

        gridContainer.appendChild(cellsContainer);
        graphContainer.appendChild(gridContainer);
        this.container.appendChild(graphContainer);
    }

    getContributionLevel(reviews) {
        if (reviews === 0) return 0;
        if (reviews <= 5) return 1;
        if (reviews <= 10) return 2;
        if (reviews <= 15) return 3;
        return 4;
    }
} 