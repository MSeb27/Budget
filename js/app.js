// Exporter aussi les autres classes si elles sont définies dans ce fichier 
if (typeof TransactionManager !== 'undefined') 
	window.TransactionManager = TransactionManager; 
if (typeof ChartsManager !== 'undefined') 
	window.ChartsManager = ChartsManager; 
if (typeof EnhancedDashboard !== 'undefined') 
	window.EnhancedDashboard = EnhancedDashboard; 
if (typeof BudgetPredictionsAI !== 'undefined') 
	window.BudgetPredictionsAI = BudgetPredictionsAI; 
if (typeof AdvancedSearchManager !== 'undefined')
	window.AdvancedSearchManager = AdvancedSearchManager; 
if (typeof ThemeManager !== 'undefined') 
	window.ThemeManager = ThemeManager; 
console.log('📦 Classes exposées dans le scope global');

// ===== MAIN APPLICATION CLASS =====
class BudgetCalendar {
        constructor() {
		this.currentDate = new Date();
		this.selectedDate = null;
		this.transactions = StorageManager.loadTransactions(); // Utiliser StorageManager
		this.fixedExpenses = StorageManager.loadFixedExpenses(); // Utiliser StorageManager
		this.currentTheme = StorageManager.loadTheme(); // Utiliser StorageManager
        this.filteredTransactions = [];
        this.charts = {};
        this.chartsInitialized = false;
        
        this.transactionManager = null;
        this.predictionsAI = null;
        this.chartManager = null;
        this.enhancedDashboard = null;
        this.advancedSearch = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.initializeModernThemes();
        
        this.setDefaultDate();
        this.loadFixedExpensesValues();
        this.updateRadioStyles();
        
        // Initialiser les gestionnaires AVANT les charts
        this.initializeManagers();
        
        // Mettre à jour le calendrier avec les bonnes données
        this.updateCalendar();
        this.updateTransactionsList();
        
        // Délai plus long pour l'initialisation des charts
        setTimeout(() => {
            this.initializeCharts();
        }, 500);
	}


	// Initalize 
	initializeManagers() {
        try {
            // Initialiser le gestionnaire de transactions
            this.transactionManager = new TransactionManager();
            this.transactionManager.init();
            
            // IMPORTANT: Synchroniser les données
            this.transactionManager.transactions = this.transactions;
            this.transactionManager.fixedExpenses = this.fixedExpenses;
            
            // Callbacks pour synchronisation
            this.transactionManager.setCallbacks(
                (transactions) => {
                    this.transactions = transactions;
                    this.updateCalendar();
                    this.updateTransactionsList();
                },
                (fixedExpenses) => {
                    this.fixedExpenses = fixedExpenses;
                    this.loadFixedExpensesValues();
                }
            );

            // Initialiser l'IA de prédictions
            this.predictionsAI = new BudgetPredictionsAI(this.transactionManager);

            // Initialiser le gestionnaire de graphiques
            this.chartManager = new ChartsManager(this.transactionManager);

            // Initialiser le tableau de bord amélioré
            this.enhancedDashboard = new EnhancedDashboard(
                this.transactionManager, 
                this.predictionsAI, 
                this.chartManager
            );

            // Initialiser la recherche avancée
            this.advancedSearch = new AdvancedSearchManager(this.transactionManager);
            this.advancedSearch.createQuickFilters();

            console.log('✅ Tous les gestionnaires initialisés avec succès');
            
            // Mise à jour immédiate après initialisation
            setTimeout(() => {
                this.updateAllComponents();
            }, 200);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des gestionnaires:', error);
        }
    }

	updateAllComponents() {
        try {
            // Mettre à jour le calendrier
            this.updateCalendar();
            this.updateTransactionsList();
            
            // Mettre à jour les charts si initialisés
            if (this.chartsInitialized && this.chartManager) {
                this.chartManager.updateAllCharts();
            }
            
            // Mettre à jour le dashboard si initialisé
            if (this.enhancedDashboard) {
                this.enhancedDashboard.updateAllWidgets();
            }
            
            console.log('✅ Tous les composants mis à jour');
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des composants:', error);
        }
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
            
            // Délais appropriés selon l'onglet
            setTimeout(() => {
                switch(tabName) {
                    case 'analytics':
                        if (this.chartsInitialized && this.chartManager) {
                            this.chartManager.updateAllCharts();
                        } else if (!this.chartsInitialized) {
                            this.initializeCharts();
                        }
                        break;
                        
                    case 'dashboard':
                        if (this.enhancedDashboard) {
                            this.enhancedDashboard.updateAllWidgets();
                        }
                        break;
                        
                    case 'predictions':
                        if (this.predictionsAI) {
                            this.updatePredictionsTab();
                        }
                        break;
                        
                    case 'search':
                        if (this.advancedSearch) {
                            this.advancedSearch.applyFilters();
                        }
                        break;
                }
            }, 100);
        }
    }
	
	updatePredictionsTab() {
        if (typeof refreshPredictions === 'function') {
            refreshPredictions();
        }
    }

