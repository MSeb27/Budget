// ===== SYSTÈME DE CATÉGORISATION AUTOMATIQUE PAR IA =====

class AutoCategorizationAI {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.learningData = this.loadLearningData();
        this.defaultRules = this.initializeDefaultRules();
        this.confidence = {
            HIGH: 0.8,    // Très confiant
            MEDIUM: 0.6,  // Moyennement confiant
            LOW: 0.4      // Peu confiant
        };
    }

    // ===== INITIALISATION DES RÈGLES PAR DÉFAUT =====
    initializeDefaultRules() {
        return {
            // Mots-clés pour chaque catégorie
            keywords: {
                'Alimentation': [
                    'carrefour', 'leclerc', 'auchan', 'casino', 'monoprix', 'franprix', 
                    'lidl', 'aldi', 'bio', 'boulangerie', 'boucherie', 'poissonnerie',
                    'restaurant', 'mcdonalds', 'kfc', 'quick', 'subway', 'pizza',
                    'café', 'bar', 'brasserie', 'epicerie', 'supermarché', 'hypermarché',
                    'alimentation', 'courses', 'nourriture', 'repas'
                ],
                'Transport': [
                    'essence', 'gazole', 'carburant', 'station', 'total', 'shell', 'bp',
                    'esso', 'agip', 'péage', 'autoroute', 'parking', 'sncf', 'ratp',
                    'métro', 'bus', 'tram', 'taxi', 'uber', 'transport', 'navigo',
                    'ticket', 'abonnement', 'train', 'avion', 'vol'
                ],
                'Loyer': [
                    'loyer', 'bail', 'propriétaire', 'agence', 'immobilier', 'location',
                    'logement', 'appartement', 'maison', 'studio', 'charges'
                ],
                'EDF-GDF': [
                    'edf', 'gdf', 'engie', 'électricité', 'gaz', 'énergie', 'facture',
                    'total energies', 'direct energie', 'eni', 'planete oui'
                ],
                'Internet': [
                    'orange', 'sfr', 'free', 'bouygues', 'internet', 'box', 'télécom',
                    'mobile', 'forfait', 'téléphone', 'fibre', 'adsl'
                ],
                'Santé': [
                    'médecin', 'pharmacie', 'dentiste', 'hopital', 'clinique', 'mutuelle',
                    'sécu', 'santé', 'médicament', 'consultation', 'radiologue',
                    'ophtalmologue', 'cardiologue', 'kinésithérapeute'
                ],
                'Vêtements': [
                    'zara', 'h&m', 'uniqlo', 'kiabi', 'decathlon', 'sport', 'chaussures',
                    'vêtement', 'mode', 'textile', 'prêt-à-porter', 'boutique'
                ],
                'Loisirs': [
                    'cinéma', 'théâtre', 'concert', 'sport', 'fitness', 'gym', 'piscine',
                    'netflix', 'spotify', 'amazon prime', 'disney', 'jeux', 'steam',
                    'playstation', 'xbox', 'nintendo', 'livre', 'fnac', 'cultura'
                ],
                'Salaire': [
                    'salaire', 'traitement', 'paye', 'rémunération', 'virement',
                    'employeur', 'société', 'entreprise', 'revenus', 'net', 'brut'
                ],
                'Remboursement crédit': [
                    'crédit', 'prêt', 'emprunt', 'banque', 'mensualité', 'remboursement',
                    'lcl', 'bnp', 'société générale', 'crédit agricole', 'caisse'
                ],
                'Assurance maison': [
                    'assurance', 'habitation', 'logement', 'maif', 'macif', 'matmut',
                    'groupama', 'axa', 'allianz', 'generali', 'maison', 'appartement'
                ],
                'Assurance voiture': [
                    'assurance', 'auto', 'voiture', 'véhicule', 'automobile', 'maif',
                    'macif', 'matmut', 'groupama', 'axa', 'allianz', 'generali'
                ],
                'Impôt': [
                    'impôt', 'taxe', 'trésor public', 'dgfip', 'fisc', 'foncier',
                    'habitation', 'revenus', 'prélèvement', 'administration'
                ]
            },

            // Patterns de montants typiques pour certaines catégories
            amountPatterns: {
                'Loyer': { min: 300, max: 2000, typical: [500, 700, 900, 1200] },
                'EDF-GDF': { min: 30, max: 300, typical: [50, 80, 120, 150] },
                'Internet': { min: 15, max: 80, typical: [25, 35, 45, 60] },
                'Assurance voiture': { min: 25, max: 150, typical: [40, 60, 80, 100] },
                'Assurance maison': { min: 15, max: 100, typical: [25, 35, 50, 70] }
            },

            // Patterns de fréquence (mensuel, etc.)
            frequencyPatterns: {
                monthly: ['Loyer', 'EDF-GDF', 'Internet', 'Assurance maison', 'Assurance voiture', 'Remboursement crédit'],
                irregular: ['Alimentation', 'Transport', 'Vêtements', 'Loisirs', 'Santé'],
                income: ['Salaire']
            }
        };
    }

    // ===== CHARGEMENT DES DONNÉES D'APPRENTISSAGE =====
    loadLearningData() {
        try {
            const stored = localStorage.getItem('ai_categorization_learning');
            return stored ? JSON.parse(stored) : {
                labelToCategory: {},
                userCorrections: [],
                categoryStats: {}
            };
        } catch (error) {
            console.error('Erreur lors du chargement des données d\'apprentissage:', error);
            return {
                labelToCategory: {},
                userCorrections: [],
                categoryStats: {}
            };
        }
    }

    // ===== SAUVEGARDE DES DONNÉES D'APPRENTISSAGE =====
    saveLearningData() {
        try {
            localStorage.setItem('ai_categorization_learning', JSON.stringify(this.learningData));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données d\'apprentissage:', error);
        }
    }

    // ===== MÉTHODE PRINCIPALE DE SUGGESTION =====
    suggestCategory(label, amount = null, type = 'expense') {
        const normalizedLabel = this.normalizeLabel(label);
        
        // 1. Vérifier les correspondances exactes apprises
        const exactMatch = this.checkExactMatch(normalizedLabel);
        if (exactMatch) {
            return {
                category: exactMatch,
                confidence: this.confidence.HIGH,
                reason: 'Correspondance exacte apprise'
            };
        }

        // 2. Analyser avec les mots-clés
        const keywordMatch = this.analyzeKeywords(normalizedLabel);
        if (keywordMatch.category) {
            return {
                category: keywordMatch.category,
                confidence: keywordMatch.confidence,
                reason: `Mots-clés détectés: ${keywordMatch.keywords.join(', ')}`
            };
        }

        // 3. Analyser le montant si fourni
        if (amount !== null) {
            const amountMatch = this.analyzeAmount(amount, type);
            if (amountMatch.category) {
                return {
                    category: amountMatch.category,
                    confidence: amountMatch.confidence,
                    reason: `Montant typique pour cette catégorie (${amount}€)`
                };
            }
        }

        // 4. Suggestion par similitude avec l'historique
        const similarityMatch = this.findSimilarTransactions(normalizedLabel);
        if (similarityMatch.category) {
            return {
                category: similarityMatch.category,
                confidence: similarityMatch.confidence,
                reason: `Similaire à: "${similarityMatch.example}"`
            };
        }

        // 5. Aucune suggestion trouvée
        return {
            category: type === 'income' ? 'Salaire' : 'Autres',
            confidence: this.confidence.LOW,
            reason: 'Catégorie par défaut'
        };
    }

    // ===== NORMALISATION DU LIBELLÉ =====
    normalizeLabel(label) {
        return label
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
            .replace(/\s+/g, ' ')     // Fusionner les espaces multiples
            .replace(/\d+/g, '')      // Supprimer les chiffres
            .trim();
    }

    // ===== VÉRIFICATION DES CORRESPONDANCES EXACTES =====
    checkExactMatch(normalizedLabel) {
        return this.learningData.labelToCategory[normalizedLabel] || null;
    }

    // ===== ANALYSE PAR MOTS-CLÉS =====
    analyzeKeywords(normalizedLabel) {
        const words = normalizedLabel.split(' ').filter(word => word.length > 2);
        const matches = {};

        // Compter les matches pour chaque catégorie
        Object.entries(this.defaultRules.keywords).forEach(([category, keywords]) => {
            matches[category] = 0;
            keywords.forEach(keyword => {
                if (normalizedLabel.includes(keyword.toLowerCase())) {
                    matches[category]++;
                }
            });
        });

        // Trouver la meilleure correspondance
        const bestMatch = Object.entries(matches)
            .filter(([category, count]) => count > 0)
            .sort(([,a], [,b]) => b - a)[0];

        if (bestMatch) {
            const [category, matchCount] = bestMatch;
            const matchedKeywords = this.defaultRules.keywords[category]
                .filter(keyword => normalizedLabel.includes(keyword.toLowerCase()));

            return {
                category,
                confidence: Math.min(this.confidence.HIGH, this.confidence.MEDIUM + (matchCount * 0.1)),
                keywords: matchedKeywords
            };
        }

        return { category: null };
    }

    // ===== ANALYSE PAR MONTANT =====
    analyzeAmount(amount, type) {
        if (type === 'income') {
            return {
                category: 'Salaire',
                confidence: this.confidence.MEDIUM,
                reason: 'Revenus'
            };
        }

        // Chercher les catégories avec des patterns de montants correspondants
        const matchingCategories = [];

        Object.entries(this.defaultRules.amountPatterns).forEach(([category, pattern]) => {
            if (amount >= pattern.min && amount <= pattern.max) {
                // Calculer la proximité avec les montants typiques
                const proximity = pattern.typical.reduce((closest, typical) => {
                    const distance = Math.abs(amount - typical);
                    return distance < Math.abs(amount - closest) ? typical : closest;
                }, pattern.typical[0]);

                const proximityScore = 1 - (Math.abs(amount - proximity) / proximity);
                
                matchingCategories.push({
                    category,
                    confidence: Math.max(this.confidence.LOW, proximityScore * this.confidence.MEDIUM),
                    proximity: proximityScore
                });
            }
        });

        if (matchingCategories.length > 0) {
            const best = matchingCategories.sort((a, b) => b.confidence - a.confidence)[0];
            return best;
        }

        return { category: null };
    }

    // ===== RECHERCHE DE TRANSACTIONS SIMILAIRES =====
    findSimilarTransactions(normalizedLabel) {
        if (!this.transactionManager) return { category: null };

        const transactions = this.transactionManager.getAllTransactions();
        const similarities = [];

        transactions.forEach(transaction => {
            const transactionLabel = this.normalizeLabel(transaction.label);
            const similarity = this.calculateSimilarity(normalizedLabel, transactionLabel);
            
            if (similarity > 0.7) {
                similarities.push({
                    category: transaction.category,
                    similarity,
                    example: transaction.label
                });
            }
        });

        if (similarities.length > 0) {
            const best = similarities.sort((a, b) => b.similarity - a.similarity)[0];
            return {
                category: best.category,
                confidence: Math.min(this.confidence.HIGH, best.similarity * this.confidence.MEDIUM),
                example: best.example
            };
        }

        return { category: null };
    }

    // ===== CALCUL DE SIMILARITÉ ENTRE DEUX CHAÎNES =====
    calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        let commonWords = 0;
        words1.forEach(word1 => {
            if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
                commonWords++;
            }
        });

        return commonWords / Math.max(words1.length, words2.length);
    }

    // ===== APPRENTISSAGE D'UNE NOUVELLE ASSOCIATION =====
    learnFromUser(label, category, wasCorrection = false) {
        const normalizedLabel = this.normalizeLabel(label);
        
        // Enregistrer l'association
        this.learningData.labelToCategory[normalizedLabel] = category;
        
        // Enregistrer la correction si c'en est une
        if (wasCorrection) {
            this.learningData.userCorrections.push({
                label: normalizedLabel,
                category,
                timestamp: new Date().toISOString()
            });
        }

        // Mettre à jour les statistiques
        if (!this.learningData.categoryStats[category]) {
            this.learningData.categoryStats[category] = 0;
        }
        this.learningData.categoryStats[category]++;

        this.saveLearningData();
    }

    // ===== SUGGESTION AVEC APPRENTISSAGE AUTOMATIQUE =====
    suggestAndLearn(label, amount = null, type = 'expense') {
        const suggestion = this.suggestCategory(label, amount, type);
        
        // Apprendre automatiquement si la confiance est élevée
        if (suggestion.confidence >= this.confidence.HIGH) {
            this.learnFromUser(label, suggestion.category, false);
        }

        return suggestion;
    }

    // ===== CORRECTION ET APPRENTISSAGE =====
    correctAndLearn(label, correctCategory, suggestedCategory) {
        this.learnFromUser(label, correctCategory, true);
        
        console.log(`🧠 IA apprend: "${label}" → "${correctCategory}" (était suggéré: "${suggestedCategory}")`);
    }

    // ===== STATISTIQUES ET DIAGNOSTIQUES =====
    getStatistics() {
        const totalLearned = Object.keys(this.learningData.labelToCategory).length;
        const corrections = this.learningData.userCorrections.length;
        
        return {
            totalLearned,
            corrections,
            categoryStats: this.learningData.categoryStats,
            accuracyRate: corrections > 0 ? ((totalLearned - corrections) / totalLearned) * 100 : 100
        };
    }

    // ===== RESET DES DONNÉES D'APPRENTISSAGE =====
    resetLearning() {
        this.learningData = {
            labelToCategory: {},
            userCorrections: [],
            categoryStats: {}
        };
        this.saveLearningData();
        console.log('🔄 Données d\'apprentissage réinitialisées');
    }

    // ===== EXPORT/IMPORT DES DONNÉES D'APPRENTISSAGE =====
    exportLearningData() {
        return JSON.stringify(this.learningData, null, 2);
    }

    importLearningData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.learningData = {
                ...this.learningData,
                ...imported
            };
            this.saveLearningData();
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import des données d\'apprentissage:', error);
            return false;
        }
    }

    // ===== SUGGESTIONS MULTIPLES POUR CHOIX UTILISATEUR =====
    getMultipleSuggestions(label, amount = null, type = 'expense', limit = 3) {
        const suggestions = [];
        
        // Suggestion principale
        const main = this.suggestCategory(label, amount, type);
        suggestions.push(main);

        // Suggestions alternatives basées sur différents critères
        const keywordMatch = this.analyzeKeywords(this.normalizeLabel(label));
        if (keywordMatch.category && keywordMatch.category !== main.category) {
            suggestions.push({
                category: keywordMatch.category,
                confidence: keywordMatch.confidence * 0.8, // Réduire légèrement
                reason: `Alternative: ${keywordMatch.reason}`
            });
        }

        const amountMatch = this.analyzeAmount(amount, type);
        if (amountMatch.category && 
            amountMatch.category !== main.category && 
            !suggestions.find(s => s.category === amountMatch.category)) {
            suggestions.push({
                category: amountMatch.category,
                confidence: amountMatch.confidence * 0.7,
                reason: `Alternative: ${amountMatch.reason}`
            });
        }

        // Trier par confiance et limiter
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }
}

