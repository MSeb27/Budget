// ===== CALENDAR MANAGER =====
class CalendarManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.elements = {};
        this.onDateSelect = null;
        this.onMonthChange = null;
    }

    // ===== INITIALIZATION =====
    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        this.updateCalendar();
    }

    setCallbacks(onDateSelect = null, onMonthChange = null) {
        this.onDateSelect = onDateSelect;
        this.onMonthChange = onMonthChange;
    }

    setupEventListeners() {
        if (this.elements.prevMonth) {
            this.elements.prevMonth.addEventListener('click', () => this.previousMonth());
        }
        
        if (this.elements.nextMonth) {
            this.elements.nextMonth.addEventListener('click', () => this.nextMonth());
        }
    }

    // ===== NAVIGATION =====
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.selectedDate = null;
        this.updateCalendar();
        this.triggerMonthChange();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDate = null;
        this.updateCalendar();
        this.triggerMonthChange();
    }

    goToMonth(year, month) {
        this.currentDate = new Date(year, month, 1);
        this.selectedDate = null;
        this.updateCalendar();
        this.triggerMonthChange();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.updateCalendar();
        this.triggerDateSelect();
        this.triggerMonthChange();
    }

    // ===== DATE SELECTION =====
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.updateCalendar();
        this.triggerDateSelect();
    }

    clearSelection() {
        this.selectedDate = null;
        this.updateCalendar();
        this.triggerDateSelect();
    }

    // ===== CALENDAR RENDERING =====
    updateCalendar() {
        this.updateHeader();
        this.renderCalendarGrid();
        this.updateSummary();
    }

    updateHeader() {
        if (this.elements.monthYear) {
            this.elements.monthYear.textContent = Utils.formatMonthYear(this.currentDate);
        }
    }

    renderCalendarGrid() {
        if (!this.elements.calendarGrid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Clear calendar
        this.elements.calendarGrid.innerHTML = '';

        // Add day headers
        this.addDayHeaders();

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
    }

    addDayHeaders() {
        const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day day-header';
            dayHeader.textContent = day;
            this.elements.calendarGrid.appendChild(dayHeader);
        });
    }

    createCalendarDay(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        const dayDate = new Date(year, month, day);
        const dateString = Utils.formatDateString(dayDate);
        
        // Check if it's today
        if (Utils.isToday(dayDate)) {
            dayElement.classList.add('today');
        }

        // Check if it's selected
        if (this.selectedDate && Utils.isSameDate(dayDate, this.selectedDate)) {
            dayElement.classList.add('selected');
        }

        // Day content
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Get transactions for this day
        const dayTransactions = this.transactionManager.getTransactionsByDate(dayDate);
        
        if (dayTransactions.length > 0) {
            this.addTransactionIndicators(dayElement, dayTransactions);
            this.addDayTotal(dayElement, dayTransactions);
        }

        // Click handler
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                this.selectDate(dayDate);
            }
        });

        this.elements.calendarGrid.appendChild(dayElement);
    }

    addTransactionIndicators(dayElement, transactions) {
        const transactionsContainer = document.createElement('div');
        transactionsContainer.className = 'day-transactions';

        // Show first few transactions
        transactions.slice(0, 2).forEach(transaction => {
            const indicator = document.createElement('div');
            indicator.className = `transaction-indicator ${transaction.type === 'income' ? 'income' : 'expense'}`;
            indicator.textContent = transaction.label;
            indicator.title = `${transaction.label}: ${Utils.formatCurrency(transaction.amount)}`;
            transactionsContainer.appendChild(indicator);
        });

        if (transactions.length > 2) {
            const more = document.createElement('div');
            more.className = 'transaction-indicator';
            more.textContent = `+${transactions.length - 2} autres`;
            more.style.background = '#6c757d';
            transactionsContainer.appendChild(more);
        }

        dayElement.appendChild(transactionsContainer);
    }

    addDayTotal(dayElement, transactions) {
        const total = transactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

        const totalElement = document.createElement('div');
        totalElement.className = `day-total ${total >= 0 ? 'positive' : 'negative'}`;
        totalElement.textContent = `${total >= 0 ? '+' : ''}${total.toFixed(0)}€`;
        dayElement.appendChild(totalElement);
    }

    // ===== SUMMARY =====
    updateSummary() {
        if (!this.elements.monthIncome) return;

        const stats = this.transactionManager.getMonthlyStats(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth()
        );

        const totalStats = this.transactionManager.getTotalStats();

        // Update monthly summary
        this.elements.monthIncome.textContent = Utils.formatCurrency(stats.income);
        this.elements.monthExpenses.textContent = Utils.formatCurrency(stats.expenses);
        this.elements.monthBalance.textContent = Utils.formatCurrency(stats.balance);
        this.elements.monthBalance.className = `amount balance ${stats.balance >= 0 ? 'positive' : 'negative'}`;

        // Update total balance
        if (this.elements.totalBalance) {
            this.elements.totalBalance.textContent = Utils.formatCurrency(totalStats.totalBalance);
            this.elements.totalBalance.className = `amount total-balance ${totalStats.totalBalance >= 0 ? 'positive' : 'negative'}`;
        }
    }

    // ===== GETTERS =====
    getCurrentDate() {
        return new Date(this.currentDate);
    }

    getSelectedDate() {
        return this.selectedDate ? new Date(this.selectedDate) : null;
    }

    getCurrentMonth() {
        return {
            year: this.currentDate.getFullYear(),
            month: this.currentDate.getMonth()
        };
    }

    // ===== UTILITIES =====
    getCalendarBounds() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7;
        
        const startDate = new Date(year, month, 1 - startDay);
        const endDate = new Date(year, month + 1, 42 - startDay - lastDay.getDate());
        
        return { startDate, endDate };
    }

    getVisibleDates() {
        const { startDate, endDate } = this.getCalendarBounds();
        const dates = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        
        return dates;
    }

    isDateInCurrentMonth(date) {
        return date.getFullYear() === this.currentDate.getFullYear() &&
               date.getMonth() === this.currentDate.getMonth();
    }

    // ===== EVENTS =====
    triggerDateSelect() {
        if (this.onDateSelect) {
            this.onDateSelect(this.getSelectedDate());
        }
    }

    triggerMonthChange() {
        if (this.onMonthChange) {
            this.onMonthChange(this.getCurrentMonth());
        }
    }

    // ===== REFRESH =====
    refresh() {
        this.updateCalendar();
    }

    refreshDay(date) {
        // Optimized refresh for a single day
        const dateString = Utils.formatDateString(date);
        const dayElements = this.elements.calendarGrid.querySelectorAll('.calendar-day:not(.day-header)');
        
        dayElements.forEach(dayElement => {
            const dayNumber = dayElement.querySelector('.day-number');
            if (!dayNumber) return;
            
            const day = parseInt(dayNumber.textContent);
            const elementDate = this.getDateFromDayElement(dayElement, day);
            
            if (elementDate && Utils.formatDateString(elementDate) === dateString) {
                this.refreshDayElement(dayElement, elementDate);
            }
        });
        
        // Always refresh summary as it might affect totals
        this.updateSummary();
    }

    refreshDayElement(dayElement, date) {
        // Remove existing transaction indicators and totals
        const existingTransactions = dayElement.querySelector('.day-transactions');
        const existingTotal = dayElement.querySelector('.day-total');
        
        if (existingTransactions) {
            existingTransactions.remove();
        }
        if (existingTotal) {
            existingTotal.remove();
        }

        // Add updated transaction indicators
        const dayTransactions = this.transactionManager.getTransactionsByDate(date);
        
        if (dayTransactions.length > 0) {
            this.addTransactionIndicators(dayElement, dayTransactions);
            this.addDayTotal(dayElement, dayTransactions);
        }
    }

    getDateFromDayElement(dayElement, day) {
        const isOtherMonth = dayElement.classList.contains('other-month');
        const year = this.currentDate.getFullYear();
        let month = this.currentDate.getMonth();
        
        if (isOtherMonth) {
            // Determine if it's previous or next month
            if (day > 15) {
                month = month - 1; // Previous month
            } else {
                month = month + 1; // Next month
            }
        }
        
        return new Date(year, month, day);
    }

    // ===== KEYBOARD NAVIGATION =====
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.selectedDate) return;
            
            let newDate = new Date(this.selectedDate);
            let shouldUpdate = false;
            
            switch (e.key) {
                case 'ArrowLeft':
                    newDate.setDate(newDate.getDate() - 1);
                    shouldUpdate = true;
                    break;
                case 'ArrowRight':
                    newDate.setDate(newDate.getDate() + 1);
                    shouldUpdate = true;
                    break;
                case 'ArrowUp':
                    newDate.setDate(newDate.getDate() - 7);
                    shouldUpdate = true;
                    break;
                case 'ArrowDown':
                    newDate.setDate(newDate.getDate() + 7);
                    shouldUpdate = true;
                    break;
                case 'Home':
                    newDate = new Date();
                    shouldUpdate = true;
                    break;
                case 'Escape':
                    this.clearSelection();
                    return;
            }
            
            if (shouldUpdate) {
                e.preventDefault();
                
                // Check if we need to change month
                if (newDate.getMonth() !== this.currentDate.getMonth() || 
                    newDate.getFullYear() !== this.currentDate.getFullYear()) {
                    this.goToMonth(newDate.getFullYear(), newDate.getMonth());
                }
                
                this.selectDate(newDate);
            }
        });
    }

    // ===== SEARCH AND FILTER =====
    highlightDatesWithTransactions(searchTerm = '') {
        const dayElements = this.elements.calendarGrid.querySelectorAll('.calendar-day:not(.day-header)');
        
        dayElements.forEach(dayElement => {
            dayElement.classList.remove('has-search-match');
            
            if (!searchTerm) return;
            
            const dayNumber = dayElement.querySelector('.day-number');
            if (!dayNumber) return;
            
            const day = parseInt(dayNumber.textContent);
            const elementDate = this.getDateFromDayElement(dayElement, day);
            
            if (elementDate) {
                const dayTransactions = this.transactionManager.getTransactionsByDate(elementDate);
                const hasMatch = dayTransactions.some(t => 
                    t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (hasMatch) {
                    dayElement.classList.add('has-search-match');
                }
            }
        });
    }

    // ===== EXPORT CALENDAR DATA =====
    exportCalendarData(format = 'json') {
        const { startDate, endDate } = this.getCalendarBounds();
        const transactions = this.transactionManager.getTransactionsByDateRange(startDate, endDate);
        
        const calendarData = {
            month: Utils.formatMonthYear(this.currentDate),
            period: {
                start: Utils.formatDateString(startDate),
                end: Utils.formatDateString(endDate)
            },
            transactions: transactions,
            summary: this.transactionManager.getMonthlyStats(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth()
            )
        };
        
        switch (format) {
            case 'csv':
                return this.exportAsCSV(calendarData);
            case 'json':
            default:
                return calendarData;
        }
    }

    exportAsCSV(calendarData) {
        const headers = ['Date', 'Libellé', 'Catégorie', 'Montant', 'Type'];
        const rows = calendarData.transactions.map(t => [
            Utils.formatDateDisplay(t.date),
            t.label,
            t.category,
            t.amount,
            t.type === 'income' ? 'Revenu' : 'Dépense'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // ===== CALENDAR THEMES =====
    updateCalendarTheme() {
        // This will be handled by CSS variables, but we can add specific logic here
        this.refresh();
    }

    // ===== ACCESSIBILITY =====
    setupAccessibility() {
        if (!this.elements.calendarGrid) return;
        
        // Add ARIA labels and roles
        this.elements.calendarGrid.setAttribute('role', 'grid');
        this.elements.calendarGrid.setAttribute('aria-label', 'Calendrier des transactions');
        
        // Add month navigation ARIA labels
        if (this.elements.prevMonth) {
            this.elements.prevMonth.setAttribute('aria-label', 'Mois précédent');
        }
        if (this.elements.nextMonth) {
            this.elements.nextMonth.setAttribute('aria-label', 'Mois suivant');
        }
    }

    updateAccessibilityLabels() {
        const dayElements = this.elements.calendarGrid.querySelectorAll('.calendar-day:not(.day-header)');
        
        dayElements.forEach(dayElement => {
            const dayNumber = dayElement.querySelector('.day-number');
            if (!dayNumber) return;
            
            const day = parseInt(dayNumber.textContent);
            const elementDate = this.getDateFromDayElement(dayElement, day);
            
            if (elementDate) {
                const dateString = Utils.formatDateDisplay(elementDate);
                const dayTransactions = this.transactionManager.getTransactionsByDate(elementDate);
                
                let ariaLabel = `${dateString}`;
                if (dayTransactions.length > 0) {
                    ariaLabel += `, ${dayTransactions.length} transaction${dayTransactions.length > 1 ? 's' : ''}`;
                }
                
                dayElement.setAttribute('role', 'gridcell');
                dayElement.setAttribute('aria-label', ariaLabel);
                dayElement.setAttribute('tabindex', this.selectedDate && 
                    Utils.isSameDate(elementDate, this.selectedDate) ? '0' : '-1');
            }
        });
    }

    // ===== PERFORMANCE OPTIMIZATIONS =====
    debounceRefresh = Utils.debounce(() => {
        this.refresh();
    }, 100);

    // Use this for rapid updates instead of direct refresh()
    scheduleRefresh() {
        this.debounceRefresh();
    }
}