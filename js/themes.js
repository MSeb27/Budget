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
        },
        // ===== NOUVEAUX THÈMES SOMBRES =====
        obsidian: {
            name: '🖤 Obsidian Elegance',
            category: 'Sombre',
            isDark: true,
            description: 'Élégance sombre avec des accents violets sophistiqués'
        },
        neon: {
            name: '🌈 Neon Nights',
            category: 'Sombre',
            isDark: true,
            description: 'Ambiance nocturne néon avec des effets lumineux'
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
        
        // Appliquer le nouveau thème (sauf si c'est 'light' qui est le défaut)
        if (theme !== 'light') {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Mettre à jour le thème actuel
        this.currentTheme = theme;

        // Sauvegarder la préférence
        this.saveTheme(theme);

        // Mettre à jour les propriétés personnalisées
        this.updateCustomProperties(theme);

        // Mettre à jour la meta couleur pour mobile
        this.updateMetaThemeColor(theme);

        // Appeler le callback
        if (this.onThemeChange) {
            this.onThemeChange(theme, this.themes[theme]);
        }

        // Émettre un événement personnalisé
        this.dispatchThemeChangeEvent(theme);

        console.log(`🎨 Thème appliqué: ${this.themes[theme].name}`);
    }

    /**
     * Change de thème avec validation
     * @param {string} theme - Nom du thème
     */
    static changeTheme(theme) {
        this.applyTheme(theme);
    }

    /**
     * Sauvegarde le thème dans le localStorage
     * @param {string} theme - Nom du thème
     */
    static saveTheme(theme) {
        try {
            localStorage.setItem('preferred-theme', theme);
        } catch (e) {
            console.warn('Impossible de sauvegarder le thème:', e);
        }
    }

    /**
     * Charge le thème depuis le localStorage
     * @returns {string|null} - Thème sauvegardé ou null
     */
    static loadTheme() {
        try {
            return localStorage.getItem('preferred-theme');
        } catch (e) {
            console.warn('Impossible de charger le thème:', e);
            return null;
        }
    }

    /**
     * Extrait les couleurs CSS actuelles
     * @returns {Object} - Objet contenant toutes les couleurs
     */
    static extractCSSColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        
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
        const root = document.documentElement;
        
        // Ajustements spéciaux pour certains thèmes
        if (theme === 'cyber') {
            root.style.setProperty('--glow-intensity', '0.8');
            root.style.setProperty('--animation-speed', '2s');
        } else if (theme === 'obsidian') {
            root.style.setProperty('--glow-intensity', '0.6');
            root.style.setProperty('--blur-effect', '10px');
        } else if (theme === 'neon') {
            root.style.setProperty('--glow-intensity', '1.0');
            root.style.setProperty('--pulse-speed', '2s');
            root.style.setProperty('--neon-brightness', '1.2');
        } else {
            root.style.removeProperty('--glow-intensity');
            root.style.removeProperty('--animation-speed');
            root.style.removeProperty('--blur-effect');
            root.style.removeProperty('--pulse-speed');
            root.style.removeProperty('--neon-brightness');
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

        // Couleurs de meta theme par thème
        const metaColors = {
            light: '#f1f5f9',
            midnight: '#0f172a',
            cyber: '#0a0a0f',
            obsidian: '#111827',
            neon: '#0d1117'
        };

        metaThemeColor.content = metaColors[theme] || this.extractCSSColors().background || '#2563eb';
    }

    /**
     * Crée un aperçu de thème pour l'interface
     * @param {string} theme - Nom du thème
     * @returns {HTMLElement} - Élément d'aperçu
     */
    static createThemePreview(theme) {
        const themeInfo = this.themes[theme];
        if (!themeInfo) return null;

        const preview = document.createElement('div');
        preview.className = `theme-preview ${this.currentTheme === theme ? 'current-theme' : ''}`;
        preview.setAttribute('data-theme-preview', theme);

        // Obtenir les couleurs pour ce thème
        const colors = this.getThemeColorsComplete(theme);

        preview.innerHTML = `
            <div class="theme-preview-colors">
                <div class="theme-preview-color" 
                     style="background-color: ${colors.primary}" 
                     title="Primaire"
                     data-color="primary"></div>
                <div class="theme-preview-color" 
                     style="background-color: ${colors.success}" 
                     title="Succès"
                     data-color="success"></div>
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
                ${themeInfo.isDark ? '<span class="dark-indicator">🌙</span>' : '<span class="light-indicator">☀️</span>'}
            </div>
        `;
        
        // Gestionnaire de clic pour appliquer le thème
        preview.addEventListener('click', () => {
            this.changeTheme(theme);
        });
        
        return preview;
    }

    /**
     * Obtient les couleurs complètes d'un thème
     * @param {string} theme - Nom du thème
     * @returns {Object} - Couleurs du thème
     */
    static getThemeColorsComplete(theme) {
        if (!this.themes[theme]) {
            return this.extractCSSColors();
        }

        // Mapping des couleurs par thème pour les nouveaux thèmes sombres
        const themeColorMaps = {
            obsidian: {
                primary: '#6366f1',
                success: '#22c55e',
                danger: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
                accent: '#8b5cf6',
                background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)',
                surface: 'rgba(31, 41, 59, 0.95)',
                text: '#f8fafc',
                border: '#374151',
                quaternary: '#6366f1',
                quinary: '#8b5cf6',
                senary: '#a78bfa',
                septenary: '#4f46e5'
            },
            neon: {
                primary: '#10b981',
                success: '#06ffa5',
                danger: '#ff073a',
                warning: '#ffd60a',
                info: '#00bcd4',
                accent: '#ff0080',
                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
                surface: 'rgba(33, 38, 45, 0.95)',
                text: '#e6fffa',
                border: '#21262d',
                quaternary: '#10b981',
                quinary: '#06ffa5',
                senary: '#ff073a',
                septenary: '#ffd60a'
            }
        };

        // Si on a un mapping spécifique, l'utiliser
        if (themeColorMaps[theme]) {
            return themeColorMaps[theme];
        }

        // Sinon, extraire directement ou utiliser les défauts
        if (theme === this.currentTheme) {
            return this.extractCSSColors();
        }

        // Retourner les couleurs par défaut pour les autres thèmes
        return this.extractCSSColors();
    }

    /**
     * Thème suivant dans la liste
     * @returns {string} - Nom du nouveau thème
     */
    static nextTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = currentIndex < themeKeys.length - 1 ? currentIndex + 1 : 0;
        const nextTheme = themeKeys[nextIndex];
        
        this.changeTheme(nextTheme);
        return nextTheme;
    }

    /**
     * Thème précédent dans la liste
     * @returns {string} - Nom du nouveau thème
     */
    static previousTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : themeKeys.length - 1;
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
     * Retourne uniquement les thèmes sombres
     */
    static getDarkThemes() {
        return Object.entries(this.themes)
            .filter(([key, theme]) => theme.isDark)
            .map(([key, theme]) => ({ key, ...theme }));
    }

    /**
     * Retourne uniquement les thèmes clairs
     */
    static getLightThemes() {
        return Object.entries(this.themes)
            .filter(([key, theme]) => !theme.isDark)
            .map(([key, theme]) => ({ key, ...theme }));
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
            // Liste simple sans groupes
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
     * Configure un sélecteur de thème avec events
     * @param {HTMLSelectElement} selectElement - Élément select
     * @param {boolean} groupByCategory - Grouper par catégorie
     */
    static setupThemeSelector(selectElement, groupByCategory = true) {
        if (!selectElement) {
            console.warn('⚠️ setupThemeSelector: Élément select non fourni');
            return;
        }

        // Peupler le sélecteur
        this.populateThemeSelector(selectElement, groupByCategory);
        
        // Ajouter l'event listener pour le changement
        selectElement.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            console.log(`🎨 Changement de thème via sélecteur: ${selectedTheme}`);
            this.changeTheme(selectedTheme);
        });

        // Mettre à jour le sélecteur quand le thème change via d'autres moyens
        document.addEventListener('themechange', (e) => {
            if (selectElement.value !== e.detail.theme) {
                selectElement.value = e.detail.theme;
                console.log(`🔄 Sélecteur mis à jour: ${e.detail.theme}`);
            }
        });

        console.log(`✅ Sélecteur de thème configuré avec ${Object.keys(this.themes).length} thèmes`);
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

            // Ctrl + Shift + R : Thème aléatoire
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.randomTheme();
                this.showThemeNotification();
            }
        });
    }

    /**
     * Applique un thème aléatoire
     * @returns {string} - Nom du thème appliqué
     */
    static randomTheme() {
        const themes = Object.keys(this.themes);
        const availableThemes = themes.filter(theme => theme !== this.currentTheme);
        const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
        
        this.changeTheme(randomTheme);
        return randomTheme;
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
                <span class="theme-notification-mode">${this.isDarkTheme() ? '🌙' : '☀️'}</span>
            </div>
        `;

        // Styles de la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface);
            color: var(--text-color);
            padding: 12px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            font-weight: 500;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Suppression automatique
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }

    /**
     * Retourne des statistiques sur les thèmes
     */
    static getThemeStats() {
        const themes = Object.values(this.themes);
        const darkThemes = themes.filter(theme => theme.isDark);
        const lightThemes = themes.filter(theme => !theme.isDark);
        
        const categories = {};
        themes.forEach(theme => {
            const category = theme.category || 'Autres';
            categories[category] = (categories[category] || 0) + 1;
        });

        return {
            total: themes.length,
            dark: darkThemes.length,
            light: lightThemes.length,
            categories: categories,
            currentTheme: this.currentTheme,
            currentIsDark: this.isDarkTheme()
        };
    }

    /**
     * Exporte la configuration actuelle des thèmes
     */
    static exportThemeConfig() {
        return {
            currentTheme: this.currentTheme,
            themes: this.themes,
            colors: this.extractCSSColors(),
            stats: this.getThemeStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Applique automatiquement le bon thème au chargement
     */
    static autoApplyTheme() {
        // 1. Vérifier le thème sauvegardé
        const savedTheme = this.loadTheme();
        if (savedTheme && this.themes[savedTheme]) {
            this.applyTheme(savedTheme);
            return savedTheme;
        }

        // 2. Vérifier la préférence système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.applyTheme('midnight');
            return 'midnight';
        }

        // 3. Thème par défaut
        this.applyTheme('light');
        return 'light';
    }
}