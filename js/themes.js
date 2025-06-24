		// ===== GESTIONNAIRE DE THÈMES AVANCÉ =====
class ThemeManager {
    static themes = {
        light: {
            name: '☀️ Classique Clair',
            category: 'Base',
            isDark: false,
            description: 'Thème par défaut lumineux et propre'
        },
        aurora: {
            name: '🌌 Aurore Boréale',
            category: 'Nature',
            isDark: false,
            description: 'Inspiré des aurores boréales avec des bleus et verts mystiques'
        },
        volcanic: {
            name: '🌋 Volcanic',
            category: 'Énergie',
            isDark: false,
            description: 'Puissance du magma avec des rouges ardents'
        },
        midnight: {
            name: '🌙 Midnight Ocean',
            category: 'Sombre',
            isDark: true,
            description: 'Profondeurs océaniques nocturnes'
        },
        golden: {
            name: '✨ Golden Sand',
            category: 'Chaleur',
            isDark: false,
            description: 'Chaleur dorée du désert au coucher du soleil'
        },
        emerald: {
            name: '💚 Emerald Forest',
            category: 'Nature',
            isDark: false,
            description: 'Fraîcheur de la forêt d\'émeraude'
        },
        cosmic: {
            name: '🪐 Cosmic Purple',
            category: 'Espace',
            isDark: false,
            description: 'Mystères cosmiques violets'
        },
        sakura: {
            name: '🌸 Sakura Bloom',
            category: 'Élégance',
            isDark: false,
            description: 'Douceur des cerisiers en fleur'
        },
        arctic: {
            name: '❄️ Arctic Ice',
            category: 'Fraîcheur',
            isDark: false,
            description: 'Pureté glaciale de l\'arctique'
        },
        royal: {
            name: '👑 Royal Navy',
            category: 'Prestige',
            isDark: false,
            description: 'Élégance royale bleu marine'
        },
        sunset: {
            name: '🌅 Sunset Glow',
            category: 'Chaleur',
            isDark: false,
            description: 'Lueur chaleureuse du couchant'
        },
        monochrome: {
            name: '⚫ Monochrome',
            category: 'Minimalisme',
            isDark: false,
            description: 'Élégance monochrome intemporelle'
        },
        cyber: {
            name: '🤖 Cybernetic',
            category: 'Futuriste',
            isDark: true,
            description: 'Interface cybernétique futuriste'
        }
    };

    static currentTheme = 'light';
    static onThemeChange = null;
    static transitionDuration = 300;

    /**
     * Initialise le gestionnaire de thèmes
     * @param {string} initialTheme - Thème initial
     * @param {Function} onChangeCallback - Callback appelé lors du changement
     */
    static init(initialTheme = 'light', onChangeCallback = null) {
        this.currentTheme = initialTheme;
        this.onThemeChange = onChangeCallback;
        this.applyTheme(initialTheme);
        this.setupKeyboardShortcuts();
        this.detectSystemPreference();
    }

    /**
     * Applique un thème
     * @param {string} theme - Nom du thème
     */
    static applyTheme(theme) {
        // Validation du thème
        if (!this.themes[theme]) {
            console.warn(`Thème inconnu: ${theme}, retour au thème par défaut`);
            theme = 'light';
        }

        // Animation de transition
        this.addTransitionEffect();

        // Retirer l'ancien thème
        document.documentElement.removeAttribute('data-theme');
        
        // Appliquer le nouveau thème
        if (theme !== 'light') {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Mettre à jour les variables CSS custom si nécessaire
        this.updateCustomProperties(theme);
        
        this.currentTheme = theme;
        
        // Sauvegarder dans le localStorage
        this.saveTheme(theme);
        
        // Mettre à jour les meta tags pour mobile
        this.updateMetaThemeColor(theme);
        
        // Déclencher le callback
        if (this.onThemeChange) {
            this.onThemeChange(theme, this.themes[theme]);
        }

        // Émettre un événement custom
        this.dispatchThemeChangeEvent(theme);
    }

    /**
     * Change de thème avec animation
     * @param {string} newTheme - Nouveau thème
     */
    static changeTheme(newTheme) {
        if (!this.themes[newTheme]) {
            console.warn(`Thème inconnu: ${newTheme}`);
            return false;
        }

        if (newTheme === this.currentTheme) {
            return false; // Même thème, pas de changement
        }

        this.applyTheme(newTheme);
        return true;
    }

    /**
     * Passe au thème suivant dans la liste
     */
    static nextTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];
        