// ===== INTÉGRATION AVEC L'INTERFACE UTILISATEUR =====

class AutoCategorizationUI {
    constructor(aiEngine) {
        this.ai = aiEngine;
        this.suggestionDisplayed = false;
    }

    // ===== AJOUT D'UNE SUGGESTION DANS UN FORMULAIRE =====
    addSuggestionToForm(labelInput, categorySelect, amountInput = null, typeInput = null) {
        if (!labelInput || !categorySelect) return;

        // Créer l'élément de suggestion
        const suggestionElement = this.createSuggestionElement();
        labelInput.parentNode.appendChild(suggestionElement);

        // Écouter les changements du libellé
        labelInput.addEventListener('input', Utils.debounce(() => {
            this.updateSuggestion(labelInput, categorySelect, amountInput, typeInput, suggestionElement);
        }, 500));

        // Écouter les changements de catégorie pour l'apprentissage
        categorySelect.addEventListener('change', () => {
            this.handleCategoryChange(labelInput, categorySelect, suggestionElement);
        });
    }

    // ===== CRÉATION DE L'ÉLÉMENT DE SUGGESTION =====
    createSuggestionElement() {
        const element = document.createElement('div');
        element.className = 'ai-suggestion';
        element.style.cssText = `
            margin-top: 8px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            border: 1px solid #90caf9;
            border-radius: 6px;
            font-size: 13px;
            display: none;
            position: relative;
        `;
        return element;
    }

