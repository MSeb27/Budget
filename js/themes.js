// ===== THEME MANAGER =====
class ThemeManager {
    static themes = {
        light: {
            name: '☀️ Clair',
            isDark: false
        },
        dark: {
            name: '🌙 Sombre',
            isDark: true
        },
        ocean: {
            name: '🌊 Océan Bleu',
            isDark: false
        },
        forest: {
            name: '🌲 Forêt Mystique',
            isDark: false
        },
        sunset: {
            name: '🌅 Coucher de Soleil',
            isDark: false
        },
        rosegold: {
            name: '🌸 Rose Doré',
            isDark: false
        },
        arctic: {
            name: '❄️ Arctic',
            isDark: false
        },
        galaxy: {
            name: '🌌 Galaxy',
            isDark: false
        },
        cyberpunk: {
            name: '🤖 Cyberpunk',
            isDark: true
        },
        autumn: {
            name: '🍂 Automne',
            isDark: false
        },
        lavender: {
            name: '💜 Lavande',
            isDark: false
        }
    };

    static currentTheme = 'light';
    static onThemeChange = null;

    static init(initialTheme = 'light', onChangeCallback = null) {
        this.currentTheme = initialTheme;
        this.onThemeChange = onChangeCallback;
        this.applyTheme(initialTheme);
    }

    static applyTheme(theme) {
        // Supprimer l'ancien thème
        document.documentElement.removeAttribute('data-theme');
        
        // Appliquer le nouveau thème
        if (theme !== 'light') {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        this.currentTheme = theme;
        
        // Sauvegarder le thème
        StorageManager.saveTheme(theme);
        
        // Déclencher le callback si défini
        if (this.onThemeChange) {
            this.onThemeChange(theme);
        }
    }

    static changeTheme(newTheme) {
        if (!this.themes[newTheme]) {
            console.warn(`Thème inconnu: ${newTheme}`);
            return;
        }

        this.applyTheme(newTheme);
        
        // Animation de transition
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    static getCurrentTheme() {
        return this.currentTheme;
    }

    static getThemesList() {
        return Object.entries(this.themes).map(([key, value]) => ({
            key,
            name: value.name,
            isDark: value.isDark
        }));
    }

    static isDarkTheme(theme = null) {
        const themeToCheck = theme || this.currentTheme;
        return this.themes[themeToCheck]?.isDark || false;
    }

    static populateThemeSelector(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        
        Object.entries(this.themes).forEach(([key, theme]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = theme.name;
            if (key === this.currentTheme) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    static setupThemeSelector(selectElement) {
        this.populateThemeSelector(selectElement);
        
        selectElement.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
    }

    static getThemeColors(theme = null) {
        const themeToCheck = theme || this.currentTheme;
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
            text: computedStyle.getPropertyValue('--text-color').trim()
        };
    }
}