        this.changeTheme(nextTheme);
        return nextTheme;
    }

    /**
     * Passe au thème précédent dans la liste
     */
    static previousTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const prevIndex = currentIndex === 0 ? themeKeys.length - 1 : currentIndex - 1;
        const prevTheme = themeKeys[prevIndex];
        
        this.changeTheme(prevTheme);
        return prevTheme;
    }

    /**
     * Bascule entre thème clair et sombre
     */
    static toggleDarkMode() {
        const currentIsDark = this.isDarkTheme();
        
        if (currentIsDark) {
            // Chercher un thème clair de la même catégorie ou retourner à light
            const lightTheme = this.findSimilarTheme(this.currentTheme, false) || 'light';
            this.changeTheme(lightTheme);
        } else {
            // Chercher un thème sombre ou utiliser midnight
            const darkTheme = this.findSimilarTheme(this.currentTheme, true) || 'midnight';
            this.changeTheme(darkTheme);
        }
    }

    /**
     * Trouve un thème similaire (même catégorie) mais différent mode (clair/sombre)
     * @param {string} currentTheme - Thème actuel
     * @param {boolean} wantDark - Veut un thème sombre
     * @returns {string|null} - Thème trouvé ou null
     */
    static findSimilarTheme(currentTheme, wantDark) {
        const currentCategory = this.themes[currentTheme]?.category;
        
        if (!currentCategory) return null;

        const similar = Object.entries(this.themes).find(([key, theme]) => 
            key !== currentTheme && 
            theme.category === currentCategory && 
            theme.isDark === wantDark
        );

        return similar ? similar[0] : null;
    }

    /**
     * Retourne le thème actuel
     */
    static getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Retourne les informations du thème actuel
     */
    static getCurrentThemeInfo() {
        return {
            key: this.currentTheme,
            ...this.themes[this.currentTheme]
        };
    }

    /**
     * Retourne la liste de tous les thèmes
     */
    static getThemesList() {
        return Object.entries(this.themes).map(([key, theme]) => ({
            key,
            ...theme
        }));
    }

    /**
     * Retourne les thèmes groupés par catégorie
     */
    static getThemesByCategory() {
        const categories = {};
        
        Object.entries(this.themes).forEach(([key, theme]) => {
            const category = theme.category || 'Autres';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ key, ...theme });
        });

        return categories;
    }

    /**
     * Vérifie si un thème est sombre
     * @param {string} theme - Nom du thème (optionnel, utilise le thème actuel)
     */
    static isDarkTheme(theme = null) {
        const themeToCheck = theme || this.currentTheme;
        return this.themes[themeToCheck]?.isDark || false;
    }

    /**
     * Peuple un élément select avec les thèmes
     * @param {HTMLSelectElement} selectElement - Élément select
     * @param {boolean} groupByCategory - Grouper par catégorie
     */
    static populateThemeSelector(selectElement, groupByCategory = true) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        
        if (groupByCategory) {
            const categories = this.getThemesByCategory();
            
            Object.entries(categories).forEach(([categoryName, themes]) => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = categoryName;
                
                themes.forEach(theme => {
                    const option = document.createElement('option');
                    option.value = theme.key;
                    option.textContent = theme.name;
                    option.title = theme.description;
                    
                    if (theme.key === this.currentTheme) {
                        option.selected = true;
                    }
                    
                    optgroup.appendChild(option);
                });
                
                selectElement.appendChild(optgroup);
            });
        } else {
            Object.entries(this.themes).forEach(([key, theme]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = theme.name;
                option.title = theme.description;
                
                if (key === this.currentTheme) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });
        }
    }

    /**
     * Configure un sélecteur de thème
     * @param {HTMLSelectElement} selectElement - Élément select
     * @param {boolean} groupByCategory - Grouper par catégorie
     */
    static setupThemeSelector(selectElement, groupByCategory = true) {
        this.populateThemeSelector(selectElement, groupByCategory);
        
        selectElement.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Mettre à jour le sélecteur quand le thème change
        document.addEventListener('themechange', (e) => {
            if (selectElement.value !== e.detail.theme) {
                selectElement.value = e.detail.theme;
            }
        });
    }

    /**
     * Retourne les couleurs du thème actuel
     * @param {string} theme - Thème spécifique (optionnel)
     */
    static getThemeColors(theme = null) {
        const themeToCheck = theme || this.currentTheme;
        
        // Appliquer temporairement le thème si différent
        if (theme && theme !== this.currentTheme) {
            const originalTheme = this.currentTheme;
            this.applyTheme(theme);
            const colors = this.extractCSSColors();
            this.applyTheme(originalTheme);
            return colors;
        }
        
        return this.extractCSSColors();
    }

    /**
     * Extrait les couleurs CSS actuelles
     */
    static extractCSSColors() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
        primary: computedStyle.getPropertyValue('--primary-color').trim(),
        success: computedStyle.getPropertyValue('--success-color').trim(),
        danger: computedStyle.getPropertyValue('--danger-color').trim(),
        warning: computedStyle.getPropertyValue('--warning-color').trim(),
        info: computedStyle.getPropertyValue('--info-color').trim(),
        accent: computedStyle.getPropertyValue('--accent-color').trim(),
        background: computedStyle.getPropertyValue('--background').trim(),
        surface: computedStyle.getPropertyValue('--surface').trim(),
        text: computedStyle.getPropertyValue('--text-color').trim(),
        border: computedStyle.getPropertyValue('--border-color').trim(),
        quaternary: computedStyle.getPropertyValue('--quaternary-color').trim(),
        quinary: computedStyle.getPropertyValue('--quinary-color').trim(),
        senary: computedStyle.getPropertyValue('--senary-color').trim(),
        septenary: computedStyle.getPropertyValue('--septenary-color').trim()
    };
}

    /**
     * Ajoute un effet de transition lors du changement de thème
     */
    static addTransitionEffect() {
        document.body.style.transition = `all ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            document.body.style.transition = '';
        }, this.transitionDuration);
    }

    /**
     * Met à jour les propriétés CSS personnalisées si nécessaire
     * @param {string} theme - Nom du thème
     */
    static updateCustomProperties(theme) {
        // Cette fonction peut être étendue pour des ajustements spécifiques
        const root = document.documentElement;
        
        // Ajustements spéciaux pour certains thèmes
        if (theme === 'cyber') {
            root.style.setProperty('--glow-intensity', '0.8');
            root.style.setProperty('--animation-speed', '2s');
        } else {
            root.style.removeProperty('--glow-intensity');
            root.style.removeProperty('--animation-speed');
        }
    }

    /**
     * Met à jour la couleur de thème pour mobile (meta tag)
     * @param {string} theme - Nom du thème
     */
    static updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        // Obtenir la couleur primaire du thème
        const colors = this.extractCSSColors();
        metaThemeColor.content = colors.primary || '#2563eb';
    }

    /**
     * Émet un événement personnalisé lors du changement de thème
     * @param {string} theme - Nom du nouveau thème
     */
    static dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: theme,
                themeInfo: this.themes[theme],
                previousTheme: this.currentTheme
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Configure les raccourcis clavier pour les thèmes
     */
    static setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + T : Thème suivant
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.nextTheme();
                this.showThemeNotification();
            }
            
            // Ctrl + Shift + D : Basculer sombre/clair
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDarkMode();
                this.showThemeNotification();
            }
        });
    }

    /**
     * Détecte la préférence système pour le mode sombre
     */
    static detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // L'utilisateur préfère le mode sombre
            const savedTheme = this.loadTheme();
            if (!savedTheme && !this.isDarkTheme()) {
                this.changeTheme('midnight'); // Thème sombre par défaut
            }
        }

        // Écouter les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (e.matches && !this.isDarkTheme()) {
                    this.changeTheme('midnight');
                } else if (!e.matches && this.isDarkTheme()) {
                    this.changeTheme('light');
                }
            });
        }
    }

    /**
     * Affiche une notification temporaire du thème
     */
    static showThemeNotification() {
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="theme-notification-content">
                <span class="theme-notification-icon">${this.themes[this.currentTheme].name.split(' ')[0]}</span>
                <span class="theme-notification-text">${this.themes[this.currentTheme].name}</span>
            </div>
        `;
        
        // Styles inline pour la notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-color)',
            padding: '12px 20px',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow)',
            border: '2px solid var(--primary-color)',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });

        document.body.appendChild(notification);

        // Animation d'apparition
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Suppression après 2 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Sauvegarde le thème dans localStorage
     * @param {string} theme - Nom du thème
     */
    static saveTheme(theme) {
        try {
            localStorage.setItem('budget-theme', theme);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du thème:', error);
            return false;
        }
    }

    /**
     * Charge le thème depuis localStorage
     */
    static loadTheme() {
        try {
            return localStorage.getItem('budget-theme') || 'light';
        } catch (error) {
            console.error('Erreur lors du chargement du thème:', error);
            return 'light';
        }
    }

    /**
     * Exporte la configuration des thèmes
     */
    static exportThemeConfig() {
        const config = {
            currentTheme: this.currentTheme,
            themes: this.themes,
            timestamp: new Date().toISOString()
        };
        
        return JSON.stringify(config, null, 2);
    }

    /**
     * Importe une configuration de thèmes
     * @param {string} configJson - Configuration JSON
     */
    static importThemeConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            
            if (config.themes) {
                // Fusionner les nouveaux thèmes avec les existants
                this.themes = { ...this.themes, ...config.themes };
            }
            
            if (config.currentTheme && this.themes[config.currentTheme]) {
                this.applyTheme(config.currentTheme);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import de la configuration:', error);
            return false;
        }
    }

    /**
     * Crée un aperçu des couleurs d'un thème
     * @param {string} theme - Nom du thème
     * @returns {HTMLElement} - Élément d'aperçu
     */
    static createThemePreview(theme) {
    const preview = document.createElement('div');
    preview.className = 'theme-preview-item';
    preview.setAttribute('data-theme-preview', theme);
    
    const themeInfo = this.themes[theme];
    
    // Obtenir les couleurs en appliquant temporairement le thème
    const colors = this.getThemeColorsComplete(theme);
    
    preview.innerHTML = `
        <div class="theme-preview-header">
            <span class="theme-preview-name">${themeInfo.name}</span>
            <span class="theme-preview-category">${themeInfo.category}</span>
        </div>
        <div class="theme-preview-colors">
            <div class="theme-preview-color" 
                 style="background-color: ${colors.primary}" 
                 title="Primaire"
                 data-color="primary"></div>
            <div class="theme-preview-color" 
                 style="background-color: ${colors.accent}" 
                 title="Accent"
                 data-color="accent"></div>
            <div class="theme-preview-color" 
                 style="background-color: ${colors.success}" 
                 title="Succès"
                 data-color="success"></div>
            <div class="theme-preview-color" 
                 style="background-color: ${colors.warning}" 
                 title="Avertissement"
                 data-color="warning"></div>
            <div class="theme-preview-color" 
                 style="background-color: ${colors.danger}" 
                 title="Danger"
                 data-color="danger"></div>
            <div class="theme-preview-color" 
                 style="background-color: ${colors.quaternary}" 
                 title="Quaternaire"
                 data-color="quaternary"></div>
        </div>
        <div class="theme-preview-secondary-colors">
            <div class="theme-secondary-color" 
                 style="background-color: ${colors.quinary}" 
                 title="Quinary"></div>
            <div class="theme-secondary-color" 
                 style="background-color: ${colors.senary}" 
                 title="Senary"></div>
            <div class="theme-secondary-color" 
                 style="background-color: ${colors.septenary}" 
                 title="Septenary"></div>
            <div class="theme-secondary-color" 
                 style="background-color: ${colors.info}" 
                 title="Info"></div>
        </div>
        <div class="theme-preview-description">${themeInfo.description}</div>
        <div class="theme-preview-background-sample" 
             style="background: ${colors.background}; color: ${colors.text};">
            <span>Aperçu du texte</span>
        </div>
    `;
    
    // Gestionnaire de clic pour appliquer le thème
    preview.addEventListener('click', () => {
        this.changeTheme(theme);
    });
    
    return preview;
}