setupEventListeners() {
        console.log('🔧 Configuration des event listeners...'); 
        
        // Vérifier que les éléments existent avant d'ajouter les listeners 
        const elements = [ 'prev-month', 'next-month', 'transaction-form', 'amount', 'category', 'label', 'date' ]; 
        elements.forEach(id => { 
            const element = document.getElementById(id); 
            if (!element) { 
                console.warn(`⚠️ Élément manquant: ${id}`); 
            } 
        }); 
        
        // Form submission (méthode alternative qui utilise this.elements)
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Calendar navigation (méthode alternative qui utilise this.elements)
        if (this.elements.prevMonth) {
            this.elements.prevMonth.addEventListener('click', () => this.previousMonth());
        }
        if (this.elements.nextMonth) {
            this.elements.nextMonth.addEventListener('click', () => this.nextMonth());
        }
        
        // Fixed expenses listeners
        if (this.elements.fixedLoyer) {
            this.elements.fixedLoyer.addEventListener('input', () => this.updateFixedExpenses());
        }
        if (this.elements.fixedEdf) {
            this.elements.fixedEdf.addEventListener('input', () => this.updateFixedExpenses());
        }
        if (this.elements.fixedInternet) {
            this.elements.fixedInternet.addEventListener('input', () => this.updateFixedExpenses());
        }
        if (this.elements.fixedCredit) {
            this.elements.fixedCredit.addEventListener('input', () => this.updateFixedExpenses());
        }
        if (this.elements.fixedAutres) {
            this.elements.fixedAutres.addEventListener('input', () => this.updateFixedExpenses());
        }
        
        // Settings listeners
        if (this.elements.exportData) {
            this.elements.exportData.addEventListener('click', () => this.exportData());
        }
        if (this.elements.importData) {
            this.elements.importData.addEventListener('click', () => this.elements.importFile.click());
        }
        if (this.elements.importFile) {
            this.elements.importFile.addEventListener('change', (e) => this.importData(e));
        }
        if (this.elements.clearData) {
            this.elements.clearData.addEventListener('click', () => this.clearAllData());
        }
        
        // Category change listener for auto type selection
        if (this.elements.category) {
            this.elements.category.addEventListener('change', () => this.updateTypeBasedOnCategory());
        }
        
        // Radio button listeners for visual updates
        if (this.elements.typeExpense) {
            this.elements.typeExpense.addEventListener('change', () => this.updateRadioStyles());
        }
        if (this.elements.typeIncome) {
            this.elements.typeIncome.addEventListener('change', () => this.updateRadioStyles());
        }

        // Theme listener
        this.setupThemeEventListeners();
        
        console.log('✅ Event listeners configurés'); 
    }

    // ===== UTILITY METHODS =====
    setDefaultDate() {
        const today = new Date();
        this.elements.date.valueAsDate = today;
    }

    updateTypeBasedOnCategory() {
		const category = this.elements.category.value;
    
		if (!category) {
			return; // Ne rien faire si pas de catégorie (formulaire vide)
		}

		// Catégories qui sont généralement des revenus
		const incomeCategories = ['Salaire', 'Prêt'];
    
		if (incomeCategories.includes(category)) 
		{
			this.elements.typeIncome.checked = true;
			this.elements.typeExpense.checked = false;
		} 
		else if (category) 
		{
			// Toutes les autres catégories sont des dépenses
			this.elements.typeExpense.checked = true;
			this.elements.typeIncome.checked = false;
		}
    
		// 4. REMPLIR AUTOMATIQUEMENT LE LIBELLÉ AVEC LA CATÉGORIE
		if (category && !this.elements.label.value) {
			this.elements.label.value = category;
		}
    
		// 3. AFFECTER AUTOMATIQUEMENT LE MONTANT DES DÉPENSES CONTRAINTES
		this.autoFillConstrainedExpense(category);
		
		this.updateRadioStyles();
	}
	
	autoFillConstrainedExpense(category) {
		const constrainedExpenseMapping = {
			'Loyer': 'loyer',
			'EDF-GDF': 'edf', 
			'Internet': 'internet',
			'Remboursement crédit': 'credit',
			'Impôt': 'impot', 
			'Autres': 'autres'
		};
    
		const fixedExpenseKey = constrainedExpenseMapping[category];
    
		if (fixedExpenseKey && this.fixedExpenses[fixedExpenseKey] > 0) {
			this.elements.amount.value = this.fixedExpenses[fixedExpenseKey].toFixed(2);
        
			// Indication visuelle
			this.elements.amount.style.background = '#e8f5e8';
			setTimeout(() => {
				this.elements.amount.style.background = '';
			}, 2000);
		}
	}

    updateRadioStyles() {
        // Vérifier que les éléments existent
        if (!this.elements.expenseLabel || !this.elements.incomeLabel) {
            console.warn('Radio label elements not found');
            return;
        }
        
        // Retirer les classes précédentes
        this.elements.expenseLabel.classList.remove('checked');
        this.elements.incomeLabel.classList.remove('checked');
        
        // Ajouter la classe checked au bon label
        if (this.elements.typeExpense.checked) {
            this.elements.expenseLabel.classList.add('checked');
        } else if (this.elements.typeIncome.checked) {
            this.elements.incomeLabel.classList.add('checked');
        }
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
        // Vérifier que les éléments existent avant de les modifier
        if (this.elements.fixedLoyer) this.elements.fixedLoyer.value = this.fixedExpenses.loyer || '';
        if (this.elements.fixedEdf) this.elements.fixedEdf.value = this.fixedExpenses.edf || '';
        if (this.elements.fixedInternet) this.elements.fixedInternet.value = this.fixedExpenses.internet || '';
        if (this.elements.fixedCredit) this.elements.fixedCredit.value = this.fixedExpenses.credit || '';
        if (this.elements.fixedAutres) this.elements.fixedAutres.value = this.fixedExpenses.autres || '';
        
        this.updateFixedExpensesTotal();
    }

    updateFixedExpenses() {
		this.fixedExpenses = {
			loyer: parseFloat(this.elements.fixedLoyer.value) || 0,
			edf: parseFloat(this.elements.fixedEdf.value) || 0,
			internet: parseFloat(this.elements.fixedInternet.value) || 0,
			credit: parseFloat(this.elements.fixedCredit.value) || 0,
			impot: parseFloat(this.elements.fixedImpot.value) || 0, 
			autres: parseFloat(this.elements.fixedAutres.value) || 0
		};
    
		StorageManager.saveFixedExpenses(this.fixedExpenses);
		this.updateFixedExpensesTotal();
	}

    updateFixedExpensesTotal() {
        const total = Object.values(this.fixedExpenses).reduce((sum, val) => sum + val, 0);
        this.elements.fixedTotal.textContent = `${total.toFixed(2)} €`;
    }

    // ===== DATA MANAGEMENT METHODS =====
    exportData() {
        const data = {
            transactions: this.transactions,
            fixedExpenses: this.fixedExpenses,
            theme: this.currentTheme,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget_export_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.transactions || !Array.isArray(data.transactions)) {
                    alert('Fichier invalide: données de transactions manquantes');
                    return;
                }
                
                if (confirm('Cela remplacera toutes les données actuelles. Continuer ?')) {
                    this.transactions = data.transactions || [];
                    this.fixedExpenses = data.fixedExpenses || {
                        loyer: 0,
                        edf: 0,
                        internet: 0,
                        credit: 0,
                        autres: 0
                    };
                    
                    if (data.theme) {
                        this.applyTheme(data.theme);
                    }
                    
                    // Save to localStorage
                    StorageManager.saveTransactions(this.transactions);
                    StorageManager.saveFixedExpenses(this.fixedExpenses);
                    
                    // Update UI
                    this.loadFixedExpensesValues();
                    this.updateCalendar();
                    this.updateTransactionsList();
                    if (this.chartsInitialized) {
                        this.updateCharts();
                    }
                    
                    alert('Données importées avec succès !');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Erreur lors de l\'import: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }
    
    clearAllData() {
        if (confirm('⚠️ Cette action supprimera TOUTES les données. Êtes-vous sûr ?')) {
            if (confirm('⚠️ Dernière confirmation: toutes les transactions seront perdues !')) {
                // Clear data
                this.transactions = [];
                this.fixedExpenses = {
                    loyer: 0,
                    edf: 0,
                    internet: 0,
                    credit: 0,
                    autres: 0
                };
                
                // Save to localStorage
                StorageManager.saveTransactions(this.transactions);
                StorageManager.saveFixedExpenses(this.fixedExpenses);
                
                // Reset theme
                this.applyTheme('light');
                
                // Update UI
                this.loadFixedExpensesValues();
                this.updateCalendar();
                this.updateTransactionsList();
                if (this.chartsInitialized) {
                    this.updateCharts();
                }
                
                alert('Toutes les données ont été effacées.');
            }
        }
    }

    // ===== METHODES THEME =====
    
    /**
     * Initialise le système de thèmes 
     */
    initializeModernThemes() {
        // Charger le thème sauvegardé
        const savedTheme = ThemeManager.loadTheme();
        
        // Initialiser le gestionnaire avec callback
        ThemeManager.init(savedTheme, (theme, themeInfo) => {
            console.log(`Thème changé: ${themeInfo.name} (${theme})`);
            
            // Mettre à jour les graphiques si nécessaire
            if (this.chartsInitialized) {
                setTimeout(() => {
                    this.updateCharts();
                }, 100);
            }
        });

        // Configurer le sélecteur de thème
        if (this.elements.themeSelect) {
            ThemeManager.setupThemeSelector(this.elements.themeSelect, true);
        }
    }

    /**
     * Configuration des événements de thème
     */
    setupThemeEventListeners() {
        // Écouter les événements de thème personnalisés
        document.addEventListener('themechange', (e) => {
            console.log('Thème changé:', e.detail);
            this.currentTheme = e.detail.theme;
        });

        // Raccourci pour ouvrir l'aperçu des thèmes (Ctrl+Shift+P)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.createThemePreviewModal();
            }
        });
    }

    /**
     * Basculer entre mode clair et sombre
     */
    toggleDarkMode() {
        ThemeManager.toggleDarkMode();
        this.currentTheme = ThemeManager.getCurrentTheme();
    }

    /**
     * Passer au thème suivant
     */
    nextTheme() {
        const newTheme = ThemeManager.nextTheme();
        this.currentTheme = newTheme;
        return newTheme;
    }

    /**
     * Passer au thème précédent
     */
    previousTheme() {
        const newTheme = ThemeManager.previousTheme();
        this.currentTheme = newTheme;
        return newTheme;
    }

    /**
     * Créer un aperçu des thèmes disponibles
     */
    createThemePreviewModal() {
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'theme-modal-overlay';
    modal.innerHTML = `
        <div class="theme-modal">
            <div class="theme-modal-header">
                <h3>🎨 Galerie des Thèmes</h3>
                <div class="theme-modal-actions">
                    <button class="theme-action-btn" id="theme-random" title="Thème aléatoire">🎲</button>
                    <button class="theme-action-btn" id="theme-favorites" title="Favoris">⭐</button>
                    <button class="theme-modal-close" aria-label="Fermer">×</button>
                </div>
            </div>
            <div class="theme-modal-content">
                <div class="theme-navigation">
                    <button class="theme-nav-btn" id="theme-prev">← Précédent</button>
                    <button class="theme-nav-btn" id="theme-toggle">🌓 ${ThemeManager.isDarkTheme() ? 'Mode Clair' : 'Mode Sombre'}</button>
                    <button class="theme-nav-btn" id="theme-next">Suivant →</button>
                    <span class="theme-mode-indicator">${ThemeManager.isDarkTheme() ? '🌙 Sombre' : '☀️ Clair'}</span>
                </div>
                <div class="theme-stats">
                    <span class="theme-stat">
                        <strong>${Object.keys(ThemeManager.themes).length}</strong> thèmes disponibles
                    </span>
                    <span class="theme-stat">
                        Actuel: <strong>${ThemeManager.themes[this.currentTheme].name}</strong>
                    </span>
                </div>
                <div id="themes-grid-container"></div>
                <div class="theme-shortcuts">
                    <small>
                        <strong>🎮 Raccourcis:</strong> 
                        <span class="shortcut">Ctrl+Shift+T</span> Thème suivant | 
                        <span class="shortcut">Ctrl+Shift+D</span> Clair/Sombre |
                        <span class="shortcut">Ctrl+Shift+P</span> Cette fenêtre
                    </small>
                </div>
            </div>
        </div>
    `;

    // Styles améliorés pour la modal
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const modalContent = modal.querySelector('.theme-modal');
    modalContent.style.cssText = `
        background: var(--surface);
        border-radius: var(--border-radius);
        max-width: 95vw;
        max-height: 95vh;
        width: 900px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        border: 2px solid var(--border-color);
        transform: scale(0.8) translateY(-20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    `;

    // Styles pour les nouveaux éléments
    const modalHeader = modal.querySelector('.theme-modal-header');
    modalHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 2px solid var(--border-color);
        background: linear-gradient(45deg, var(--surface), var(--light-color));
    `;

    const modalActions = modal.querySelector('.theme-modal-actions');
    modalActions.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const themeStats = modal.querySelector('.theme-stats');
    themeStats.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        margin-bottom: 16px;
        font-size: 13px;
        color: var(--text-color);
        opacity: 0.8;
    `;

    // Générer la grille des thèmes avec la nouvelle méthode
    const gridContainer = modal.querySelector('#themes-grid-container');
    const themesGrid = ThemeManager.createThemeGrid();
    
    // Marquer le thème actuel
    const currentThemePreview = themesGrid.querySelector(`[data-theme-preview="${this.currentTheme}"]`);
    if (currentThemePreview) {
        currentThemePreview.classList.add('current-theme');
    }

    gridContainer.appendChild(themesGrid);

    // Gestionnaires d'événements améliorés
    const closeBtn = modal.querySelector('.theme-modal-close');
    const prevBtn = modal.querySelector('#theme-prev');
    const nextBtn = modal.querySelector('#theme-next');
    const toggleBtn = modal.querySelector('#theme-toggle');
    const randomBtn = modal.querySelector('#theme-random');
    const favBtn = modal.querySelector('#theme-favorites');

    // Styles pour les boutons d'action
    modal.querySelectorAll('.theme-action-btn, .theme-modal-close').forEach(btn => {
        btn.style.cssText = `
            background: var(--light-color);
            border: 2px solid var(--border-color);
            color: var(--text-color);
            font-size: 16px;
            cursor: pointer;
            padding: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: var(--transition);
        `;
    });

    // Événements
    closeBtn.addEventListener('click', () => this.closeThemeModal(modal));
    
    prevBtn.addEventListener('click', () => {
        this.previousTheme();
        this.updateModalCurrentTheme(modal);
    });
    
    nextBtn.addEventListener('click', () => {
        this.nextTheme();
        this.updateModalCurrentTheme(modal);
    });
    
    toggleBtn.addEventListener('click', () => {
        this.toggleDarkMode();
        this.updateModalCurrentTheme(modal);
        // Mettre à jour le texte du bouton
        toggleBtn.textContent = `🌓 ${ThemeManager.isDarkTheme() ? 'Mode Clair' : 'Mode Sombre'}`;
    });

    randomBtn.addEventListener('click', () => {
        const themes = Object.keys(ThemeManager.themes);
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        ThemeManager.changeTheme(randomTheme);
        this.currentTheme = randomTheme;
        this.updateModalCurrentTheme(modal);
    });

    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeThemeModal(modal);
        }
    });

    // Ajouter au DOM et animer
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1) translateY(0)';
    });

    return modal;
}

    /**
     * Met à jour l'indicateur de thème actuel dans la modal
     */
    updateModalCurrentTheme(modal) {
        // Retirer l'ancienne sélection
        const oldCurrent = modal.querySelector('.current-theme');
        if (oldCurrent) {
            oldCurrent.classList.remove('current-theme');
        }

        // Ajouter la nouvelle sélection
        const newCurrent = modal.querySelector(`[data-theme-preview="${this.currentTheme}"]`);
        if (newCurrent) {
            newCurrent.classList.add('current-theme');
        }

        // Mettre à jour l'indicateur de mode
        const modeIndicator = modal.querySelector('.theme-mode-indicator');
        if (modeIndicator) {
            modeIndicator.textContent = ThemeManager.isDarkTheme() ? 'Sombre' : 'Clair';
        }
    }

    /**
     * Ferme la modal de thème
     */
    closeThemeModal(modal) {
        modal.style.opacity = '0';
        const modalContent = modal.querySelector('.theme-modal');
        modalContent.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Applique un thème
     */
    applyTheme(theme) {
    ThemeManager.applyTheme(theme);
    this.currentTheme = theme;
    
    // Mettre à jour les graphiques si nécessaire
    if (this.chartsInitialized) {
        setTimeout(() => {
            this.updateCharts();
        }, 100);
    }
    
    // Mettre à jour l'aperçu des couleurs
    this.updateThemePreview();
}

/**
 * Met à jour l'aperçu des couleurs dans les paramètres
 */
updateThemePreview() {
    const previewCard = document.querySelector('.preview-card');
    if (previewCard) {
        // Déclencher l'animation
        previewCard.style.animation = 'none';
        previewCard.offsetHeight; // Force reflow
        previewCard.style.animation = 'themePreviewUpdate 0.5s ease-out';
    }
}

/**
 * Change de thème
 */
	changeTheme(newTheme) {
    if (ThemeManager.changeTheme(newTheme)) {
        this.currentTheme = newTheme;
        
        // Animation de transition
        document.body.classList.add('theme-transition-active');
        setTimeout(() => {
            document.body.classList.remove('theme-transition-active');
        }, 300);
        
        // Mettre à jour l'aperçu des couleurs
        this.updateThemePreview();
    }
	}

    // ===== initializeElements =====
	initializeElements() {
        this.elements = {};
        
        const elementIds = [
            'transaction-form', 'label', 'amount', 'category', 'date',
            'type-expense', 'type-income', 'error-message',
            'prev-month', 'next-month', 'month-year', 'calendar-grid',
            'month-income', 'month-expenses', 'month-balance', 'total-balance',
            'transactions-title', 'selected-day-info', 'transactions-list', 'no-transactions',
            'fixed-loyer', 'fixed-edf', 'fixed-internet', 'fixed-credit', 'fixed-autres', 'fixed-total',
            'export-data', 'import-data', 'import-file', 'clear-data', 'theme-select',
            'expense-label', 'income-label'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Convertir les tirets en camelCase pour les propriétés
                const propName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.elements[propName] = element;
            } else {
                console.warn(`⚠️ Élément non trouvé: ${id}`);
            }
        });

        // Éléments spéciaux
        this.elements.tabBtns = document.querySelectorAll('.tab-btn') || [];
        this.elements.tabContents = document.querySelectorAll('.tab-content') || [];
        
        // Alias pour compatibilité avec le code existant
        this.elements.form = this.elements.transactionForm;
        this.elements.exportBtn = this.elements.exportData;
        this.elements.importBtn = this.elements.importData;
        this.elements.clearBtn = this.elements.clearData;
        
        console.log('✅ Éléments DOM initialisés:', Object.keys(this.elements).length, 'éléments trouvés');
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

        // Utiliser le transaction manager si disponible
        if (this.transactionManager) {
            try {
                this.transactionManager.addTransaction(transaction);
                this.transactions = this.transactionManager.getAllTransactions();
            } catch (error) {
                this.elements.errorMessage.textContent = error.message;
                return;
            }
        } else {
            // Fallback
            this.transactions.push(transaction);
            if (!StorageManager.saveTransactions(this.transactions)) {
                this.elements.errorMessage.textContent = "Erreur lors de la sauvegarde";
                return;
            }
        }

        this.resetForm();
        this.updateAllComponents();
    }


    validateTransaction(transaction) {
        if (!transaction.label) return "Le libellé est obligatoire";
        if (isNaN(transaction.amount) || transaction.amount <= 0) return "Le montant doit être positif";
        if (!transaction.category) return "Veuillez sélectionner une catégorie";
        if (!transaction.date) return "La date est obligatoire";
        return null;
    }

	resetForm() {
		// Sauvegarder la date actuelle
		const currentDate = this.elements.date.value;

		// ⚠️ IMPORTANT: Désactiver temporairement les événements pour éviter les validations
		const categoryChangeHandler = this.elements.category.onchange;
		this.elements.category.onchange = null;
    
		this.elements.form.reset();
		this.elements.typeExpense.checked = true; // Dépense par défaut
    
		// Restaurer la date au lieu de la réinitialiser
		if (currentDate) {
			this.elements.date.value = currentDate;
		} else {
			this.setDefaultDate();
		}
    
		// ✅ Remettre les événements après un petit délai
		setTimeout(() => {
        this.elements.category.onchange = categoryChangeHandler;
        this.updateRadioStyles(); // Mettre à jour l'apparence
		}, 50);
	}
	
	deleteTransaction(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        try {
            // Utiliser le transaction manager si disponible
            if (this.transactionManager) {
                this.transactionManager.deleteTransaction(id);
                this.transactions = this.transactionManager.getAllTransactions();
            } else {
                // Fallback vers l'ancienne méthode
                this.transactions = this.transactions.filter(t => t.id !== id);
                StorageManager.saveTransactions(this.transactions);
            }
            
            // Mettre à jour tous les composants
            this.updateAllComponents();
            
            console.log('✅ Transaction supprimée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de la transaction');
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
                    <button class="btn-danger" onclick="window.calendar.deleteTransaction('${transaction.id}')">
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
            console.log('Chart.js pas encore chargé, nouvelle tentative...');
            setTimeout(() => this.initializeCharts(), 500);
            return;
        }
        
        if (typeof Plotly === 'undefined') {
            console.log('Plotly.js pas encore chargé, nouvelle tentative...');
            setTimeout(() => this.initializeCharts(), 500);
            return;
        }
        
        try {
            // Utiliser le chart manager si disponible
            if (this.chartManager) {
                this.chartManager.init();
                this.chartsInitialized = true;
                console.log('✅ Charts initialisés via ChartManager');
            } else {
                // Fallback vers l'ancienne méthode
                this.createCategoryChart();
                this.createBudgetChart();
                this.create3DCharts();
                this.chartsInitialized = true;
                this.updateCharts();
                console.log('✅ Charts initialisés via méthode fallback');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des charts:', error);
            // Retry après un délai plus long
            setTimeout(() => this.initializeCharts(), 1000);
        }
    }

    updateCharts() {
        if (!this.chartsInitialized) {
            console.warn('Charts pas encore initialisés');
            return;
        }
        
        try {
            if (this.chartManager) {
                this.chartManager.updateAllCharts();
            } else {
                // Fallback vers l'ancienne méthode
                this.updateCategoryChart();
                this.updateBudgetChart();
                this.update3DCharts();
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des charts:', error);
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

        // Utiliser scatter3d avec des barres personnalisées pour un meilleur effet 3D
        const enhancedData = this.create3DBarData(categories, amounts, rainbowColors);

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


window.BudgetCalendar = BudgetCalendar;

// ===== FONCTIONS GLOBALES POUR LES PRÉDICTIONS =====
// Ces fonctions sont appelées depuis le HTML des boutons dans l'onglet Prédictions

window.refreshPredictions = function() {
    console.log('🔄 Actualisation des prédictions...');
    if (window.calendar?.predictionsAI) {
        updatePredictionsContent();
    } else {
        console.warn('⚠️ Prédictions AI non disponible, tentative de réinitialisation...');
        if (window.calendar) {
            window.calendar.initializeManagers();
            setTimeout(() => {
                if (window.calendar?.predictionsAI) {
                    updatePredictionsContent();
                } else {
                    showPredictionsError('Le moteur de prédictions n\'est pas disponible');
                }
            }, 1000);
        }
    }
};


window.exportPredictions = function() {
    console.log('Export des prédictions...');
    if (window.calendar && window.calendar.predictionsAI) {
        try {
            // Ici vous pouvez implémenter l'export réel
            alert('Fonctionnalité d\'export des prédictions en cours de développement');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export des prédictions');
        }
    } else {
        alert('Le moteur de prédictions n\'est pas disponible');
    }
};

window.showPredictionSettings = function() {
    console.log('Ouverture des paramètres IA...');
    // Ici vous pouvez implémenter la modal des paramètres
    alert('Paramètres IA en cours de développement');
};

// Fonction principale pour mettre à jour le contenu des prédictions
async function updatePredictionsContent() {
    try {
        showPredictionsLoading();
        
        const predictionsAI = window.calendar.predictionsAI;
        
        // Vérifier que l'AI est bien initialisée
        if (!predictionsAI) {
            throw new Error('Moteur de prédictions non initialisé');
        }
        
        // Obtenir les prédictions avec gestion d'erreur individuelle
        const results = {};
        
        try {
            results.predictions = await predictionsAI.predictNextMonthExpenses();
        } catch (e) {
            console.error('Erreur prédiction mois suivant:', e);
            results.predictions = { totalAmount: 0, confidence: 0, recommendations: [] };
        }
        
        try {
            results.yearEnd = await predictionsAI.predictYearEndBalance();
        } catch (e) {
            console.error('Erreur prédiction fin d\'année:', e);
            results.yearEnd = { currentBalance: 0, predictedYearEndBalance: 0, confidenceLevel: 0 };
        }
        
        try {
            results.anomalies = predictionsAI.detectAnomalies();
        } catch (e) {
            console.error('Erreur détection anomalies:', e);
            results.anomalies = [];
        }
        
        try {
            results.recurring = predictionsAI.predictRecurringExpenses();
        } catch (e) {
            console.error('Erreur dépenses récurrentes:', e);
            results.recurring = [];
        }
        
        try {
            results.dataQuality = predictionsAI.assessDataQuality();
        } catch (e) {
            console.error('Erreur qualité des données:', e);
            results.dataQuality = { score: 0, level: 'poor', monthsOfData: 0, issues: [] };
        }
        
        // Mettre à jour chaque section
        updatePredictionCard('next-month-prediction', 'next-month', results.predictions);
        updatePredictionCard('year-end-prediction', 'year-end', results.yearEnd);
        updatePredictionCard('anomalies-detection', 'anomalies', results.anomalies);
        updatePredictionCard('recurring-expenses', 'recurring', results.recurring);
        updatePredictionCard('data-quality-assessment', 'data-quality', results.dataQuality);
        updatePredictionCard('ai-recommendations', 'recommendations', results.predictions.recommendations || []);
        
        console.log('✅ Prédictions mises à jour avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des prédictions:', error);
        showPredictionsError('Erreur lors du calcul des prédictions: ' + error.message);
    }
}

// Fonction pour afficher les indicateurs de chargement
function showPredictionsLoading() {
    const predictionCards = [
        'next-month-prediction',
        'year-end-prediction', 
        'anomalies-detection',
        'recurring-expenses',
        'data-quality-assessment',
        'ai-recommendations'
    ];
    
    predictionCards.forEach(cardId => {
        const element = document.getElementById(cardId);
        if (element) {
            element.innerHTML = '<div class="prediction-loading"><div class="loading-dots">Calcul en cours</div></div>';
        }
    });
}

// Fonction pour afficher les erreurs
function showPredictionsError(message) {
    const predictionCards = [
        'next-month-prediction',
        'year-end-prediction', 
        'anomalies-detection',
        'recurring-expenses',
        'data-quality-assessment',
        'ai-recommendations'
    ];
    
    predictionCards.forEach(cardId => {
        const element = document.getElementById(cardId);
        if (element) {
            element.innerHTML = `<div class="prediction-error">❌ ${message}</div>`;
        }
    });
}

// Fonction pour mettre à jour chaque carte de prédiction
function updatePredictionCard(elementId, type, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        switch (type) {
            case 'next-month':
                element.innerHTML = `
                    <div class="prediction-value">${data.totalAmount.toFixed(2)}€</div>
                    <div class="prediction-confidence">Confiance: ${(data.confidence * 100).toFixed(0)}%</div>
                    ${data.trends && data.trends.overall ? 
                        `<div class="prediction-trend">Tendance: ${getTrendText(data.trends.overall.direction)}</div>` : ''}
                `;
                break;
                
            case 'year-end':
                element.innerHTML = `
                    <div class="prediction-value">${data.predictedYearEndBalance.toFixed(2)}€</div>
                    <div class="prediction-detail">Solde actuel: ${data.currentBalance.toFixed(2)}€</div>
                    <div class="prediction-detail">Confiance: ${(data.confidenceLevel * 100).toFixed(0)}%</div>
                `;
                break;
                
            case 'anomalies':
                if (data.length > 0) {
                    element.innerHTML = `
                        <div class="anomalies-count">${data.length} anomalie(s) détectée(s)</div>
                        <div class="anomalies-list">
                            ${data.slice(0, 3).map(anomaly => 
                                `<div class="anomaly-item">• ${anomaly.description}</div>`
                            ).join('')}
                            ${data.length > 3 ? `<div class="anomaly-more">+${data.length - 3} autres</div>` : ''}
                        </div>
                    `;
                } else {
                    element.innerHTML = '<div class="no-anomalies">✅ Aucune anomalie détectée</div>';
                }
                break;
                
            case 'recurring':
                if (data.length > 0) {
                    element.innerHTML = `
                        <div class="recurring-count">${data.length} dépense(s) récurrente(s)</div>
                        <div class="recurring-list">
                            ${data.slice(0, 3).map(recurring => 
                                `<div class="recurring-item">• ${recurring.category}: ${recurring.amount.toFixed(2)}€</div>`
                            ).join('')}
                            ${data.length > 3 ? `<div class="recurring-more">+${data.length - 3} autres</div>` : ''}
                        </div>
                    `;
                } else {
                    element.innerHTML = '<div class="no-recurring">📋 Aucune dépense récurrente identifiée</div>';
                }
                break;
                
            case 'data-quality':
                element.innerHTML = `
                    <div class="quality-score">Score: ${data.score}/100</div>
                    <div class="quality-level">Niveau: ${getQualityLevelText(data.level)}</div>
                    <div class="quality-months">${data.monthsOfData} mois de données</div>
                    ${data.issues.length > 0 ? 
                        `<div class="quality-issues">⚠️ ${data.issues.length} problème(s) détecté(s)</div>` : 
                        '<div class="quality-good">✅ Qualité satisfaisante</div>'}
                `;
                break;
                
            case 'recommendations':
                if (data.length > 0) {
                    element.innerHTML = `
                        <div class="recommendations-list">
                            ${data.slice(0, 3).map(rec => 
                                `<div class="recommendation-item">
                                    <div class="rec-title">💡 ${rec.title}</div>
                                    <div class="rec-description">${rec.description}</div>
                                </div>`
                            ).join('')}
                        </div>
                    `;
                } else {
                    element.innerHTML = '<div class="no-recommendations">🤖 Aucune recommandation pour le moment</div>';
                }
                break;
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de ${elementId}:`, error);
        element.innerHTML = '<div class="prediction-error">❌ Erreur d\'affichage</div>';
    }
}

// Fonctions utilitaires pour l'affichage
function getTrendText(direction) {
    switch (direction) {
        case 'increasing': return '📈 En hausse';
        case 'decreasing': return '📉 En baisse';
        case 'stable': return '➡️ Stable';
        default: return '❓ Indéterminé';
    }
}

function getQualityLevelText(level) {
    switch (level) {
        case 'excellent': return '🌟 Excellent';
        case 'good': return '✅ Bon';
        case 'fair': return '⚠️ Correct';
        case 'poor': return '❌ Insuffisant';
        default: return '❓ Non évalué';
    }
}

// ===== APPLICATION INITIALIZATION =====
let calendar;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Initialisation de l\'application Budget...');
        
        // Vérifier que tous les scripts sont chargés
        const requiredClasses = [
            'TransactionManager', 'BudgetPredictionsAI', 'ChartsManager', 
            'EnhancedDashboard', 'AdvancedSearchManager', 'ThemeManager'
        ];
        
        const missingClasses = requiredClasses.filter(className => typeof window[className] === 'undefined');
        
        if (missingClasses.length > 0) {
            console.warn('⚠️ Classes manquantes:', missingClasses);
            // Attendre un peu plus longtemps
            setTimeout(() => {
                calendar = new BudgetCalendar();
                window.calendar = calendar;
            }, 1000);
        } else {
            calendar = new BudgetCalendar();
            window.calendar = calendar;
        }
        
        console.log('✅ Application Budget initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        
        // Tentative de récupération
        setTimeout(() => {
            try {
                calendar = new BudgetCalendar();
                window.calendar = calendar;
                console.log('✅ Application récupérée après erreur');
            } catch (retryError) {
                console.error('❌ Échec de la récupération:', retryError);
            }
        }, 2000);
    }
});

