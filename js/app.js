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
        
        this.loadFixedExpensesValues();
        
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
			
			if (this.chartManager) {
				this.analyticsNavigator = new AnalyticsNavigator(this.chartManager, this.transactionManager);
				console.log('✅ Analytics Navigator initialisé');
			}

            // Initialiser le tableau de bord amélioré
            this.enhancedDashboard = new EnhancedDashboard(
                this.transactionManager, 
                this.predictionsAI, 
                this.chartManager
            );

            // Initialiser la recherche avancée
            this.advancedSearch = new AdvancedSearchManager(this.transactionManager);
			window.advancedSearchManager = this.advancedSearch;
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
            
            // Actions spécifiques selon l'onglet avec délais appropriés
            setTimeout(() => {
                switch(tabName) {
                    case 'analytics':
                        // Forcer l'affichage du titre du mois
                        if (this.analyticsNavigator) {
                            this.analyticsNavigator.forceUpdateTitle();
                        }
                        // Mettre à jour les graphiques
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
                            this.advancedSearch.refresh();
                        }
                        break;
                        
                    case 'budget':
                        // Rafraîchir le calendrier
                        this.updateCalendar();
                        this.updateTransactionsList();
                        break;
                        
                    case 'settings':
                        // Pas d'action spécifique nécessaire
                        break;
                }
            }, 50); // Délai court pour s'assurer que l'onglet est activé
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
        const elements = [ 'prev-month', 'next-month']; 
        elements.forEach(id => { 
            const element = document.getElementById(id); 
            if (!element) { 
                console.warn(`⚠️ Élément manquant: ${id}`); 
            } 
        }); 
        
       
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
		
		if (this.elements.fixedImpot) {
            this.elements.fixedImpot.addEventListener('input', () => this.updateFixedExpenses());
        }
		
        if (this.elements.fixedAutres) {
            this.elements.fixedAutres.addEventListener('input', () => this.updateFixedExpenses());
        }
		if (this.elements.fixedAssuranceMaison) {
			this.elements.fixedAssuranceMaison.addEventListener('input', () => this.updateFixedExpenses());
		}
		if (this.elements.fixedAssuranceVoiture) {
			this.elements.fixedAssuranceVoiture.addEventListener('input', () => this.updateFixedExpenses());
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
        
        // Theme listener
        this.setupThemeEventListeners();
        
        console.log('✅ Event listeners configurés'); 
    }

    // ===== UTILITY METHODS =====

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
		
	}
	
	autoFillConstrainedExpense(category) {
		const constrainedExpenseMapping = {
			'Loyer': 'loyer',
			'EDF-GDF': 'edf', 
			'Internet': 'internet',
			'Remboursement crédit': 'credit',
			'Impôt': 'impot', 
			'Autres': 'autres',
			'Assurance maison': 'assuranceMaison',
			'Assurance voiture': 'assuranceVoiture'
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
		if (this.elements.fixedImpot) this.elements.fixedImpot.value = this.fixedExpenses.impot || '';
		if (this.elements.fixedAutres) this.elements.fixedAutres.value = this.fixedExpenses.autres || '';
		if (this.elements.fixedAssuranceMaison) this.elements.fixedAssuranceMaison.value = this.fixedExpenses.assuranceMaison || '';
		if (this.elements.fixedAssuranceVoiture) this.elements.fixedAssuranceVoiture.value = this.fixedExpenses.assuranceVoiture || '';
		
		// Calculer et afficher le total
		this.updateFixedExpensesTotal();
	}

	updateFixedExpenses() {
		const loyer = parseFloat(this.elements.fixedLoyer?.value) || 0;
		const edf = parseFloat(this.elements.fixedEdf?.value) || 0;
		const internet = parseFloat(this.elements.fixedInternet?.value) || 0;
		const credit = parseFloat(this.elements.fixedCredit?.value) || 0;
		const impot = parseFloat(this.elements.fixedImpot?.value) || 0;
		const autres = parseFloat(this.elements.fixedAutres?.value) || 0;
		const assuranceMaison = parseFloat(this.elements.fixedAssuranceMaison?.value) || 0;
		const assuranceVoiture = parseFloat(this.elements.fixedAssuranceVoiture?.value) || 0;
	
		// Mise à jour de l'objet fixedExpenses SANS LE TOTAL
		this.fixedExpenses = {
			loyer,
			edf,
			internet,
			credit,
			impot,
			autres,
			assuranceMaison,
			assuranceVoiture
		};
	
		// Sauvegarder les données
		StorageManager.saveFixedExpenses(this.fixedExpenses);
		
		// Mettre à jour l'affichage du total
		this.updateFixedExpensesTotal();
	}

	updateFixedExpensesTotal() {
		// Calculer le total à partir des valeurs de l'objet fixedExpenses
		const total = Object.values(this.fixedExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
		
		// Afficher le total dans l'élément d'affichage
		if (this.elements.fixedTotalDisplay) {
			this.elements.fixedTotalDisplay.textContent = `${total.toFixed(2)} €`;
		}
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
    
	// ===== METHODES THEME - VERSION CORRIGÉE =====
    
    /**
     * Initialise le système de thèmes 
     */
    initializeModernThemes() {
        try {
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

            // Configurer le sélecteur de thème s'il existe
            if (this.elements && this.elements.themeSelect) {
                console.log('🎨 Configuration du sélecteur de thème...');
                ThemeManager.setupThemeSelector(this.elements.themeSelect, true);
                console.log('✅ Sélecteur de thème configuré');
            } else {
                console.warn('⚠️ Sélecteur de thème non trouvé, thèmes disponibles via raccourcis clavier uniquement');
                
                // Tenter de trouver le sélecteur directement
                const themeSelect = document.getElementById('theme-select');
                if (themeSelect) {
                    console.log('🔄 Sélecteur de thème trouvé directement');
                    ThemeManager.setupThemeSelector(themeSelect, true);
                    // Sauvegarder la référence
                    if (this.elements) {
                        this.elements.themeSelect = themeSelect;
                    }
                }
            }

            // Configurer les événements de thème
            this.setupThemeEventListeners();
            
            console.log('✅ Système de thèmes initialisé');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des thèmes:', error);
            
            // Fallback: appliquer le thème par défaut
            try {
                ThemeManager.applyTheme('light');
                console.log('🔄 Thème par défaut appliqué en récupération');
            } catch (fallbackError) {
                console.error('❌ Impossible d\'appliquer le thème par défaut:', fallbackError);
            }
        }
    }

    /**
     * Configuration des événements de thème
     */
    setupThemeEventListeners() {
        // Écouter les événements de thème personnalisés
        document.addEventListener('themechange', (event) => {
            const { theme, themeInfo } = event.detail;
            console.log(`📢 Événement de changement de thème reçu: ${themeInfo.name}`);
            
            // Mettre à jour le thème actuel
            this.currentTheme = theme;
            
            // Sauvegarder le thème
            try {
                StorageManager.saveTheme(theme);
            } catch (error) {
                console.warn('⚠️ Impossible de sauvegarder le thème:', error);
            }
            
            // Mettre à jour l'aperçu des couleurs
            this.updateThemePreview();
            
            // Mettre à jour les graphiques si nécessaire
            if (this.chartsInitialized) {
                setTimeout(() => {
                    this.updateCharts();
                }, 100);
            }
        });

        // Ajouter des boutons de thème rapide s'ils n'existent pas
        this.addQuickThemeButtons();
    }

    /**
     * Ajoute des boutons de thème rapide dans l'interface
     */
    addQuickThemeButtons() {
        // Chercher un conteneur pour les boutons de thème rapide
        const settingsContainer = document.querySelector('.settings-container');
        const themeCard = document.querySelector('.settings-card h3');
        
        if (settingsContainer && themeCard && themeCard.textContent.includes('Apparence')) {
            const themeCardContainer = themeCard.parentElement;
            
            // Vérifier si les boutons n'existent pas déjà
            if (!themeCardContainer.querySelector('.quick-theme-buttons')) {
                const quickButtonsContainer = document.createElement('div');
                quickButtonsContainer.className = 'quick-theme-buttons';
                quickButtonsContainer.innerHTML = `
                    <div class="quick-theme-actions">
                        <button class="btn-secondary quick-theme-btn" onclick="ThemeManager.toggleDarkMode()">
                            🌙/☀️ Mode Sombre/Clair
                        </button>
                        <button class="btn-secondary quick-theme-btn" onclick="ThemeManager.randomTheme()">
                            🎲 Thème Aléatoire
                        </button>
                        <button class="btn-secondary quick-theme-btn" onclick="ThemeManager.nextTheme()">
                            ➡️ Thème Suivant
                        </button>
                    </div>
                    <div class="theme-shortcuts-info">
                        <small>🎹 Raccourcis: Ctrl+Shift+D (sombre), Ctrl+Shift+T (suivant), Ctrl+Shift+R (aléatoire)</small>
                    </div>
                `;
                
                // Ajouter le CSS pour les boutons rapides
                const style = document.createElement('style');
                style.textContent = `
                    .quick-theme-buttons {
                        margin: 15px 0;
                        padding: 15px;
                        background: var(--surface);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                    }
                    .quick-theme-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-bottom: 10px;
                    }
                    .quick-theme-btn {
                        flex: 1;
                        min-width: 120px;
                        padding: 8px 12px;
                        font-size: 12px;
                        white-space: nowrap;
                    }
                    .theme-shortcuts-info {
                        color: var(--text-color);
                        opacity: 0.7;
                        text-align: center;
                        line-height: 1.4;
                    }
                    @media (max-width: 768px) {
                        .quick-theme-actions {
                            flex-direction: column;
                        }
                        .quick-theme-btn {
                            min-width: auto;
                        }
                    }
                `;
                
                document.head.appendChild(style);
                
                // Insérer après le sélecteur de thème
                const themeSelector = themeCardContainer.querySelector('.theme-selector');
                if (themeSelector) {
                    themeSelector.parentNode.insertBefore(quickButtonsContainer, themeSelector.nextSibling);
                } else {
                    themeCardContainer.appendChild(quickButtonsContainer);
                }
                
                console.log('✅ Boutons de thème rapide ajoutés');
            }
        }
    }

    /**
     * Change de thème
     */
    changeTheme(newTheme) {
        try {
            if (ThemeManager.changeTheme(newTheme)) {
                this.currentTheme = newTheme;
                
                // Animation de transition
                document.body.classList.add('theme-transition-active');
                setTimeout(() => {
                    document.body.classList.remove('theme-transition-active');
                }, 300);
                
                // Mettre à jour l'aperçu des couleurs
                this.updateThemePreview();
                
                console.log(`✅ Thème changé vers: ${newTheme}`);
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur lors du changement de thème:', error);
            return false;
        }
    }

    /**
     * Applique un thème
     */
    applyTheme(theme) {
        try {
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
            
            console.log(`✅ Thème appliqué: ${theme}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'application du thème:', error);
        }
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

        // Mettre à jour les couleurs de prévisualisation
        this.updateThemePreviewColors();
    }

    /**
     * Met à jour les couleurs de prévisualisation dans l'interface
     */
    updateThemePreviewColors() {
        try {
            const colors = ThemeManager.extractCSSColors();
            
            // Mettre à jour les éléments de prévisualisation
            const previewElements = {
                '.preview-primary': colors.primary,
                '.preview-secondary': colors.success,
                '.preview-accent': colors.accent,
                '.preview-quaternary': colors.quaternary,
                '.preview-quinary': colors.quinary,
                '.preview-senary': colors.senary,
                '.preview-septenary': colors.septenary,
                '.preview-warning': colors.warning,
                '.preview-danger': colors.danger,
                '.preview-info': colors.info
            };

            Object.entries(previewElements).forEach(([selector, color]) => {
                const element = document.querySelector(selector);
                if (element && color) {
                    element.style.backgroundColor = color;
                }
            });

            // Mettre à jour l'échantillon de texte
            const textSample = document.querySelector('.preview-text-sample');
            if (textSample) {
                textSample.style.background = colors.background;
                textSample.style.color = colors.text;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de mettre à jour l\'aperçu des couleurs:', error);
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


// ===== initializeElements - VERSION CORRIGÉE =====
    initializeElements() {
        this.elements = {};
        
        const elementIds = [
            // Navigation du calendrier
            'prev-month', 'next-month', 'month-year', 'calendar-grid',
            
            // Résumés financiers
            'month-income', 'month-expenses', 'month-balance', 'total-balance',
            
            // Section des transactions
            'transactions-title', 'selected-day-info', 'transactions-list', 'no-transactions',
            
            // Dépenses fixes
            'fixed-loyer', 'fixed-edf', 'fixed-internet', 'fixed-credit', 'fixed-impot', 'fixed-autres',
            'fixed-assurance-maison', 'fixed-assurance-voiture', 'fixed-total-display',
            
            // Actions sur les données
            'export-data', 'import-data', 'import-file', 'clear-data', 
            
            // Sélecteur de thème
            'theme-select'
            
            // ELEMENTS RETIRÉS CAR NON PRÉSENTS DANS LE HTML:
            // 'date', 'expense-label', 'income-label'
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
    
        // Éléments spéciaux (collections)
        this.elements.tabBtns = document.querySelectorAll('.tab-btn') || [];
        this.elements.tabContents = document.querySelectorAll('.tab-content') || [];
        
        // Alias pour compatibilité avec le code existant
        this.elements.exportBtn = this.elements.exportData;
        this.elements.importBtn = this.elements.importData;
        this.elements.clearBtn = this.elements.clearData;
        
        console.log('✅ Éléments DOM initialisés:', Object.keys(this.elements).length, 'éléments trouvés');
        
        // Vérifier si le sélecteur de thème existe
        if (!this.elements.themeSelect) {
            console.warn('⚠️ Sélecteur de thème non trouvé dans le HTML');
        }
    }

    // ===== TRANSACTION METHODS =====
  
    validateTransaction(transaction) {
        if (!transaction.label) return "Le libellé est obligatoire";
        if (isNaN(transaction.amount) || transaction.amount <= 0) return "Le montant doit être positif";
        if (!transaction.category) return "Veuillez sélectionner une catégorie";
        if (!transaction.date) return "La date est obligatoire";
        return null;
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
	
	editTransaction(id) {
		const transaction = this.transactionManager?.getTransaction(id) || 
							this.transactions.find(t => t.id === parseInt(id));
                       
		if (!transaction) {
			alert('Transaction introuvable');
			return;
		}
    
		// Remplir le formulaire avec les données existantes
		this.elements.label.value = transaction.label;
		this.elements.amount.value = transaction.amount;
		this.elements.category.value = transaction.category;
		this.elements.date.value = transaction.date;
    
		// Sélectionner le bon type
		if (transaction.type === 'income') {
			this.elements.typeIncome.checked = true;
		} else {
			this.elements.typeExpense.checked = true;
		}
    
    
		// Passer en mode édition
		this.setEditMode(id);
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

        // ===== NOUVEL INDICATEUR D'AJOUT =====
        // Ajouter l'indicateur "+" en haut à droite (seulement pour le mois courant)
        if (!isOtherMonth) {
            const addIndicator = document.createElement('div');
            addIndicator.className = 'add-transaction-indicator';
            addIndicator.innerHTML = ''; // Laisser vide, le + sera créé en CSS
            addIndicator.title = 'Ajouter une transaction';
            
            // Event listener pour l'indicateur (empêche la propagation vers le clic sur la case)
            addIndicator.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche le clic sur la case
                this.openTransactionModal(dayDate);
            });
            
            dayElement.appendChild(addIndicator);
        }

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
            totalElement.textContent = `${total >= 0 ? '+' : ''}${total.toFixed(2)}€`;
            dayElement.appendChild(totalElement);
        }

        // Click handler pour la case (affiche les transactions)
        dayElement.addEventListener('click', (e) => {
            // Seulement si ce n'est pas l'indicateur d'ajout qui a été cliqué
            if (!e.target.classList.contains('add-transaction-indicator')) {
                this.selectDate(dayDate);
            }
        });

        this.elements.calendarGrid.appendChild(dayElement);
    }

    // ===== NOUVELLE MÉTHODE POUR OUVRIR LA MODAL =====
    openTransactionModal(date) {
        // Formater la date pour l'affichage
        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Créer la modal
        const modal = document.createElement('div');
        modal.className = 'transaction-modal-overlay';
        modal.innerHTML = `
            <div class="transaction-modal">
                <div class="transaction-modal-header">
                    <h3>💰 Nouvelle transaction</h3>
                    <div class="transaction-modal-subtitle">${formattedDate}</div>
                    <button class="modal-close" onclick="this.closest('.transaction-modal-overlay').remove()">×</button>
                </div>
                <div class="transaction-modal-content">
                    <form id="modal-transaction-form">
                        <!-- Catégorie et Libellé -->
                        <div class="modal-form-row">
                            <div class="modal-form-group">
                                <label for="modal-category">Catégorie</label>
                                <select id="modal-category" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="Alimentation">🍕 Alimentation</option>
                                    <option value="Assurance maison">🏠🛡️ Assurance maison</option>
                                    <option value="Assurance voiture">🚗🛡️ Assurance voiture</option>
                                    <option value="Cigarettes">🚬 Cigarettes</option>
                                    <option value="EDF-GDF">⚡ EDF-GDF</option>
                                    <option value="Essence">⛽ Essence</option>
                                    <option value="Impôt">🏛️ Impôt</option>
                                    <option value="Internet">🌐 Internet</option>
                                    <option value="Internet Outils">🔧 Internet Outils</option>
                                    <option value="Logement">🏠 Logement</option>
                                    <option value="Loisirs">🎬 Loisirs</option>
                                    <option value="Loyer">🏠 Loyer</option>
                                    <option value="Prêt">💳 Prêt</option>
                                    <option value="Remboursement crédit">🏦 Remboursement crédit</option>
                                    <option value="Retrait DAB">🏧 Retrait DAB</option>
                                    <option value="Salaire">💼 Salaire</option>
                                    <option value="Santé">🏥 Santé</option>
                                    <option value="Transport">🚗 Transport</option>
                                    <option value="Vêtements">👕 Vêtements</option>
                                    <option value="Autres">📦 Autres</option>
                                </select>
                            </div>
                            
                            <div class="modal-form-group">
                                <label for="modal-label">Libellé</label>
                                <input type="text" id="modal-label" placeholder="Description" required />
                            </div>
                        </div>
                        
                        <!-- Montant et Type (sur la même ligne) -->
                        <div class="modal-form-row">
                            <div class="modal-form-group">
                                <label for="modal-amount">Montant (€)</label>
                                <input type="number" id="modal-amount" placeholder="0.00" step="0.01" required />
                            </div>
                            
                            <div class="modal-form-group">
                                <label>&nbsp;</label> <!-- Espace pour l'alignement -->
                                <div class="modal-radio-group">
                                    <label class="modal-radio-label expense-option">
                                        <input type="radio" id="modal-type-expense" name="modal-type" value="expense" checked />
                                        <span class="radio-custom"></span>
                                        <span>💸 Dépense</span>
                                    </label>
                                    <label class="modal-radio-label income-option">
                                        <input type="radio" id="modal-type-income" name="modal-type" value="income" />
                                        <span class="radio-custom"></span>
                                        <span>💰 Revenu</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Date (cachée et bloquée) -->
                        <input type="hidden" id="modal-date" value="${this.formatDateString(date)}" />
                        
                        <!-- Boutons -->
                        <div class="modal-form-actions">
                            <button type="button" class="btn-secondary modal-cancel" onclick="this.closest('.transaction-modal-overlay').remove()">
                                ❌ Annuler
                            </button>
                            <button type="submit" class="btn-success">
                                ✅ Ajouter
                            </button>
                        </div>
                        
                        <div class="modal-error-message" id="modal-error-message"></div>
                    </form>
                </div>
            </div>
        `;

        // Ajouter la modal au DOM
        document.body.appendChild(modal);

        // Setup des event listeners pour la modal
        this.setupModalEventListeners(modal, date);

        // Focus sur le premier champ
        setTimeout(() => {
            const categorySelect = modal.querySelector('#modal-category');
            if (categorySelect) categorySelect.focus();
        }, 100);

        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ===== SETUP DES EVENT LISTENERS POUR LA MODAL =====
    setupModalEventListeners(modal, date) {
        const form = modal.querySelector('#modal-transaction-form');
        const categorySelect = modal.querySelector('#modal-category');
        const labelInput = modal.querySelector('#modal-label');
        
        // Auto-remplissage du libellé basé sur la catégorie
        categorySelect.addEventListener('change', () => {
            if (categorySelect.value && !labelInput.value) {
                labelInput.value = categorySelect.value;
            }
            
            // Auto-remplissage depuis les dépenses contraintes
            this.autoFillConstrainedExpenseInModal(categorySelect.value, modal);
        });

        // Gestion de la soumission du formulaire
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleModalSubmit(modal, date);
        });

        // Gestion des touches clavier
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // ===== AUTO-REMPLISSAGE DES DÉPENSES CONTRAINTES DANS LA MODAL =====
    autoFillConstrainedExpenseInModal(category, modal) {
        const constrainedExpenseMapping = {
            'Loyer': 'loyer',
            'EDF-GDF': 'edf', 
            'Internet': 'internet',
            'Remboursement crédit': 'credit',
            'Impôt': 'impot', 
            'Autres': 'autres',
            'Assurance maison': 'assuranceMaison',
            'Assurance voiture': 'assuranceVoiture'
        };

        const fixedExpenseKey = constrainedExpenseMapping[category];

        if (fixedExpenseKey && this.fixedExpenses[fixedExpenseKey] > 0) {
            const amountInput = modal.querySelector('#modal-amount');
            if (amountInput) {
                amountInput.value = this.fixedExpenses[fixedExpenseKey].toFixed(2);
                
                // Indication visuelle
                amountInput.style.background = '#e8f5e8';
                setTimeout(() => {
                    amountInput.style.background = '';
                }, 2000);
            }
        }
    }

    // ===== GESTION DE LA SOUMISSION DE LA MODAL =====
    handleModalSubmit(modal, date) {
        const errorElement = modal.querySelector('#modal-error-message');
        errorElement.textContent = '';

        // Récupérer les données du formulaire
        const transactionData = {
            label: modal.querySelector('#modal-label').value.trim(),
            amount: parseFloat(modal.querySelector('#modal-amount').value),
            category: modal.querySelector('#modal-category').value,
            date: this.formatDateString(date),
            type: modal.querySelector('#modal-type-expense').checked ? 'expense' : 'income'
        };

        // Validation
        const error = this.validateTransaction(transactionData);
        if (error) {
            errorElement.textContent = error;
            return;
        }

        try {
            // Ajouter la transaction
            transactionData.id = Date.now();
            
            if (this.transactionManager) {
                this.transactionManager.addTransaction(transactionData);
                this.transactions = this.transactionManager.getAllTransactions();
            } else {
                this.transactions.push(transactionData);
                StorageManager.saveTransactions(this.transactions);
            }

            // Mettre à jour l'affichage
            this.updateAllComponents();
            
            // Fermer la modal
            modal.remove();
            
            console.log('✅ Transaction ajoutée via modal avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout via modal:', error);
            errorElement.textContent = error.message;
        }
    }

    // ===== NOUVELLE MÉTHODE POUR OUVRIR LA MODAL =====
    openTransactionModal(date) {
        // Formater la date pour l'affichage
        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Créer la modal
        const modal = document.createElement('div');
        modal.className = 'transaction-modal-overlay';
        modal.innerHTML = `
            <div class="transaction-modal">
                <div class="transaction-modal-header">
                    <h3>💰 Nouvelle transaction</h3>
                    <div class="transaction-modal-subtitle">${formattedDate}</div>
                    <button class="modal-close" onclick="this.closest('.transaction-modal-overlay').remove()">×</button>
                </div>
                <div class="transaction-modal-content">
                    <form id="modal-transaction-form">
                        <!-- Catégorie et Libellé -->
                        <div class="modal-form-row">
                            <div class="modal-form-group">
                                <label for="modal-category">Catégorie</label>
                                <select id="modal-category" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="Alimentation">🍕 Alimentation</option>
                                    <option value="Assurance maison">🏠🛡️ Assurance maison</option>
                                    <option value="Assurance voiture">🚗🛡️ Assurance voiture</option>
                                    <option value="Cigarettes">🚬 Cigarettes</option>
                                    <option value="EDF-GDF">⚡ EDF-GDF</option>
                                    <option value="Essence">⛽ Essence</option>
                                    <option value="Impôt">🏛️ Impôt</option>
                                    <option value="Internet">🌐 Internet</option>
                                    <option value="Internet Outils">🔧 Internet Outils</option>
                                    <option value="Logement">🏠 Logement</option>
                                    <option value="Loisirs">🎬 Loisirs</option>
                                    <option value="Loyer">🏠 Loyer</option>
                                    <option value="Prêt">💳 Prêt</option>
                                    <option value="Remboursement crédit">🏦 Remboursement crédit</option>
                                    <option value="Retrait DAB">🏧 Retrait DAB</option>
                                    <option value="Salaire">💼 Salaire</option>
                                    <option value="Santé">🏥 Santé</option>
                                    <option value="Transport">🚗 Transport</option>
                                    <option value="Vêtements">👕 Vêtements</option>
                                    <option value="Autres">📦 Autres</option>
                                </select>
                            </div>
                            
                            <div class="modal-form-group">
                                <label for="modal-label">Libellé</label>
                                <input type="text" id="modal-label" placeholder="Description" required />
                            </div>
                        </div>
                        
                        <!-- Montant et Type -->
                        <div class="modal-form-row">
                            <div class="modal-form-group">
                                <label for="modal-amount">Montant (€)</label>
                                <input type="number" id="modal-amount" placeholder="0.00" step="0.01" required />
                            </div>
                            
                            <div class="modal-form-group">
                                <label>Type</label>
                                <div class="modal-radio-group">
                                    <label class="modal-radio-label expense-option">
                                        <input type="radio" id="modal-type-expense" name="modal-type" value="expense" checked />
                                        <span class="radio-custom"></span>
                                        <span>💸 Dépense</span>
                                    </label>
                                    <label class="modal-radio-label income-option">
                                        <input type="radio" id="modal-type-income" name="modal-type" value="income" />
                                        <span class="radio-custom"></span>
                                        <span>💰 Revenu</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Date (cachée et bloquée) -->
                        <input type="hidden" id="modal-date" value="${this.formatDateString(date)}" />
                        
                        <!-- Boutons -->
                        <div class="modal-form-actions">
                            <button type="button" class="btn-secondary modal-cancel" onclick="this.closest('.transaction-modal-overlay').remove()">
                                ❌ Annuler
                            </button>
                            <button type="submit" class="btn-success">
                                ✅ Ajouter
                            </button>
                        </div>
                        
                        <div class="modal-error-message" id="modal-error-message"></div>
                    </form>
                </div>
            </div>
        `;

        // Ajouter la modal au DOM
        document.body.appendChild(modal);

        // Setup des event listeners pour la modal
        this.setupModalEventListeners(modal, date);

        // Focus sur le premier champ
        setTimeout(() => {
            const categorySelect = modal.querySelector('#modal-category');
            if (categorySelect) categorySelect.focus();
        }, 100);

        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ===== SETUP DES EVENT LISTENERS POUR LA MODAL =====
    setupModalEventListeners(modal, date) {
        const form = modal.querySelector('#modal-transaction-form');
        const categorySelect = modal.querySelector('#modal-category');
        const labelInput = modal.querySelector('#modal-label');
        
        // Auto-remplissage du libellé basé sur la catégorie
        categorySelect.addEventListener('change', () => {
            if (categorySelect.value && !labelInput.value) {
                labelInput.value = categorySelect.value;
            }
            
            // Auto-remplissage depuis les dépenses contraintes
            this.autoFillConstrainedExpenseInModal(categorySelect.value, modal);
        });

        // Gestion de la soumission du formulaire
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleModalSubmit(modal, date);
        });

        // Gestion des touches clavier
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // ===== AUTO-REMPLISSAGE DES DÉPENSES CONTRAINTES DANS LA MODAL =====
    autoFillConstrainedExpenseInModal(category, modal) {
        const constrainedExpenseMapping = {
            'Loyer': 'loyer',
            'EDF-GDF': 'edf', 
            'Internet': 'internet',
            'Remboursement crédit': 'credit',
            'Impôt': 'impot', 
            'Autres': 'autres',
            'Assurance maison': 'assuranceMaison',
            'Assurance voiture': 'assuranceVoiture'
        };

        const fixedExpenseKey = constrainedExpenseMapping[category];

        if (fixedExpenseKey && this.fixedExpenses[fixedExpenseKey] > 0) {
            const amountInput = modal.querySelector('#modal-amount');
            if (amountInput) {
                amountInput.value = this.fixedExpenses[fixedExpenseKey].toFixed(2);
                
                // Indication visuelle
                amountInput.style.background = '#e8f5e8';
                setTimeout(() => {
                    amountInput.style.background = '';
                }, 2000);
            }
        }
    }

    // ===== GESTION DE LA SOUMISSION DE LA MODAL =====
    handleModalSubmit(modal, date) {
        const errorElement = modal.querySelector('#modal-error-message');
        errorElement.textContent = '';

        // Récupérer les données du formulaire
        const transactionData = {
            label: modal.querySelector('#modal-label').value.trim(),
            amount: parseFloat(modal.querySelector('#modal-amount').value),
            category: modal.querySelector('#modal-category').value,
            date: this.formatDateString(date),
            type: modal.querySelector('#modal-type-expense').checked ? 'expense' : 'income'
        };

        // Validation
        const error = this.validateTransaction(transactionData);
        if (error) {
            errorElement.textContent = error;
            return;
        }

        try {
            // Ajouter la transaction
            transactionData.id = Date.now();
            
            if (this.transactionManager) {
                this.transactionManager.addTransaction(transactionData);
                this.transactions = this.transactionManager.getAllTransactions();
            } else {
                this.transactions.push(transactionData);
                StorageManager.saveTransactions(this.transactions);
            }

            // Mettre à jour l'affichage
            this.updateAllComponents();
            
            // Fermer la modal
            modal.remove();
            
            console.log('✅ Transaction ajoutée via modal avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout via modal:', error);
            errorElement.textContent = error.message;
        }
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
			<td class="transaction-actions">
				<button class="btn-edit" onclick="window.calendar.editTransaction('${transaction.id}')" title="Modifier">
					✏️
				</button>
				<button class="btn-danger" onclick="window.calendar.deleteTransaction('${transaction.id}')" title="Supprimer">
					🗑️
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
        
        try {
            // Utiliser le chart manager si disponible
            if (this.chartManager) {
                this.chartManager.init();
                this.chartsInitialized = true;
                console.log('✅ Charts initialisés via ChartManager');
            } else {
                // Fallback vers l'ancienne méthode
                this.createCategoryChart();
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
            } 
			else {
                // Fallback vers l'ancienne méthode
                this.updateCategoryChart();
            }
			console.log('✅ Chart catégorie mis à jour');
        } 
		catch (error) {
            console.error('❌ Erreur lors de la mise à jour du chart:', error);
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
})

// ===== ANALYTICS NAVIGATOR =====
class AnalyticsNavigator {
        constructor(chartManager, transactionManager) {
            this.chartManager = chartManager;
            this.transactionManager = transactionManager;
            this.currentAnalysisDate = new Date();
            this.setupEventListeners();
            // Différer l'appel de updateTitle() pour s'assurer que l'élément existe
            setTimeout(() => {
                this.updateTitle();
            }, 100);
        }
        
        setupEventListeners() {
            // Navigation boutons
            document.getElementById('prev-analysis-month')?.addEventListener('click', () => {
                this.previousMonth();
            });
            
            document.getElementById('next-analysis-month')?.addEventListener('click', () => {
                this.nextMonth();
            });
            
            // Sélecteur de mois - CORRECTION: apply-month au lieu de apply-analysis-month
            document.getElementById('apply-month')?.addEventListener('click', () => {
                const monthInput = document.getElementById('analysis-month-select');
                if (monthInput.value) {
                    const [year, month] = monthInput.value.split('-');
                    this.currentAnalysisDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                    this.updateChart();
                    this.updateTitle();
                }
            });
            
            // Event listeners pour les champs de dépenses contraintes
            const fixedExpenseFields = [
                'fixedLoyer', 'fixedEdf', 'fixedInternet', 'fixedCredit', 
                'fixedImpot', 'fixedAutres', 'fixedAssuranceMaison', 'fixedAssuranceVoiture'
            ];
            
            fixedExpenseFields.forEach(fieldName => {
                const element = document.getElementById(fieldName);
                if (element) {
                    // Event listener pour la saisie en temps réel
                    element.addEventListener('input', () => {
                        this.updateFixedExpenses();
                    });
                    
                    // Event listener pour la validation quand l'utilisateur quitte le champ
                    element.addEventListener('blur', () => {
                        this.updateFixedExpenses();
                    });
                }
            });

            console.log('✅ Event listeners pour Analytics Navigator configurés');
        }
        
        previousMonth() {
            this.currentAnalysisDate.setMonth(this.currentAnalysisDate.getMonth() - 1);
            this.updateChart();
            this.updateTitle();
        }
        
        nextMonth() {
            this.currentAnalysisDate.setMonth(this.currentAnalysisDate.getMonth() + 1);
            this.updateChart();
            this.updateTitle();
        }
        
        updateChart() {
            if (this.chartManager && this.chartManager.updateCategoryChart) {
                // Passer la date sélectionnée au chart manager
                this.chartManager.updateCategoryChart(
                    this.currentAnalysisDate.getFullYear(),
                    this.currentAnalysisDate.getMonth()
                );
            } else if (window.calendar && window.calendar.updateCategoryChart) {
                // Fallback vers l'instance globale
                window.calendar.updateAnalyticsCategoryChart(
                    this.currentAnalysisDate.getFullYear(),
                    this.currentAnalysisDate.getMonth()
                );
            }
        }
        
        updateTitle() {
            const titleElement = document.getElementById('analysis-month-title');
            if (!titleElement) {
                console.warn('⚠️ Élément analysis-month-title non trouvé');
                // Essayer de nouveau après un délai
                setTimeout(() => {
                    this.updateTitle();
                }, 500);
                return;
            }
            
            const monthName = this.currentAnalysisDate.toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            titleElement.textContent = `Dépenses par Catégorie - ${monthName}`;
            
            // Synchroniser le sélecteur de mois
            const monthSelect = document.getElementById('analysis-month-select');
            if (monthSelect) {
                const year = this.currentAnalysisDate.getFullYear();
                const month = String(this.currentAnalysisDate.getMonth() + 1).padStart(2, '0');
                monthSelect.value = `${year}-${month}`;
            }
            
            console.log('✅ Titre mis à jour:', monthName);
        }
        
        // Méthode publique pour forcer la mise à jour du titre
        forceUpdateTitle() {
            console.log('🔄 Mise à jour forcée du titre Analytics');
            this.updateTitle();
        }
        
        // Méthode utilitaire pour les dépenses fixes (si nécessaire)
        updateFixedExpenses() {
            // Cette méthode devrait être dans la classe principale
            if (window.calendar && window.calendar.updateFixedExpenses) {
                window.calendar.updateFixedExpenses();
            }
        }
    }