static getThemeColorsComplete(theme) {
    if (!this.themes[theme]) {
        return this.extractCSSColors();
    }

    // Si c'est le thème actuel, extraire directement
    if (theme === this.currentTheme) {
        return this.extractCSSColors();
    }

    // Sinon, appliquer temporairement le thème
    const originalTheme = this.currentTheme;
    const tempElement = document.createElement('div');
    tempElement.style.display = 'none';
    
    if (theme !== 'light') {
        tempElement.setAttribute('data-theme', theme);
    }
    
    document.body.appendChild(tempElement);
    const computedStyle = getComputedStyle(tempElement);
    
    // Définir manuellement les couleurs par thème si les CSS vars ne sont pas disponibles
    const themeColorMaps = {
        light: {
            primary: '#2563eb',
            success: '#059669',
            danger: '#dc2626',
            warning: '#d97706',
            info: '#0891b2',
            accent: '#7c3aed',
            background: '#f1f5f9',
            surface: '#ffffff',
            text: '#1e293b',
            border: '#e2e8f0',
            quaternary: '#ea580c',
            quinary: '#0d9488',
            senary: '#db2777',
            septenary: '#4338ca'
        },
        aurora: {
            primary: '#06b6d4',
            success: '#10b981',
            danger: '#f43f5e',
            warning: '#f59e0b',
            info: '#3b82f6',
            accent: '#8b5cf6',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #f0f9ff 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#065f46',
            border: '#a7f3d0',
            quaternary: '#06b6d4',
            quinary: '#10b981',
            senary: '#f43f5e',
            septenary: '#8b5cf6'
        },
        volcanic: {
            primary: '#dc2626',
            success: '#059669',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#0ea5e9',
            accent: '#f97316',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 50%, #fefbf0 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#7f1d1d',
            border: '#fecaca',
            quaternary: '#eab308',
            quinary: '#dc2626',
            senary: '#c2410c',
            septenary: '#ea580c'
        },
        midnight: {
            primary: '#0ea5e9',
            success: '#10b981',
            danger: '#f43f5e',
            warning: '#fbbf24',
            info: '#06b6d4',
            accent: '#8b5cf6',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            surface: 'rgba(30, 41, 59, 0.95)',
            text: '#e2e8f0',
            border: '#334155',
            quaternary: '#06b6d4',
            quinary: '#10b981',
            senary: '#f43f5e',
            septenary: '#0ea5e9'
        },
        golden: {
            primary: '#d97706',
            success: '#059669',
            danger: '#dc2626',
            warning: '#eab308',
            info: '#0891b2',
            accent: '#f59e0b',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#78350f',
            border: '#fed7aa',
            quaternary: '#eab308',
            quinary: '#d97706',
            senary: '#c2410c',
            septenary: '#ea580c'
        },
        emerald: {
            primary: '#059669',
            success: '#10b981',
            danger: '#dc2626',
            warning: '#d97706',
            info: '#0891b2',
            accent: '#84cc16',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#064e3b',
            border: '#a7f3d0',
            quaternary: '#059669',
            quinary: '#10b981',
            senary: '#22c55e',
            septenary: '#65a30d'
        },
        cosmic: {
            primary: '#8b5cf6',
            success: '#10b981',
            danger: '#f43f5e',
            warning: '#f59e0b',
            info: '#06b6d4',
            accent: '#a855f7',
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#581c87',
            border: '#d8b4fe',
            quaternary: '#8b5cf6',
            quinary: '#a855f7',
            senary: '#c084fc',
            septenary: '#7c3aed'
        },
        sakura: {
            primary: '#ec4899',
            success: '#059669',
            danger: '#dc2626',
            warning: '#f59e0b',
            info: '#06b6d4',
            accent: '#f472b6',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#831843',
            border: '#fbcfe8',
            quaternary: '#ec4899',
            quinary: '#f472b6',
            senary: '#f9a8d4',
            septenary: '#db2777'
        },
        arctic: {
            primary: '#0ea5e9',
            success: '#10b981',
            danger: '#f43f5e',
            warning: '#f59e0b',
            info: '#06b6d4',
            accent: '#06b6d4',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#0c4a6e',
            border: '#bae6fd',
            quaternary: '#0ea5e9',
            quinary: '#06b6d4',
            senary: '#0891b2',
            septenary: '#0284c7'
        },
        royal: {
            primary: '#1e40af',
            success: '#059669',
            danger: '#dc2626',
            warning: '#f59e0b',
            info: '#0891b2',
            accent: '#3b82f6',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#1e3a8a',
            border: '#bfdbfe',
            quaternary: '#1e40af',
            quinary: '#2563eb',
            senary: '#3b82f6',
            septenary: '#1d4ed8'
        },
        sunset: {
            primary: '#ea580c',
            success: '#059669',
            danger: '#dc2626',
            warning: '#f59e0b',
            info: '#0891b2',
            accent: '#f97316',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
            surface: 'rgba(255, 255, 255, 0.95)',
            text: '#9a3412',
            border: '#fed7aa',
            quaternary: '#ea580c',
            quinary: '#f97316',
            senary: '#fb923c',
            septenary: '#c2410c'
        },
        monochrome: {
            primary: '#374151',
            success: '#059669',
            danger: '#dc2626',
            warning: '#f59e0b',
            info: '#0891b2',
            accent: '#6b7280',
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)',
            surface: 'rgba(255, 255, 255, 0.98)',
            text: '#111827',
            border: '#d1d5db',
            quaternary: '#374151',
            quinary: '#4b5563',
            senary: '#6b7280',
            septenary: '#1f2937'
        },
        cyber: {
            primary: '#00f5ff',
            success: '#00ff88',
            danger: '#ff0066',
            warning: '#ffff00',
            info: '#8000ff',
            accent: '#ff00ff',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            surface: 'rgba(26, 26, 46, 0.95)',
            text: '#00f5ff',
            border: '#1a1a2e',
            quaternary: '#00f5ff',
            quinary: '#00ff88',
            senary: '#ff0066',
            septenary: '#8000ff'
        }
    };

    document.body.removeChild(tempElement);
    
    return themeColorMaps[theme] || themeColorMaps.light;
}
    /**
     * Génère une grille d'aperçu de tous les thèmes
     * @returns {HTMLElement} - Grille d'aperçu
     */
    static createThemeGrid() {
        const grid = document.createElement('div');
        grid.className = 'themes-grid';
        
        Object.keys(this.themes).forEach(themeKey => {
            const preview = this.createThemePreview(themeKey);
            grid.appendChild(preview);
        });
        
        return grid;
    }
}

// Exporter pour une utilisation globale
window.ThemeManager = ThemeManager;