    // ===== MISE À JOUR DE LA SUGGESTION =====
    updateSuggestion(labelInput, categorySelect, amountInput, typeInput, suggestionElement) {
        const label = labelInput.value.trim();
        if (label.length < 3) {
            suggestionElement.style.display = 'none';
            return;
        }

        const amount = amountInput ? parseFloat(amountInput.value) || null : null;
        const type = typeInput ? typeInput.value : 'expense';

        const suggestion = this.ai.suggestCategory(label, amount, type);
        
        if (suggestion.confidence >= this.ai.confidence.MEDIUM) {
            this.displaySuggestion(suggestion, suggestionElement, categorySelect);
        } else {
            suggestionElement.style.display = 'none';
        }
    }

    // ===== AFFICHAGE DE LA SUGGESTION =====
    displaySuggestion(suggestion, element, categorySelect) {
        const confidenceText = suggestion.confidence >= this.ai.confidence.HIGH ? 'Très confiant' :
                              suggestion.confidence >= this.ai.confidence.MEDIUM ? 'Confiant' : 'Peu confiant';
        
        const confidenceColor = suggestion.confidence >= this.ai.confidence.HIGH ? '#4caf50' :
                               suggestion.confidence >= this.ai.confidence.MEDIUM ? '#ff9800' : '#f44336';

        element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🧠</span>
                <div style="flex: 1;">
                    <strong>Suggestion IA:</strong> ${suggestion.category}
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                        ${suggestion.reason} • 
                        <span style="color: ${confidenceColor}; font-weight: bold;">${confidenceText}</span>
                    </div>
                </div>
                <button type="button" class="ai-apply-btn" style="
                    background: #4caf50; color: white; border: none; 
                    padding: 4px 8px; border-radius: 4px; cursor: pointer;
                    font-size: 11px; font-weight: bold;
                ">
                    Appliquer
                </button>
                <button type="button" class="ai-dismiss-btn" style="
                    background: #ccc; color: #666; border: none; 
                    padding: 4px 6px; border-radius: 4px; cursor: pointer;
                    font-size: 11px;
                ">
                    ✕
                </button>
            </div>
        `;

        // Gestionnaires d'événements pour les boutons
        element.querySelector('.ai-apply-btn').addEventListener('click', () => {
            categorySelect.value = suggestion.category;
            categorySelect.dispatchEvent(new Event('change'));
            element.style.display = 'none';
        });

        element.querySelector('.ai-dismiss-btn').addEventListener('click', () => {
            element.style.display = 'none';
        });

        element.style.display = 'block';
        this.suggestionDisplayed = true;
    }

    // ===== GESTION DU CHANGEMENT DE CATÉGORIE =====
    handleCategoryChange(labelInput, categorySelect, suggestionElement) {
        if (this.suggestionDisplayed && labelInput.value.trim()) {
            const suggestion = this.ai.suggestCategory(labelInput.value.trim());
            
            // Si l'utilisateur a choisi une catégorie différente, apprendre de la correction
            if (suggestion.category !== categorySelect.value && categorySelect.value) {
                this.ai.correctAndLearn(labelInput.value.trim(), categorySelect.value, suggestion.category);
            }
        }
        this.suggestionDisplayed = false;
    }
}

// ===== EXPORT DES CLASSES =====
window.AutoCategorizationAI = AutoCategorizationAI;
window.AutoCategorizationUI = AutoCategorizationUI;