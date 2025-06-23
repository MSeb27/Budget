// ===== STORAGE FUNCTIONS =====
const STORAGE_KEY = 'budget-calendar-data';
const FIXED_EXPENSES_KEY = 'budget-fixed-expenses';

function loadTransactions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        return [];
    }
}

function saveTransactions(transactions) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        return false;
    }
}

function loadFixedExpenses() {
    try {
        const data = localStorage.getItem(FIXED_EXPENSES_KEY);
        return data ? JSON.parse(data) : {
            loyer: 0,
            edf: 0,
            internet: 0,
            credit: 0,
            autres: 0
        };
    } catch (error) {
        console.error("Erreur lors du chargement des dépenses fixes:", error);
        return { loyer: 0, edf: 0, internet: 0, credit: 0, autres: 0 };
    }
}

function saveFixedExpenses(fixedExpenses) {
    try {
        localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(fixedExpenses));
        return true;
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des dépenses fixes:", error);
        return false;
    }
}

// ===== MAIN APPLICATION CLASS =====
class BudgetCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.transactions = loadTransactions();
        this.fixedExpenses = loadFixedExpenses();
        this.filteredTransactions = [];
        this.charts = {};
        this.chartsInitialized = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setDefaultDate();
        this.loadFixedExpensesValues();
        this.updateCalendar();
        this.updateTransactionsList();
        
        // Initialize charts after a small delay to ensure Chart.js is loaded
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    // ===== INITIALIZATION =====
    initializeElements() {
        this.elements = {
            // Form elements
            form: document.getElementById('transaction-form'),
            label: document.getElementById('label'),
            amount: document.getElementById('amount'),
            category: document.getElementById('category'),
            date: document.getElementById('date'),
            typeExpense: document.getElementById('type-expense'),
            typeIncome: document.getElementById('type-income'),
            errorMessage: document.getElementById('error-message'),
            
            // Calendar elements
            prevMonth: document.getElementById('prev-month'),
            nextMonth: document.getElementById('next-month'),
            monthYear: document.getElementById('month-year'),
            calendarGrid: document.getElementById('calendar-grid'),
            
            // Summary elements
            monthIncome: document.getElementById('month-income'),
            monthExpenses: document.getElementById('month-expenses'),
            monthBalance: document.getElementById('month-balance'),
            totalBalance: document.getElementById('total-balance'),
            
            // Transactions elements
            transactionsTitle: document.getElementById('transactions-title'),
            selectedDayInfo: document.getElementById('selected-day-info'),
            transactionsList: document.getElementById('transactions-list'),
            noTransactions: document.getElementById('no-transactions'),
            
            // Fixed expenses elements
            fixedLoyer: document.getElementById('fixed-loyer'),
            fixedEdf: document.getElementById('fixed-edf'),
            fixedInternet: document.getElementById('fixed-internet'),
            fixedCredit: document.getElementById('fixed-credit'),
            fixedAutres: document.getElementById('fixed-autres'),
            fixedTotal: document.getElementById('fixed-total'),
            
            // Tab elements
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Settings elements
            exportBtn: document.getElementById('export-data'),
            importBtn: document.getElementById('import-data'),
            importFile: document.getElementById('import-file'),
            clearBtn: document.getElementById('clear-data')
        };
    }

    // ===== TAB NAVIGATION =====
    setupTabNavigation() {
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Remove active class from all buttons and contents
        this.elements.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.elements.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected button and content
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`tab-${tabName}`);
        
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
            
            // Update charts if switching to analytics tab
            if (tabName === 'analytics' && this.chartsInitialized) {
                // Small delay to ensure tab is visible before updating charts
                setTimeout(() => {
                    this.updateCharts();
                }, 100);
            }
        }
    }

    setupEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Calendar navigation
        this.elements.prevMonth.addEventListener('click', () => this.previousMonth());
        this.elements.nextMonth.addEventListener('click', () => this.nextMonth());
        
        // Fixed expenses listeners
        this.elements.fixedLoyer.addEventListener('input', () => this.updateFixedExpenses());
        this.elements.fixedEdf.addEventListener('input', () => this.updateFixedExpenses());
        this.elements.fixedInternet.addEventListener('input', () => this.updateFixedExpenses());
        this.elements.fixedCredit.addEventListener('input', () => this.updateFixedExpenses());
        this.elements.fixedAutres.addEventListener('input', () => this.updateFixedExpenses());
        
        // Settings listeners
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.importBtn.addEventListener('click', () => this.elements.importFile.click());
        this.elements.importFile.addEventListener('change', (e) => this.importData(e));
        this.elements.clearBtn.addEventListener('click', () => this.clearAllData());
    }

    // ===== UTILITY METHODS =====
    setDefaultDate() {
        const today = new Date();
        this.elements.date.valueAsDate = today;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ===== FIXED EXPENSES METHODS =====
    loadFixedExpensesValues() {
        this.elements.fixedLoyer.value = this.fixedExpenses.loyer || '';
        this.elements.fixedEdf.value = this.fixedExpenses.edf || '';
        this.elements.fixedInternet.value = this.fixedExpenses.internet || '';
        this.elements.fixedCredit.value = this.fixedExpenses.credit || '';
        this.elements.fixedAutres.value = this.fixedExpenses.autres || '';
        this.updateFixedExpensesTotal();
    }

    updateFixedExpenses() {
        this.fixedExpenses = {
            loyer: parseFloat(this.elements.fixedLoyer.value) || 0,
            edf: parseFloat(this.elements.fixedEdf.value) || 0,
            internet: parseFloat(this.elements.fixedInternet.value) || 0,
            credit: parseFloat(this.elements.fixedCredit.value) || 0,
            autres: parseFloat(this.elements.fixedAutres.value) || 0
        };
        
        saveFixedExpenses(this.fixedExpenses);
        this.updateFixedExpensesTotal();
    }

    updateFixedExpensesTotal() {
        const total = Object.values(this.fixedExpenses).reduce((sum, val) => sum + val, 0);
        this.elements.fixedTotal.textContent = `${total.toFixed(2)} €`;
    }

    // ===== TRANSACTION METHODS =====
    handleSubmit(e) {
        e.preventDefault();
        this.elements.errorMessage.textContent = '';

        const transaction = {
            id: Date.now(),
            label: this.elements.label.value.trim(),
            amount: parseFloat(this.elements.amount.value),
            category: this.elements.category.value,
            date: this.elements.date.value,
            type: this.elements.typeExpense.checked ? 'expense' : 'income'
        };

        const error = this.validateTransaction(transaction);
        if (error) {
            this.elements.errorMessage.textContent = error;
            return;
        }

        this.transactions.push(transaction);
        if (saveTransactions(this.transactions)) {
            this.resetForm();
            this.updateCalendar();
            this.updateTransactionsList();
            if (this.chartsInitialized) {
                this.updateCharts();
            }
        } else {
            this.elements.errorMessage.textContent = "Erreur lors de la sauvegarde";
        }
    }

    validateTransaction(transaction) {
        if (!transaction.label) return "Le libellé est obligatoire";
        if (isNaN(transaction.amount) || transaction.amount <= 0) return "Le montant doit être positif";
        if (!transaction.category) return "Veuillez sélectionner une catégorie";
        if (!transaction.date) return "La date est obligatoire";
        return null;
    }

    resetForm() {
        this.elements.form.reset();
        this.elements.typeExpense.checked = true; // Dépense par défaut
        this.setDefaultDate();
    }

    deleteTransaction(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            saveTransactions(this.transactions);
            this.updateCalendar();
            this.updateTransactionsList();
            if (this.chartsInitialized) {
                this.updateCharts();
            }
        }
    }

    // ===== CALENDAR METHODS =====
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.selectedDate = null;
        this.updateCalendar();
        this.updateTransactionsList();
        if (this.chartsInitialized) {
            this.updateCharts();
        }
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDate = null;
        this.updateCalendar();
        this.updateTransactionsList();
        if (this.chartsInitialized) {
            this.updateCharts();
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        this.elements.date.value = this.formatDateString(date);
        this.updateCalendar();
        this.updateTransactionsList();
    }

    updateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update header
        this.elements.monthYear.textContent = this.currentDate.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
        });

        // Clear calendar
        this.elements.calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day day-header';
            dayHeader.textContent = day;
            this.elements.calendarGrid.appendChild(dayHeader);
        });

        // Calendar logic
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0

        // Previous month days
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            this.createCalendarDay(day, month - 1, year, true);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            this.createCalendarDay(day, month, year, false);
        }

        // Next month days
        const totalCells = this.elements.calendarGrid.children.length - 7; // Minus headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days - headers
        for (let day = 1; day <= remainingCells; day++) {
            this.createCalendarDay(day, month + 1, year, true);
        }

        this.updateMonthlySummary();
        this.updateTotalBalance();
    }

    createCalendarDay(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        const dayDate = new Date(year, month, day);
        const dateString = this.formatDateString(dayDate);
        
        // Check if it's today
        const today = new Date();
        if (this.isSameDate(dayDate, today)) {
            dayElement.classList.add('today');
        }

        // Check if it's selected
        if (this.selectedDate && this.isSameDate(dayDate, this.selectedDate)) {
            dayElement.classList.add('selected');
        }

        // Day content
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Get transactions for this day
        const dayTransactions = this.transactions.filter(t => t.date === dateString);
        
        if (dayTransactions.length > 0) {
            const transactionsContainer = document.createElement('div');
            transactionsContainer.className = 'day-transactions';

            // Show first few transactions
            dayTransactions.slice(0, 2).forEach(transaction => {
                const indicator = document.createElement('div');
                indicator.className = `transaction-indicator ${transaction.type === 'income' ? 'income' : 'expense'}`;
                indicator.textContent = transaction.label;
                indicator.title = `${transaction.label}: ${transaction.amount.toFixed(2)}€`;
                transactionsContainer.appendChild(indicator);
            });

            if (dayTransactions.length > 2) {
                const more = document.createElement('div');
                more.className = 'transaction-indicator';
                more.textContent = `+${dayTransactions.length - 2} autres`;
                more.style.background = '#6c757d';
                transactionsContainer.appendChild(more);
            }

            dayElement.appendChild(transactionsContainer);

            // Day total
            const total = dayTransactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            const totalElement = document.createElement('div');
            totalElement.className = `day-total ${total >= 0 ? 'positive' : 'negative'}`;
            totalElement.textContent = `${total >= 0 ? '+' : ''}${total.toFixed(0)}€`;
            dayElement.appendChild(totalElement);
        }

        // Click handler
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                this.selectDate(dayDate);
            }
        });

        this.elements.calendarGrid.appendChild(dayElement);
    }

    // ===== SUMMARY METHODS =====
    updateMonthlySummary() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthTransactions = this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month;
        });

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        this.elements.monthIncome.textContent = `${income.toFixed(2)} €`;
        this.elements.monthExpenses.textContent = `${expenses.toFixed(2)} €`;
        this.elements.monthBalance.textContent = `${balance.toFixed(2)} €`;

        // Update balance color
        this.elements.monthBalance.className = `amount balance ${balance >= 0 ? 'positive' : 'negative'}`;
    }

    updateTotalBalance() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalBalance = totalIncome - totalExpenses;

        this.elements.totalBalance.textContent = `${totalBalance.toFixed(2)} €`;
        this.elements.totalBalance.className = `amount total-balance ${totalBalance >= 0 ? 'positive' : 'negative'}`;
    }

    // ===== TRANSACTIONS LIST METHODS =====
    updateTransactionsList() {
        let transactionsToShow;
        let title;

        if (this.selectedDate) {
            const dateString = this.formatDateString(this.selectedDate);
            transactionsToShow = this.transactions.filter(t => t.date === dateString);
            title = `📋 Transactions du ${this.selectedDate.toLocaleDateString('fr-FR')}`;
            this.elements.selectedDayInfo.textContent = `Jour sélectionné: ${this.selectedDate.toLocaleDateString('fr-FR')}`;
        } else {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            transactionsToShow = this.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getFullYear() === year && tDate.getMonth() === month;
            });
            title = `📋 Transactions de ${this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
            this.elements.selectedDayInfo.textContent = '';
        }

        this.elements.transactionsTitle.textContent = title;
        this.elements.transactionsList.innerHTML = '';

        if (transactionsToShow.length === 0) {
            this.elements.noTransactions.style.display = 'block';
            return;
        }

        this.elements.noTransactions.style.display = 'none';

        // Sort by date (newest first)
        transactionsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactionsToShow.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = `transaction-row ${transaction.type === 'income' ? 'income' : 'expense'}`;
            
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                <td>${transaction.label}</td>
                <td>${transaction.category}</td>
                <td>${transaction.amount.toFixed(2)} €</td>
                <td>${transaction.type === 'income' ? '💰 Revenu' : '💸 Dépense'}</td>
                <td>
                    <button class="btn-danger" onclick="calendar.deleteTransaction(${transaction.id})">
                        🗑️ Supprimer
                    </button>
                </td>
            `;
            
            this.elements.transactionsList.appendChild(row);
        });
    }

    // ===== CHARTS METHODS =====
    initializeCharts() {
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded yet, retrying...');
            setTimeout(() => this.initializeCharts(), 200);
            return;
        }
        
        // Vérifier si Plotly est chargé pour les graphiques 3D
        if (typeof Plotly === 'undefined') {
            console.log('Plotly.js not loaded yet, retrying...');
            setTimeout(() => this.initializeCharts(), 200);
            return;
        }
        
        try {
            this.createCategoryChart();
            this.createBudgetChart();
            this.create3DCharts();
            
            this.chartsInitialized = true;
            this.updateCharts();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    updateCharts() {
        if (!this.chartsInitialized) return;
        
        try {
            this.updateCategoryChart();
            this.updateBudgetChart();
            this.update3DCharts();
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    createCategoryChart() {
        this.charts.category = { initialized: true };
    }

    updateCategoryChart() {
        const container = document.getElementById('categoryChart');
        if (!container) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthExpenses = this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && 
                   tDate.getMonth() === month && 
                   t.type === 'expense';
        });

        const categoryTotals = {};
        monthExpenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

        const colors = [
            '#FF4757', '#3742FA', '#2ED573', '#FFA502', '#FF6B35',
            '#7209B7', '#FF3838', '#FF9F43', '#10AC84', '#EE5A52'
        ];

        let html = '';
        
        if (sortedCategories.length === 0) {
            html = '<div style="text-align: center; color: #6c757d; padding: 40px;">Aucune dépense ce mois-ci</div>';
        } else {
            sortedCategories.forEach(([category, amount], index) => {
                const percentage = ((amount / total) * 100).toFixed(1);
                const color = colors[index % colors.length];
                
                const maxDots = 20;
                const dotCount = Math.max(1, Math.round((amount / total) * maxDots));
                
                let dots = '';
                for (let i = 0; i < dotCount; i++) {
                    dots += `<div class="category-dot" style="background-color: ${color}"></div>`;
                }
                
                html += `
                    <div class="category-item">
                        <div class="category-number">${String(index + 1).padStart(2, '0')}</div>
                        <div class="category-name">${category}</div>
                        <div class="category-dots">${dots}</div>
                        <div class="category-amount">${amount.toFixed(2)}€</div>
                        <div class="category-percentage">${percentage}%</div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    createBudgetChart() {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        this.charts.budget = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Solde fin de mois',
                    data: [],
                    backgroundColor: 'rgba(55, 66, 250, 0.1)',
                    borderColor: '#3742FA',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#3742FA',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `Solde: ${value >= 0 ? '+' : ''}${value.toFixed(2)}€`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value >= 0 ? '+' : '') + value + '€';
                            },
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    updateBudgetChart() {
        if (!this.charts.budget) return;
        
        const budgetData = this.getBudgetData();
        
        this.charts.budget.data.labels = budgetData.labels;
        this.charts.budget.data.datasets[0].data = budgetData.cumulativeBalance;
        
        // Couleurs dynamiques selon les valeurs positives/négatives
        const pointColors = budgetData.cumulativeBalance.map(value => value >= 0 ? '#3742FA' : '#FF4757');
        const borderColors = budgetData.cumulativeBalance.map(value => value >= 0 ? '#3742FA' : '#FF4757');
        
        this.charts.budget.data.datasets[0].pointBackgroundColor = pointColors;
        this.charts.budget.data.datasets[0].borderColor = '#3742FA';
        
        this.charts.budget.update();
    }

    getBudgetData() {
        const now = new Date();
        const months = [];
        
        // Générer les 12 derniers mois
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                key: monthKey,
                label: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                income: 0,
                expenses: 0,
                balance: 0
            });
        }

        // Calculer les totaux par mois
        this.transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            const monthData = months.find(m => m.key === monthKey);
            if (monthData) {
                if (t.type === 'income') {
                    monthData.income += t.amount;
                } else {
                    monthData.expenses += t.amount;
                }
                monthData.balance = monthData.income - monthData.expenses;
            }
        });

        // Calculer le solde cumulé (solde fin de mois)
        let cumulativeBalance = 0;
        const cumulativeBalances = months.map(month => {
            cumulativeBalance += month.balance;
            return cumulativeBalance;
        });

        return {
            labels: months.map(m => m.label),
            cumulativeBalance: cumulativeBalances
        };
    }

    // ===== 3D CHARTS METHODS =====
    create3DCharts() {
        // Initialiser les conteneurs 3D
        this.charts.categories3D = { initialized: true };
        this.charts.temporal3D = { initialized: true };
    }

    update3DCharts() {
        this.update3DCategoriesChart();
        this.updateTemporal3DChart();
    }

    update3DCategoriesChart() {
        const container = document.getElementById('categories3DChart');
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthExpenses = this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && 
                   tDate.getMonth() === month && 
                   t.type === 'expense';
        });

        const categoryTotals = {};
        monthExpenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 pour un meilleur effet arc-en-ciel

        if (sortedCategories.length === 0) {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #6c757d; font-style: italic;">Aucune dépense ce mois-ci</div>';
            return;
        }

        const categories = sortedCategories.map(([cat]) => cat);
        const amounts = sortedCategories.map(([,amount]) => amount);
        
        // Création d'un dégradé arc-en-ciel pour les barres
        const rainbowColors = this.generateRainbowColors(categories.length);

        const data = [{
            x: categories,
            y: amounts,
            z: categories.map(() => 0), // Position Z pour l'effet 3D
            type: 'bar3d',
            marker: {
                color: rainbowColors,
                opacity: 0.9,
                line: {
                    color: 'rgba(0,0,0,0.2)',
                    width: 1
                },
                // Effet de dégradé sur chaque barre
                colorscale: 'Viridis'
            },
            text: amounts.map(amount => `${amount.toFixed(2)}€`),
            textposition: 'auto',
            textfont: {
                color: 'white',
                size: 11,
                family: 'Segoe UI, sans-serif',
                weight: 'bold'
            }
        }];

        const layout = {
            title: {
                text: `Dépenses du mois - Style Arc-en-ciel (${amounts.reduce((a, b) => a + b, 0).toFixed(2)}€ total)`,
                font: { size: 14, color: '#495057', weight: 'bold' }
            },
            scene: {
                xaxis: { 
                    title: 'Catégories', 
                    titlefont: { color: '#495057', size: 12 },
                    tickfont: { color: '#495057', size: 10 },
                    backgroundcolor: 'rgba(0,0,0,0.02)',
                    gridcolor: 'rgba(0,0,0,0.1)',
                    showbackground: true
                },
                yaxis: { 
                    title: 'Montant (€)', 
                    titlefont: { color: '#495057', size: 12 },
                    tickfont: { color: '#495057', size: 10 },
                    backgroundcolor: 'rgba(0,0,0,0.02)',
                    gridcolor: 'rgba(0,0,0,0.1)',
                    showbackground: true
                },
                zaxis: {
                    title: '',
                    showticklabels: false,
                    showgrid: false,
                    zeroline: false,
                    backgroundcolor: 'rgba(0,0,0,0)',
                    range: [-1, 1]
                },
                camera: {
                    eye: { x: 1.8, y: 1.8, z: 1.5 },
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 0, z: 1 }
                },
                bgcolor: 'rgba(248, 249, 250, 0.8)',
                aspectmode: 'manual',
                aspectratio: { x: 1, y: 0.8, z: 0.6 }
            },
            margin: { l: 0, r: 0, b: 40, t: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Segoe UI, sans-serif', color: '#495057' }
        };

        const config = {
            displayModeBar: true,
            modeBarButtons: [['zoom3d', 'pan3d', 'orbitRotation', 'resetCameraDefault3d']],
            displaylogo: false,
            responsive: true
        };

        // Utiliser scatter3d avec des barres personnalisées pour un meilleur effet 3D
        const enhancedData = this.create3DBarData(categories, amounts, rainbowColors);

        Plotly.newPlot(container, enhancedData, layout, config);
    }

    // Fonction pour générer des couleurs arc-en-ciel
    generateRainbowColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i / count) * 360; // Répartition sur 360 degrés
            const saturation = 85; // Saturation élevée pour des couleurs vives
            const lightness = 60;  // Luminosité équilibrée
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }

    // Création de barres 3D personnalisées avec effet de profondeur
    create3DBarData(categories, amounts, colors) {
        const data = [];
        const maxAmount = Math.max(...amounts);

        categories.forEach((category, index) => {
            const amount = amounts[index];
            const color = colors[index];
            const height = amount;
            const barWidth = 0.6;
            const barDepth = 0.6;

            // Face avant de la barre
            data.push({
                type: 'mesh3d',
                x: [index - barWidth/2, index + barWidth/2, index + barWidth/2, index - barWidth/2],
                y: [0, 0, height, height],
                z: [barDepth/2, barDepth/2, barDepth/2, barDepth/2],
                i: [0, 0],
                j: [1, 2], 
                k: [2, 3],
                facecolor: [color, color],
                opacity: 0.9,
                showscale: false,
                hovertemplate: `${category}<br>${amount.toFixed(2)}€<extra></extra>`
            });

            // Face du dessus de la barre (plus claire)
            const topColor = this.lightenColor(color, 20);
            data.push({
                type: 'mesh3d',
                x: [index - barWidth/2, index + barWidth/2, index + barWidth/2, index - barWidth/2],
                y: [height, height, height, height],
                z: [-barDepth/2, -barDepth/2, barDepth/2, barDepth/2],
                i: [0, 0],
                j: [1, 2],
                k: [2, 3],
                facecolor: [topColor, topColor],
                opacity: 0.95,
                showscale: false,
                hovertemplate: `${category}<br>${amount.toFixed(2)}€<extra></extra>`
            });

            // Face droite de la barre (plus sombre)
            const sideColor = this.darkenColor(color, 15);
            data.push({
                type: 'mesh3d',
                x: [index + barWidth/2, index + barWidth/2, index + barWidth/2, index + barWidth/2],
                y: [0, height, height, 0],
                z: [-barDepth/2, -barDepth/2, barDepth/2, barDepth/2],
                i: [0, 0],
                j: [1, 2],
                k: [2, 3],
                facecolor: [sideColor, sideColor],
                opacity: 0.85,
                showscale: false,
                hovertemplate: `${category}<br>${amount.toFixed(2)}€<extra></extra>`
            });
        });

        return data;
    }

    // Fonctions utilitaires pour les couleurs
    lightenColor(color, percent) {
        return this.adjustColorBrightness(color, percent);
    }

    darkenColor(color, percent) {
        return this.adjustColorBrightness(color, -percent);
    }

    adjustColorBrightness(color, percent) {
        // Conversion HSL simple pour ajuster la luminosité
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
            const h = parseInt(hslMatch[1]);
            const s = parseInt(hslMatch[2]);
            let l = parseInt(hslMatch[3]);
            l = Math.max(0, Math.min(100, l + percent));
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        return color;
    }

    updateTemporal3DChart() {
        const container = document.getElementById('temporal3DChart');
        if (!container) return;

        // Générer les 6 derniers mois
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                label: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                year: date.getFullYear(),
                month: date.getMonth()
            });
        }

        // Obtenir toutes les catégories d'expenses
        const allCategories = [...new Set(
            this.transactions
                .filter(t => t.type === 'expense')
                .map(t => t.category)
        )];

        // Créer la matrice de données
        const dataMatrix = [];
        const monthLabels = [];
        const categoryLabels = [];

        months.forEach((monthData, monthIndex) => {
            monthLabels.push(monthData.label);
            
            allCategories.forEach((category, catIndex) => {
                if (monthIndex === 0) {
                    categoryLabels.push(category);
                }

                const monthExpenses = this.transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === monthData.year && 
                           tDate.getMonth() === monthData.month && 
                           t.type === 'expense' &&
                           t.category === category;
                });

                const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
                
                dataMatrix.push({
                    x: monthIndex,
                    y: catIndex, 
                    z: total,
                    month: monthData.label,
                    category: category,
                    amount: total
                });
            });
        });

        // Préparer les données pour le graphique 3D surface
        const x = monthLabels;
        const y = categoryLabels;
        const z = [];

        // Créer la matrice Z pour la surface
        for (let catIndex = 0; catIndex < categoryLabels.length; catIndex++) {
            const row = [];
            for (let monthIndex = 0; monthIndex < monthLabels.length; monthIndex++) {
                const point = dataMatrix.find(d => d.x === monthIndex && d.y === catIndex);
                row.push(point ? point.z : 0);
            }
            z.push(row);
        }

        const data = [{
            x: x,
            y: y,
            z: z,
            type: 'surface',
            colorscale: [
                [0, '#E3F2FD'],
                [0.2, '#BBDEFB'], 
                [0.4, '#90CAF9'],
                [0.6, '#64B5F6'],
                [0.8, '#2196F3'],
                [1, '#1976D2']
            ],
            showscale: true,
            colorbar: {
                title: 'Montant (€)',
                titlefont: { color: '#495057' },
                tickfont: { color: '#495057' }
            }
        }];

        const layout = {
            title: {
                text: 'Évolution des dépenses par catégorie',
                font: { size: 14, color: '#495057' }
            },
            scene: {
                xaxis: { 
                    title: 'Mois', 
                    titlefont: { color: '#495057' },
                    tickfont: { color: '#495057' }
                },
                yaxis: { 
                    title: 'Catégories', 
                    titlefont: { color: '#495057' },
                    tickfont: { color: '#495057' }
                },
                zaxis: { 
                    title: 'Montant (€)', 
                    titlefont: { color: '#495057' },
                    tickfont: { color: '#495057' }
                },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.2 }
                }
            },
            margin: { l: 0, r: 0, b: 40, t: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Segoe UI, sans-serif', color: '#495057' }
        };

        const config = {
            displayModeBar: true,
            modeBarButtons: [['zoom3d', 'pan3d', 'orbitRotation', 'resetCameraDefault3d']],
            displaylogo: false,
            responsive: true
        };

        Plotly.newPlot(container, data, layout, config);
    }
}

// ===== APPLICATION INITIALIZATION =====
let calendar;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    calendar = new BudgetCalendar();
});

// Expose calendar globally for button callbacks
window.calendar = calendar;