// ===== UTILITY FUNCTIONS =====
class Utils {
    static isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    static formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static formatCurrency(amount, currency = '€') {
        return `${amount.toFixed(2)} ${currency}`;
    }

    static formatDateDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }

    static formatMonthYear(date) {
        return date.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
        });
    }

    static formatShortMonthYear(date) {
        return date.toLocaleDateString('fr-FR', {
            month: 'short',
            year: '2-digit'
        });
    }

    static getTodayDateString() {
        return this.formatDateString(new Date());
    }

    static getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    static getLastNMonths(n = 12) {
        const months = [];
        const now = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                date,
                key: this.getMonthKey(date),
                label: this.formatShortMonthYear(date),
                fullLabel: this.formatMonthYear(date)
            });
        }
        
        return months;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0;
    }

    static sanitizeString(str) {
        return str.trim().replace(/[<>]/g, '');
    }

    static getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#FF8A80', '#80CBC4', '#81C784', '#FFB74D', '#CE93D8'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static generateRainbowColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i / count) * 360;
            const saturation = 85;
            const lightness = 60;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }

    static lightenColor(color, percent) {
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

    static darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    static showNotification(message, type = 'info', duration = 3000) {
        // Création d'une notification simple
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}-color);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static isToday(date) {
        return this.isSameDate(date, new Date());
    }

    static isThisMonth(date) {
        const now = new Date();
        return date.getFullYear() === now.getFullYear() && 
               date.getMonth() === now.getMonth();
    }

    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}