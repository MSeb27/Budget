// ===== MAIN APPLICATION CLASS =====
class BudgetCalendar {
    constructor() {
        // Core managers
        this.transactionManager = new TransactionManager();
        this.calendarManager = new CalendarManager(this.transactionManager);
        this.chartsManager = new ChartsManager(this.transactionManager);
        
        // UI elements
        this.elements = {};
        
        // State
        this.currentTab = 'budget';
        this.initialized = false;
    }

    // ===== INITIALIZATION =====
    async init() {
        try {
            // Initialize DOM elements
            this.initializeElements();
            
            // Initialize managers
            this.initializeManagers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            // Initialize charts (async)
            await this.chartsManager.init();
            
            this.initialized = true;
            
            console.log('Budget Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing Budget Calendar:', error);
            Utils.showNotification('Erreur lors de l\'initialisation', 'error');
        }
    }

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
            clearBtn: document.getElementById('clear-data'),
            
            // Theme elements
            themeSelect: document.getElementById('theme-select'),
            
            // Radio label elements
            expenseLabel: document.getElementById('expense-label'),
            incomeLabel: document.getElementById('income-label')
        };

        // Validate required elements
        this.validateElements();
    }

    validateElements() {
        const requiredElements = [
            'form', 'calendarGrid', 'transactionsList'
        ];

        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }
    }

    initializeManagers() {
        // Initialize transaction manager
        this.transactionManager.init();
        this.transactionManager.setCallbacks(
            () => this.onTransactionsChange(),
            () => this.onFixedExpensesChange()
        );

        // Initialize calendar manager
        this.calendarManager.init(this.elements);
        this.calendarManager.setCallbacks(
            (date) => this.onDateSelect(date),
            (monthData) => this.onMonthChange(monthData)
        );

        // Initialize theme manager
        const savedTheme = StorageManager.loadTheme();
        ThemeManager.init(savedTheme, (theme) => this.onThemeChange(theme));
    }

    initializeUI() {
        // Setup tabs
        this.setupTabNavigation();
        
        // Setup theme selector
        if (this.elements.themeSelect) {
            ThemeManager.setupThemeSelector(this.elements.themeSelect);
        }
        
        // Setup form defaults
        this.setDefaultDate();
        this.updateRadioStyles();
        
        // Load fixed expenses
        this.loadFixedExpensesValues();
        
        // Setup keyboard navigation
        this.calendarManager.setupKeyboardNavigation();
        
        // Setup accessibility
        this.calendarManager.setupAccessibility();
        
        // Initial updates
        this.updateTransactionsList();
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Category change for auto-prefill
        if (this.elements.category) {
            this.elements.category.addEventListener('change', () => {
                this.updateTypeBasedOnCategory();
                this.prefillFixedExpenseAmount();
            });
        }
        
        // Radio button changes
        if (this.elements.typeExpense) {
            this.elements.typeExpense.addEventListener('change', () => this.updateRadioStyles());
        }
        if (this.elements.typeIncome) {
            this.elements.typeIncome.addEventListener('change', () => this.updateRadioStyles());
        }
        
        // Fixed expenses listeners
        this.setupFixedExpensesListeners();
        
        // Settings listeners
        this.setupSettingsListeners();
        
        // Window resize for charts
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.chartsManager.initialized) {
                this.chartsManager.resizeCharts();
            }
        }, 250));
    }

    setupFixedExpensesListeners() {
        const fixedInputs = [
            'fixedLoyer', 'fixedEdf', 'fixedInternet', 'fixedCredit', 'fixedAutres'
        ];
        
        fixedInputs.forEach(inputKey => {
            if (this.elements[inputKey]) {
                this.elements[inputKey].addEventListener('input', 
                    Utils.debounce(() => this.updateFixedExpenses(), 300)
                );
            }
        });
    }

    setupSettingsListeners() {
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => {
                if (this.elements.importFile) {
                    this.elements.importFile.click();
                }
            });
        }
        
        if (this.elements.importFile) {
            this.elements.importFile.addEventListener('change', (e) => this.importData(e));
        }
        
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearAllData());
        }