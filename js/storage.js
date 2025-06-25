// ===== STORAGE FUNCTIONS =====
const STORAGE_KEY = 'budget-calendar-data';
const FIXED_EXPENSES_KEY = 'budget-fixed-expenses';
const THEME_KEY = 'budget-theme';

class StorageManager {
    static loadTransactions() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
            return [];
        }
    }

    static saveTransactions(transactions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            return false;
        }
    }

    static loadFixedExpenses() {
    try {
        const data = localStorage.getItem(FIXED_EXPENSES_KEY);
        return data ? JSON.parse(data) : {
            loyer: 0,
            edf: 0,
            internet: 0,
            credit: 0,
            impot: 0,  // Nouvelle ligne
            autres: 0
        };
		}
	catch (error) {
        console.error("Erreur lors du chargement des dépenses fixes:", error);
        return { loyer: 0, edf: 0, internet: 0, credit: 0, impot: 0, autres: 0 };
		}
	}

    static saveFixedExpenses(fixedExpenses) {
        try {
            localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(fixedExpenses));
            return true;
        } catch (error) {
            console.error("Erreur lors de la sauvegarde des dépenses fixes:", error);
            return false;
        }
    }

    static loadTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (error) {
            console.error("Erreur lors du chargement du thème:", error);
            return 'light';
        }
    }

	static saveTheme(theme) {
		try {
			localStorage.setItem(THEME_KEY, theme);
			return true;
		} catch (error) {
        console.error("Erreur lors de la sauvegarde du thème:", error);
        return false;
    }
}

    static exportData(transactions, fixedExpenses, theme) {
        const data = {
            transactions,
            fixedExpenses,
            theme,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget_export_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    static async importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Aucun fichier sélectionné'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.transactions || !Array.isArray(data.transactions)) {
                        reject(new Error('Fichier invalide: données de transactions manquantes'));
                        return;
                    }
                    
                    resolve({
                        transactions: data.transactions || [],
                        fixedExpenses: data.fixedExpenses || {
                            loyer: 0, edf: 0, internet: 0, credit: 0, autres: 0
                        },
                        theme: data.theme || 'light'
                    });
                } catch (error) {
                    reject(new Error('Erreur lors de la lecture: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    static clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(FIXED_EXPENSES_KEY);
            localStorage.removeItem(THEME_KEY);
            return true;
        } catch (error) {
            console.error("Erreur lors de l'effacement:", error);
            return false;
        }
    }

}
window.StorageManager = StorageManager;