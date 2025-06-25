// ===== TRANSACTION MANAGER =====
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.fixedExpenses = {
            loyer: 0,
            edf: 0,
            internet: 0,
            credit: 0,
            autres: 0
        };
        this.onTransactionChange = null;
        this.onFixedExpenseChange = null;
    }

    // ===== INITIALIZATION =====
    init() {
    this.transactions = StorageManager.loadTransactions(); 
	this.fixedExpenses = StorageManager.loadFixedExpenses(); 
	
	}	

    setCallbacks(onTransactionChange = null, onFixedExpenseChange = null) {
        this.onTransactionChange = onTransactionChange;
        this.onFixedExpenseChange = onFixedExpenseChange;
    }

    // ===== TRANSACTION CRUD =====
    addTransaction(transactionData) {
        const transaction = {
            id: Utils.generateId(),
            label: Utils.sanitizeString(transactionData.label),
            amount: parseFloat(transactionData.amount),
            category: transactionData.category,
            date: transactionData.date,
            type: transactionData.type,
            createdAt: new Date().toISOString()
        };

        const error = this.validateTransaction(transaction);
        if (error) {
            throw new Error(error);
        }

        this.transactions.push(transaction);
        this.saveTransactions();
        this.triggerTransactionChange();
        
        return transaction;
    }

    updateTransaction(id, updates) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) {
            throw new Error('Transaction non trouvée');
        }

        const updatedTransaction = { 
            ...this.transactions[index], 
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const error = this.validateTransaction(updatedTransaction);
        if (error) {
            throw new Error(error);
        }

        this.transactions[index] = updatedTransaction;
        this.saveTransactions();
        this.triggerTransactionChange();
        
        return updatedTransaction;
    }

    deleteTransaction(id) {
        const initialLength = this.transactions.length;
        this.transactions = this.transactions.filter(t => t.id !== id);
        
        if (this.transactions.length === initialLength) {
            throw new Error('Transaction non trouvée');
        }

        this.saveTransactions();
        this.triggerTransactionChange();
        
        return true;
    }

    getTransaction(id) {
        return this.transactions.find(t => t.id === id);
    }

    getAllTransactions() {
        return [...this.transactions];
    }

    // ===== TRANSACTION VALIDATION =====
    validateTransaction(transaction) {
        if (!transaction.label || transaction.label.trim().length === 0) {
            return "Le libellé est obligatoire";
        }
        if (!Utils.validateAmount(transaction.amount)) {
            return "Le montant doit être positif";
        }
        if (!transaction.category) {
            return "Veuillez sélectionner une catégorie";
        }
        if (!transaction.date) {
            return "La date est obligatoire";
        }
        if (!['income', 'expense'].includes(transaction.type)) {
            return "Le type de transaction est invalide";
        }
        return null;
    }

    // ===== TRANSACTION FILTERING =====
    getTransactionsByDate(date) {
        const dateString = Utils.formatDateString(date);
        return this.transactions.filter(t => t.date === dateString);
    }

    getTransactionsByMonth(year, month) {
        return this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month;
        });
    }

    getTransactionsByDateRange(startDate, endDate) {
        const start = Utils.formatDateString(startDate);
        const end = Utils.formatDateString(endDate);
        
        return this.transactions.filter(t => t.date >= start && t.date <= end);
    }

    getTransactionsByCategory(category) {
        return this.transactions.filter(t => t.category === category);
    }

    getTransactionsByType(type) {
        return this.transactions.filter(t => t.type === type);
    }

    // ===== TRANSACTION STATISTICS =====
    getMonthlyStats(year, month) {
        const monthTransactions = this.getTransactionsByMonth(year, month);
        
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expenses,
            balance: income - expenses,
            transactionCount: monthTransactions.length
        };
    }

    getTotalStats() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpenses,
            totalBalance: totalIncome - totalExpenses,
            totalTransactions: this.transactions.length
        };
    }

    getCategoryStats(startDate = null, endDate = null) {
        let transactions = this.transactions;
        
        if (startDate && endDate) {
            transactions = this.getTransactionsByDateRange(startDate, endDate);
        }

        const categoryTotals = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }

    // ===== FIXED EXPENSES =====
    updateFixedExpenses(expenses) {
        this.fixedExpenses = {
            loyer: parseFloat(expenses.loyer) || 0,
            edf: parseFloat(expenses.edf) || 0,
            internet: parseFloat(expenses.internet) || 0,
            credit: parseFloat(expenses.credit) || 0,
            autres: parseFloat(expenses.autres) || 0
        };
        
        StorageManager.saveFixedExpenses(this.fixedExpenses);
        this.triggerFixedExpenseChange();
    }

    getFixedExpenses() {
        return { ...this.fixedExpenses };
    }

    getFixedExpensesTotal() {
        return Object.values(this.fixedExpenses).reduce((sum, val) => sum + val, 0);
    }

    getFixedExpenseAmount(category) {
        const mapping = {
            'Loyer': this.fixedExpenses.loyer,
            'EDF-GDF': this.fixedExpenses.edf,
            'Internet': this.fixedExpenses.internet,
            'Remboursement crédit': this.fixedExpenses.credit
        };
        
        return mapping[category] || 0;
    }

    // ===== PRIVATE METHODS =====
    saveTransactions() {
        StorageManager.saveTransactions(this.transactions); 
    }

    triggerTransactionChange() {
        if (this.onTransactionChange) {
            this.onTransactionChange(this.transactions);
        }
    }

    triggerFixedExpenseChange() {
        if (this.onFixedExpenseChange) {
            this.onFixedExpenseChange(this.fixedExpenses);
        }
    }

    // ===== DATA MANAGEMENT =====
    importTransactions(importedData) {
        if (!Array.isArray(importedData.transactions)) {
            throw new Error('Format de données invalide');
        }

        this.transactions = importedData.transactions;
        this.fixedExpenses = importedData.fixedExpenses || this.fixedExpenses;
        
        this.saveTransactions();
        StorageManager.saveFixedExpenses(this.fixedExpenses);
        
        this.triggerTransactionChange();
        this.triggerFixedExpenseChange();
    }

    clearAllTransactions() {
        this.transactions = [];
        this.fixedExpenses = {
            loyer: 0, edf: 0, internet: 0, credit: 0, autres: 0
        };
        
        this.saveTransactions();
        StorageManager.saveFixedExpenses(this.fixedExpenses);
        
        this.triggerTransactionChange();
        this.triggerFixedExpenseChange();
    }

    // ===== SEARCH AND FILTER =====
    searchTransactions(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return this.transactions;
        
        return this.transactions.filter(t => 
            t.label.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    getUniqueCategories() {
        const categories = new Set(this.transactions.map(t => t.category));
        return Array.from(categories).sort();
    }

    getTransactionYears() {
        const years = new Set(
            this.transactions.map(t => new Date(t.date).getFullYear())
        );
        return Array.from(years).sort((a, b) => b - a);
    }
}