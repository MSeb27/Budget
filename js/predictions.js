// ===== MOTEUR DE PRÉDICTIONS FINANCIÈRES =====
class BudgetPredictionsAI {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.predictionCache = new Map();
        this.models = {
            linear: new LinearRegressionModel(),
            seasonal: new SeasonalModel(),
            exponential: new ExponentialSmoothingModel()
        };
        this.anomalyDetector = new AnomalyDetector();
        this.trendAnalyzer = new TrendAnalyzer();
    }

    // ===== PRÉDICTIONS PRINCIPALES =====
    
    /**
     * Prédit les dépenses du mois prochain
     */
    async predictNextMonthExpenses() {
        const cacheKey = 'nextMonthExpenses';
        if (this.predictionCache.has(cacheKey)) {
            return this.predictionCache.get(cacheKey);
        }

        const historicalData = this.prepareHistoricalData();
        if (historicalData.length < 3) {
            return this.createBasicPrediction();
        }

        const predictions = {
            linear: this.models.linear.predict(historicalData),
            seasonal: this.models.seasonal.predict(historicalData),
            exponential: this.models.exponential.predict(historicalData)
        };

        // Moyenne pondérée des modèles
        const weightedPrediction = this.combineModels(predictions, historicalData);
        
        // Prédictions par catégorie
        const categoryPredictions = await this.predictByCategory(historicalData);
        
        const result = {
            totalAmount: weightedPrediction.amount,
            confidence: weightedPrediction.confidence,
            breakdown: categoryPredictions,
            trends: this.analyzeTrends(historicalData),
            recommendations: this.generateRecommendations(historicalData, weightedPrediction),
            riskFactors: this.identifyRiskFactors(historicalData),
            optimizationSuggestions: this.suggestOptimizations(historicalData)
        };

        this.predictionCache.set(cacheKey, result);
        return result;
    }

    /**
     * Prédit le solde de fin d'année
     */
    async predictYearEndBalance() {
        const currentDate = new Date();
        const monthsRemaining = 12 - currentDate.getMonth();
        
        const monthlyPredictions = [];
        for (let i = 1; i <= monthsRemaining; i++) {
            const prediction = await this.predictMonthExpenses(i);
            monthlyPredictions.push(prediction);
        }

        const currentBalance = this.transactionManager.getTotalStats().totalBalance;
        const predictedExpenses = monthlyPredictions.reduce((sum, pred) => sum + pred.expenses, 0);
        const predictedIncome = monthlyPredictions.reduce((sum, pred) => sum + pred.income, 0);
        
        return {
            currentBalance,
            predictedYearEndBalance: currentBalance + predictedIncome - predictedExpenses,
            monthlyBreakdown: monthlyPredictions,
            confidenceLevel: this.calculateConfidence(monthlyPredictions)
        };
    }

    /**
     * Détecte les anomalies dans les dépenses
     */
    detectAnomalies(period = 'month') {
        const transactions = this.getTransactionsForPeriod(period);
        return this.anomalyDetector.detect(transactions);
    }

    /**
     * MÉTHODE MANQUANTE - Récupère les transactions pour une période donnée
     */
    getTransactionsForPeriod(period = 'month') {
        const now = new Date();
        const transactions = this.transactionManager.getAllTransactions();
        
        let startDate, endDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }

    /**
     * Prédit les dépenses récurrentes
     */
    predictRecurringExpenses() {
        const transactions = this.transactionManager.getAllTransactions();
        const patterns = this.findRecurringPatterns(transactions);
        
        return patterns.map(pattern => ({
            category: pattern.category,
            label: pattern.label,
            amount: pattern.averageAmount,
            frequency: pattern.frequency,
            nextOccurrence: pattern.nextPredicted,
            confidence: pattern.confidence
        }));
    }

    /**
     * Prédit les dépenses pour un mois spécifique
     */
    async predictMonthExpenses(monthsAhead = 1) {
        const historicalData = this.prepareHistoricalData();
        if (historicalData.length < 2) {
            return { expenses: 0, income: 0, confidence: 0 };
        }

        const avgExpenses = historicalData.reduce((sum, month) => sum + month.totalExpenses, 0) / historicalData.length;
        const avgIncome = historicalData.reduce((sum, month) => sum + month.totalIncome, 0) / historicalData.length;
        
        // Ajustement saisonnier simple
        const seasonalFactor = this.getSeasonalFactor(monthsAhead);
        
        return {
            expenses: avgExpenses * seasonalFactor,
            income: avgIncome * seasonalFactor,
            confidence: Math.min(0.8, historicalData.length / 12)
        };
    }

    // ===== PRÉPARATION DES DONNÉES =====

    prepareHistoricalData() {
        const transactions = this.transactionManager.getAllTransactions();
        const grouped = this.groupByMonth(transactions);
        
        return grouped.map(monthData => ({
            date: monthData.date,
            totalExpenses: monthData.expenses,
            totalIncome: monthData.income,
            transactionCount: monthData.transactions.length,
            categories: this.getCategoriesBreakdown(monthData.transactions)
        }));
    }

    groupByMonth(transactions) {
        const groups = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups[key]) {
                groups[key] = {
                    date: new Date(date.getFullYear(), date.getMonth(), 1),
                    transactions: [],
                    expenses: 0,
                    income: 0
                };
            }
            
            groups[key].transactions.push(transaction);
            if (transaction.amount < 0) {
                groups[key].expenses += Math.abs(transaction.amount);
            } else {
                groups[key].income += transaction.amount;
            }
        });
        
        return Object.values(groups).sort((a, b) => a.date - b.date);
    }

    getCategoriesBreakdown(transactions) {
        const breakdown = {};
        
        transactions.forEach(transaction => {
            const category = transaction.category || 'Non catégorisé';
            if (!breakdown[category]) {
                breakdown[category] = 0;
            }
            if (transaction.amount < 0) {
                breakdown[category] += Math.abs(transaction.amount);
            }
        });
        
        return breakdown;
    }

    // ===== PRÉDICTIONS PAR CATÉGORIE =====

    async predictByCategory(historicalData) {
        const categories = this.getAllCategories();
        const predictions = {};
        
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 2) {
                predictions[category] = this.predictCategoryAmount(categoryData);
            } else {
                predictions[category] = { amount: 0, confidence: 0 };
            }
        });
        
        return predictions;
    }

    predictCategoryAmount(categoryData) {
        if (categoryData.length < 2) {
            return { amount: 0, confidence: 0 };
        }
        
        // Moyenne mobile avec pondération récente
        const weights = categoryData.map((_, index) => Math.pow(1.1, index));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        const weightedAverage = categoryData.reduce((sum, data, index) => {
            return sum + (data.amount * weights[index]);
        }, 0) / totalWeight;
        
        const confidence = Math.min(0.9, categoryData.length / 6);
        
        return {
            amount: weightedAverage,
            confidence: confidence
        };
    }

    // ===== MODÈLES DE PRÉDICTION =====

    combineModels(predictions, historicalData) {
        // Calculer la précision de chaque modèle sur les données historiques
        const accuracies = this.calculateModelAccuracies(historicalData);
        
        // Pondération basée sur la précision
        const weights = {
            linear: accuracies.linear * 0.3,
            seasonal: accuracies.seasonal * 0.4,
            exponential: accuracies.exponential * 0.3
        };
        
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        
        const combinedAmount = (
            predictions.linear.amount * weights.linear +
            predictions.seasonal.amount * weights.seasonal +
            predictions.exponential.amount * weights.exponential
        ) / totalWeight;
        
        const combinedConfidence = (
            predictions.linear.confidence * weights.linear +
            predictions.seasonal.confidence * weights.seasonal +
            predictions.exponential.confidence * weights.exponential
        ) / totalWeight;
        
        return {
            amount: combinedAmount,
            confidence: Math.min(combinedConfidence, 0.95) // Cap à 95%
        };
    }

    calculateModelAccuracies(historicalData) {
        if (historicalData.length < 4) {
            return { linear: 0.33, seasonal: 0.33, exponential: 0.34 };
        }
        
        // Test sur les 3 derniers mois
        const testData = historicalData.slice(-3);
        const trainData = historicalData.slice(0, -3);
        
        const accuracies = {};
        
        Object.keys(this.models).forEach(modelName => {
            let totalError = 0;
            
            testData.forEach((actual, index) => {
                const prediction = this.models[modelName].predict(trainData.slice(0, trainData.length + index));
                const error = Math.abs(actual.totalExpenses - prediction.amount) / actual.totalExpenses;
                totalError += error;
            });
            
            accuracies[modelName] = 1 - (totalError / testData.length);
        });
        
        return accuracies;
    }

    // ===== ANALYSE DES TENDANCES =====

    analyzeTrends(historicalData) {
        const trends = {};
        
        // Tendance générale
        trends.overall = this.calculateOverallTrend(historicalData);
        
        // Tendances par catégorie
        const categories = this.getAllCategories();
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 3) {
                trends[category] = this.calculateCategoryTrend(categoryData);
            }
        });
        
        return trends;
    }

    calculateOverallTrend(historicalData) {
        if (historicalData.length < 2) {
            return { direction: 'stable', slope: 0, confidence: 0 };
        }
        
        const values = historicalData.map(month => month.totalExpenses);
        const slope = this.calculateLinearRegression(values).slope;
        
        return {
            direction: slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable',
            slope: slope,
            confidence: Math.min(0.9, historicalData.length / 12)
        };
    }

    calculateCategoryTrend(categoryData) {
        const values = categoryData.map(data => data.amount);
        const slope = this.calculateLinearRegression(values).slope;
        
        return {
            direction: slope > 2 ? 'increasing' : slope < -2 ? 'decreasing' : 'stable',
            slope: slope,
            confidence: Math.min(0.9, categoryData.length / 6)
        };
    }

    calculateLinearRegression(values) {
        const n = values.length;
        const xValues = Array.from({ length: n }, (_, i) => i);
        
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumY = values.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }

    // ===== FACTEURS DE RISQUE =====

    identifyRiskFactors(historicalData) {
        const risks = [];
        
        // Volatilité élevée
        const volatility = this.calculateVolatility(historicalData);
        if (volatility > 0.3) {
            risks.push({
                type: 'high_volatility',
                severity: 'medium',
                description: 'Forte variabilité dans vos dépenses',
                impact: volatility
            });
        }
        
        // Tendance inquiétante
        const trend = this.calculateOverallTrend(historicalData);
        if (trend.slope > 10) {
            risks.push({
                type: 'increasing_expenses',
                severity: 'high',
                description: 'Augmentation continue des dépenses',
                impact: trend.slope
            });
        }
        
        // Catégories problématiques
        const categories = this.getAllCategories();
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 3) {
                const trend = this.calculateCategoryTrend(categoryData);
                if (trend.slope > 15) {
                    risks.push({
                        type: 'category_explosion',
                        severity: 'high',
                        description: `Explosion des dépenses: ${category}`,
                        category: category,
                        impact: trend.slope
                    });
                }
            }
        });
        
        return risks.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));
    }

    calculateVolatility(historicalData) {
        if (historicalData.length < 2) return 0;
        
        const values = historicalData.map(month => month.totalExpenses);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance) / mean; // Coefficient de variation
    }

    getSeverityScore(severity) {
        const scores = { low: 1, medium: 2, high: 3 };
        return scores[severity] || 0;
    }

    // ===== RECOMMANDATIONS INTELLIGENTES =====

    generateRecommendations(historicalData, prediction) {
        const recommendations = [];
        
        // Analyse du budget vs prédictions
        const currentMonth = historicalData[historicalData.length - 1];
        if (prediction.amount > currentMonth.totalExpenses * 1.1) {
            recommendations.push({
                type: 'budget_warning',
                priority: 'high',
                title: 'Dépassement budgétaire prévu',
                description: `Les dépenses prévues (${prediction.amount.toFixed(2)}€) dépassent la moyenne actuelle de 10%`,
                actions: [
                    'Revoir les dépenses non-essentielles',
                    'Reporter certains achats',
                    'Surveiller les catégories en hausse'
                ]
            });
        }
        
        // Recommandations basées sur les tendances
        const trends = this.analyzeTrends(historicalData);
        Object.entries(trends).forEach(([category, trend]) => {
            if (category !== 'overall' && trend.slope > 10) {
                recommendations.push({
                    type: 'category_optimization',
                    priority: 'medium',
                    title: `Optimisation de la catégorie ${category}`,
                    description: `Cette catégorie montre une tendance à la hausse (${trend.slope.toFixed(1)}% par mois)`,
                    actions: [
                        `Analyser les dépenses en ${category}`,
                        'Rechercher des alternatives moins coûteuses',
                        'Définir un budget spécifique'
                    ]
                });
            }
        });
        
        // Recommandations d'épargne
        if (currentMonth && currentMonth.totalIncome > currentMonth.totalExpenses * 1.2) {
            recommendations.push({
                type: 'savings_opportunity',
                priority: 'low',
                title: 'Opportunité d\'épargne',
                description: 'Votre solde positif permet d\'augmenter votre épargne',
                actions: [
                    'Mettre en place un virement automatique',
                    'Considérer des investissements',
                    'Constituer un fonds d\'urgence'
                ]
            });
        }
        
        return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
    }

    // ===== OPTIMISATIONS SUGGÉRÉES =====

    suggestOptimizations(historicalData) {
        const optimizations = [];
        
        // Analyse des catégories coûteuses
        const categories = this.getAllCategories();
        const categoryTotals = {};
        
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            categoryTotals[category] = categoryData.reduce((sum, data) => sum + data.amount, 0);
        });
        
        // Top 3 des catégories les plus coûteuses
        const topCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        topCategories.forEach(([category, total]) => {
            optimizations.push({
                type: 'reduce_category',
                category: category,
                potential: total * 0.1, // 10% d'économie potentielle
                description: `Réduire les dépenses en ${category}`,
                suggestions: this.getCategoryOptimizationSuggestions(category)
            });
        });
        
        // Substitutions suggérées
        const substitutions = this.suggestSubstitutions(historicalData);
        optimizations.push(...substitutions);
        
        // Négociations possibles
        const negotiations = this.identifyNegotiationOpportunities(historicalData);
        optimizations.push(...negotiations);
        
        return optimizations;
    }

    getCategoryOptimizationSuggestions(category) {
        const suggestions = {
            'Alimentation': ['Cuisiner plus à la maison', 'Acheter en gros', 'Comparer les prix'],
            'Transport': ['Utiliser les transports en commun', 'Covoiturage', 'Vélo pour les courtes distances'],
            'Loisirs': ['Activités gratuites', 'Abonnements groupés', 'Offres promotionnelles'],
            'Vêtements': ['Achats en soldes', 'Seconde main', 'Limiter les achats impulsifs']
        };
        
        return suggestions[category] || ['Analyser les dépenses', 'Rechercher des alternatives', 'Comparer les prix'];
    }

    suggestSubstitutions(historicalData) {
        // Implémentation simplifiée pour les substitutions
        return [{
            type: 'substitution',
            description: 'Remplacer les marques premium par des alternatives',
            potential: 50,
            suggestions: ['Marques distributeur', 'Produits en promotion', 'Achats groupés']
        }];
    }

    identifyNegotiationOpportunities(historicalData) {
        // Implémentation simplifiée pour les négociations
        return [{
            type: 'negotiation',
            description: 'Renégocier les contrats récurrents',
            potential: 30,
            suggestions: ['Assurances', 'Abonnements téléphoniques', 'Fournisseurs d\'énergie']
        }];
    }

    // ===== PATTERNS ET SAISONNALITÉ =====

    findRecurringPatterns(transactions) {
        const patterns = [];
        const grouped = this.groupTransactionsBySignature(transactions);
        
        Object.values(grouped).forEach(group => {
            if (group.length >= 3) {
                const pattern = this.analyzeRecurringPattern(group);
                if (pattern.confidence > 0.7) {
                    patterns.push(pattern);
                }
            }
        });
        
        return patterns.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * MÉTHODE MANQUANTE - Analyse un pattern récurrent
     */
    analyzeRecurringPattern(transactions) {
        if (transactions.length < 2) {
            return { confidence: 0 };
        }

        // Trier par date
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculer les intervalles entre transactions
        const intervals = [];
        for (let i = 1; i < sortedTransactions.length; i++) {
            const prevDate = new Date(sortedTransactions[i - 1].date);
            const currentDate = new Date(sortedTransactions[i].date);
            const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            intervals.push(diffDays);
        }
        
        // Déterminer la fréquence moyenne
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // Calculer la variance pour déterminer la régularité
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Confidence basée sur la régularité (plus la variance est faible, plus la confiance est élevée)
        const regularityScore = Math.max(0, 1 - (standardDeviation / avgInterval));
        
        // Confidence basée sur le nombre d'occurrences
        const frequencyScore = Math.min(1, transactions.length / 5);
        
        // Confidence globale
        const confidence = (regularityScore * 0.7 + frequencyScore * 0.3);
        
        // Calculer le montant moyen
        const averageAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length;
        
        // Déterminer le type de fréquence
        let frequency;
        if (avgInterval <= 7) frequency = 'weekly';
        else if (avgInterval <= 32) frequency = 'monthly';
        else if (avgInterval <= 95) frequency = 'quarterly';
        else frequency = 'yearly';
        
        // Prédire la prochaine occurrence
        const lastTransaction = sortedTransactions[sortedTransactions.length - 1];
        const nextPredicted = new Date(lastTransaction.date);
        nextPredicted.setDate(nextPredicted.getDate() + Math.round(avgInterval));
        
        return {
            category: transactions[0].category,
            label: transactions[0].label,
            averageAmount: averageAmount,
            frequency: frequency,
            avgInterval: Math.round(avgInterval),
            nextPredicted: nextPredicted,
            confidence: confidence,
            occurrences: transactions.length
        };
    }

    groupTransactionsBySignature(transactions) {
        const groups = {};
        
        transactions.forEach(transaction => {
            // Créer une signature basée sur le libellé et la catégorie
            const signature = this.createTransactionSignature(transaction);
            if (!groups[signature]) {
                groups[signature] = [];
            }
            groups[signature].push(transaction);
        });
        
        return groups;
    }

    createTransactionSignature(transaction) {
        // Normaliser le libellé pour détecter les patterns
        const normalizedLabel = transaction.label
            .toLowerCase()
            .replace(/\d+/g, '') // Supprimer les chiffres
            .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
            .trim();
        
        return `${normalizedLabel}-${transaction.category}`;
    }

    detectSeasonalPatterns(historicalData) {
        const patterns = [];
        const categories = this.getAllCategories();
        
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 12) { // Au moins un an de données
                const seasonal = this.analyzeSeasonality(categoryData);
                if (seasonal.strength > 0.3) {
                    patterns.push({
                        category,
                        period: seasonal.period,
                        strength: seasonal.strength,
                        description: seasonal.description
                    });
                }
            }
        });
        
        return patterns;
    }

    analyzeSeasonality(categoryData) {
        // Implémentation simplifiée de l'analyse saisonnière
        const monthlyAverages = Array(12).fill(0);
        const monthlyCounts = Array(12).fill(0);
        
        categoryData.forEach(data => {
            const month = new Date(data.date).getMonth();
            monthlyAverages[month] += data.amount;
            monthlyCounts[month]++;
        });
        
        // Calculer les moyennes réelles
        for (let i = 0; i < 12; i++) {
            if (monthlyCounts[i] > 0) {
                monthlyAverages[i] /= monthlyCounts[i];
            }
        }
        
        // Trouver le mois avec le pic le plus élevé
        const maxMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages));
        const minMonth = monthlyAverages.indexOf(Math.min(...monthlyAverages));
        
        const maxValue = monthlyAverages[maxMonth];
        const minValue = monthlyAverages[minMonth];
        const strength = maxValue > 0 ? (maxValue - minValue) / maxValue : 0;
        
        return {
            period: 12,
            strength: strength,
            description: `Pic en ${this.getMonthName(maxMonth)}, minimum en ${this.getMonthName(minMonth)}`
        };
    }

    getMonthName(monthIndex) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return months[monthIndex];
    }

    getSeasonalFactor(monthsAhead) {
        // Facteur saisonnier simplifié
        const targetMonth = (new Date().getMonth() + monthsAhead) % 12;
        
        // Facteurs basés sur des patterns typiques de dépenses
        const seasonalFactors = [
            1.1, // Janvier - après les fêtes
            0.9, // Février
            1.0, // Mars
            1.0, // Avril
            1.0, // Mai
            1.1, // Juin - vacances d'été
            1.2, // Juillet - vacances
            1.2, // Août - vacances
            1.0, // Septembre - rentrée
            1.0, // Octobre
            1.1, // Novembre - préparation fêtes
            1.3  // Décembre - fêtes de fin d'année
        ];
        
        return seasonalFactors[targetMonth];
    }

    // ===== UTILITIES =====

    getAllCategories() {
        return [...new Set(this.transactionManager.getAllTransactions().map(t => t.category))];
    }

    extractCategoryData(historicalData, category) {
        return historicalData.map(month => ({
            date: month.date,
            amount: month.categories[category] || 0
        })).filter(d => d.amount > 0);
    }

    calculatePercentageChange(values) {
        if (values.length < 2) return 0;
        const first = values[0];
        const last = values[values.length - 1];
        return ((last - first) / first) * 100;
    }

    calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        let totalGrowth = 0;
        let periods = 0;
        
        for (let i = 1; i < values.length; i++) {
            if (values[i - 1] > 0) {
                totalGrowth += (values[i] - values[i - 1]) / values[i - 1];
                periods++;
            }
        }
        
        return periods > 0 ? (totalGrowth / periods) * 100 : 0;
    }

    calculateConfidence(predictions) {
        if (!predictions || predictions.length === 0) return 0;
        
        // Confidence basée sur la quantité de données et la cohérence
        const dataQuality = Math.min(1, predictions.length / 6);
        const avgConfidence = predictions.reduce((sum, pred) => sum + (pred.confidence || 0), 0) / predictions.length;
        
        return Math.min(0.95, dataQuality * avgConfidence);
    }

    getPriorityScore(priority) {
        const scores = { low: 1, medium: 2, high: 3 };
        return scores[priority] || 0;
    }

    createBasicPrediction() {
        const recent = this.transactionManager.getMonthlyStats(
            new Date().getFullYear(),
            new Date().getMonth()
        );
        
        return {
            totalAmount: recent.expenses * 1.05, // 5% d'augmentation par défaut
            confidence: 0.3,
            breakdown: {},
            trends: { overall: { direction: 'stable', slope: 0 } },
            recommendations: [{
                type: 'insufficient_data',
                priority: 'medium',
                title: 'Données insuffisantes',
                description: 'Plus de données sont nécessaires pour des prédictions précises',
                actions: ['Continuer à enregistrer les transactions']
            }],
            riskFactors: [],
            optimizationSuggestions: []
        };
    }

    // ===== API PUBLIQUE =====

    async getCompletePredictionReport() {
        const [
            nextMonth,
            yearEnd,
            anomalies,
            recurring
        ] = await Promise.all([
            this.predictNextMonthExpenses(),
            this.predictYearEndBalance(),
            this.detectAnomalies(),
            this.predictRecurringExpenses()
        ]);

        return {
            nextMonth,
            yearEnd,
            anomalies,
            recurring,
            generatedAt: new Date().toISOString(),
            dataQuality: this.assessDataQuality()
        };
    }

    assessDataQuality() {
        const transactions = this.transactionManager.getAllTransactions();
        const monthsOfData = this.groupByMonth(transactions).length;
        
        let score = 0;
        let issues = [];
        
        // Quantité de données
        if (monthsOfData >= 12) score += 40;
        else if (monthsOfData >= 6) score += 30;
        else if (monthsOfData >= 3) score += 20;
        else score += 10;
        
        // Régularité
        const regularityScore = this.calculateDataRegularity(transactions);
        score += regularityScore * 30;
        
        // Complétude des catégories
        const categoriesUsed = this.getAllCategories().length;
        if (categoriesUsed >= 8) score += 20;
        else if (categoriesUsed >= 5) score += 15;
        else score += 10;
        
        // Cohérence des montants
        const consistencyScore = this.calculateAmountConsistency(transactions);
        score += consistencyScore * 10;
        
        if (monthsOfData < 6) issues.push('Données insuffisantes pour prédictions fiables');
        if (regularityScore < 0.5) issues.push('Saisie irrégulière des transactions');
        if (categoriesUsed < 5) issues.push('Catégorisation insuffisante');
        
        return {
            score: Math.min(100, score),
            level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
            monthsOfData: monthsOfData,
            issues: issues
        };
    }

    calculateDataRegularity(transactions) {
        if (transactions.length < 30) return 0.5; // Score moyen pour peu de données
        
        const monthlyGroups = this.groupByMonth(transactions);
        if (monthlyGroups.length < 3) return 0.3;
        
        // Calculer la régularité basée sur le nombre de transactions par mois
        const monthlyCounts = monthlyGroups.map(group => group.transactions.length);
        const avgCount = monthlyCounts.reduce((sum, count) => sum + count, 0) / monthlyCounts.length;
        const variance = monthlyCounts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / monthlyCounts.length;
        
        // Score de régularité (plus la variance est faible, meilleur est le score)
        const regularityScore = Math.max(0, 1 - (Math.sqrt(variance) / avgCount));
        return Math.min(1, regularityScore);
    }

    calculateAmountConsistency(transactions) {
        if (transactions.length < 10) return 0.5;
        
        // Analyser la cohérence des montants par catégorie
        const categories = this.getAllCategories();
        let totalConsistency = 0;
        let validCategories = 0;
        
        categories.forEach(category => {
            const categoryTransactions = transactions.filter(t => t.category === category);
            if (categoryTransactions.length >= 3) {
                const amounts = categoryTransactions.map(t => Math.abs(t.amount));
                const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
                const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
                
                // Score de cohérence pour cette catégorie
                const consistency = avgAmount > 0 ? Math.max(0, 1 - (Math.sqrt(variance) / avgAmount)) : 0;
                totalConsistency += consistency;
                validCategories++;
            }
        });
        
        return validCategories > 0 ? totalConsistency / validCategories : 0.5;
    }
}

// ===== MODÈLES DE PRÉDICTION =====

class LinearRegressionModel {
    predict(historicalData) {
        if (historicalData.length < 2) {
            return { amount: 0, confidence: 0 };
        }
        
        const values = historicalData.map(month => month.totalExpenses);
        const regression = this.calculateLinearRegression(values);
        
        // Prédiction pour le mois suivant
        const nextValue = regression.intercept + regression.slope * values.length;
        
        // Confidence basée sur le R² (coefficient de détermination)
        const rSquared = this.calculateRSquared(values, regression);
        
        return {
            amount: Math.max(0, nextValue),
            confidence: Math.min(0.9, rSquared)
        };
    }
    
    calculateLinearRegression(values) {
        const n = values.length;
        const xValues = Array.from({ length: n }, (_, i) => i);
        
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumY = values.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
    
    calculateRSquared(values, regression) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        let totalSumSquares = 0;
        let residualSumSquares = 0;
        
        values.forEach((value, index) => {
            const predicted = regression.intercept + regression.slope * index;
            totalSumSquares += Math.pow(value - mean, 2);
            residualSumSquares += Math.pow(value - predicted, 2);
        });
        
        return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    }
}

class SeasonalModel {
    predict(historicalData) {
        if (historicalData.length < 6) {
            return { amount: 0, confidence: 0 };
        }
        
        // Décomposition saisonnière simple
        const seasonalComponent = this.extractSeasonalComponent(historicalData);
        const trendComponent = this.extractTrendComponent(historicalData);
        
        // Prédiction en combinant tendance et saisonnalité
        const nextMonth = (new Date().getMonth() + 1) % 12;
        const prediction = trendComponent + seasonalComponent[nextMonth];
        
        const confidence = Math.min(0.8, historicalData.length / 12);
        
        return {
            amount: Math.max(0, prediction),
            confidence: confidence
        };
    }
    
    extractSeasonalComponent(historicalData) {
        const monthlyAverages = Array(12).fill(0);
        const monthlyCounts = Array(12).fill(0);
        
        historicalData.forEach(month => {
            const monthIndex = month.date.getMonth();
            monthlyAverages[monthIndex] += month.totalExpenses;
            monthlyCounts[monthIndex]++;
        });
        
        // Calculer les moyennes
        for (let i = 0; i < 12; i++) {
            if (monthlyCounts[i] > 0) {
                monthlyAverages[i] /= monthlyCounts[i];
            }
        }
        
        // Normaliser par rapport à la moyenne générale
        const globalAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
        return monthlyAverages.map(avg => avg - globalAverage);
    }
    
    extractTrendComponent(historicalData) {
        const values = historicalData.map(month => month.totalExpenses);
        const linearModel = new LinearRegressionModel();
        const regression = linearModel.calculateLinearRegression(values);
        
        return regression.intercept + regression.slope * values.length;
    }
}

class ExponentialSmoothingModel {
    predict(historicalData) {
        if (historicalData.length < 3) {
            return { amount: 0, confidence: 0 };
        }
        
        const values = historicalData.map(month => month.totalExpenses);
        const alpha = 0.3; // Paramètre de lissage
        
        let smoothedValue = values[0];
        
        for (let i = 1; i < values.length; i++) {
            smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue;
        }
        
        // La prédiction est la dernière valeur lissée
        const confidence = Math.min(0.85, historicalData.length / 8);
        
        return {
            amount: smoothedValue,
            confidence: confidence
        };
    }
}

class AnomalyDetector {
    detect(transactions) {
        if (!transactions || transactions.length < 10) {
            return [];
        }
        
        const anomalies = [];
        
        // Détection basée sur les montants
        const amounts = transactions.map(t => Math.abs(t.amount));
        const amountAnomalies = this.detectAmountAnomalies(transactions, amounts);
        anomalies.push(...amountAnomalies);
        
        // Détection basée sur la fréquence
        const frequencyAnomalies = this.detectFrequencyAnomalies(transactions);
        anomalies.push(...frequencyAnomalies);
        
        return anomalies.sort((a, b) => b.severity - a.severity);
    }
    
    detectAmountAnomalies(transactions, amounts) {
        const anomalies = [];
        
        // Calcul des statistiques
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Seuil pour détecter les anomalies (2 écarts-types)
        const threshold = mean + 2 * stdDev;
        
        transactions.forEach(transaction => {
            const amount = Math.abs(transaction.amount);
            if (amount > threshold) {
                const severity = Math.min(1, (amount - threshold) / threshold);
                anomalies.push({
                    type: 'amount',
                    transaction: transaction,
                    severity: severity,
                    description: `Montant inhabituel: ${amount.toFixed(2)}€ (moyenne: ${mean.toFixed(2)}€)`,
                    expectedRange: `${(mean - stdDev).toFixed(2)}€ - ${(mean + stdDev).toFixed(2)}€`
                });
            }
        });
        
        return anomalies;
    }
    
    detectFrequencyAnomalies(transactions) {
        // Implémentation simplifiée pour les anomalies de fréquence
        const anomalies = [];
        
        // Grouper par catégorie et analyser la fréquence
        const categoryGroups = {};
        transactions.forEach(transaction => {
            const category = transaction.category || 'Non catégorisé';
            if (!categoryGroups[category]) {
                categoryGroups[category] = [];
            }
            categoryGroups[category].push(transaction);
        });
        
        Object.entries(categoryGroups).forEach(([category, categoryTransactions]) => {
            if (categoryTransactions.length >= 5) {
                // Analyser les intervalles entre transactions
                const sortedTransactions = categoryTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
                const intervals = [];
                
                for (let i = 1; i < sortedTransactions.length; i++) {
                    const prevDate = new Date(sortedTransactions[i - 1].date);
                    const currentDate = new Date(sortedTransactions[i].date);
                    const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                    intervals.push(diffDays);
                }
                
                const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                const lastInterval = intervals[intervals.length - 1];
                
                // Détecter les anomalies de fréquence (transaction trop tôt ou trop tard)
                if (Math.abs(lastInterval - avgInterval) > avgInterval * 0.5) {
                    anomalies.push({
                        type: 'frequency',
                        category: category,
                        severity: Math.min(1, Math.abs(lastInterval - avgInterval) / avgInterval),
                        description: `Fréquence inhabituelle pour ${category}`,
                        expectedInterval: `${avgInterval.toFixed(0)} jours`,
                        actualInterval: `${lastInterval.toFixed(0)} jours`
                    });
                }
            }
        });
        
        return anomalies;
    }
}

class TrendAnalyzer {
    analyzeTrend(data) {
        if (!data || data.length < 3) {
            return { direction: 'insufficient_data', strength: 0, confidence: 0 };
        }
        
        // Calcul de la tendance par régression linéaire
        const values = data.map((item, index) => ({ x: index, y: item }));
        const regression = this.calculateLinearRegression(values);
        
        // Déterminer la direction
        let direction;
        if (Math.abs(regression.slope) < 0.1) {
            direction = 'stable';
        } else if (regression.slope > 0) {
            direction = 'increasing';
        } else {
            direction = 'decreasing';
        }
        
        // Calculer la force de la tendance
        const strength = Math.min(1, Math.abs(regression.slope) / (data[0] || 1));
        
        // Calculer la confiance basée sur le R²
        const rSquared = this.calculateRSquared(values, regression);
        
        return {
            direction: direction,
            strength: strength,
            confidence: rSquared,
            slope: regression.slope
        };
    }
    
    calculateLinearRegression(points) {
        const n = points.length;
        const sumX = points.reduce((sum, point) => sum + point.x, 0);
        const sumY = points.reduce((sum, point) => sum + point.y, 0);
        const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
    
    calculateRSquared(points, regression) {
        const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
        
        let totalSumSquares = 0;
        let residualSumSquares = 0;
        
        points.forEach(point => {
            const predicted = regression.intercept + regression.slope * point.x;
            totalSumSquares += Math.pow(point.y - meanY, 2);
            residualSumSquares += Math.pow(point.y - predicted, 2);
        });
        
        return totalSumSquares > 0 ? Math.max(0, 1 - (residualSumSquares / totalSumSquares)) : 0;
    }
}

// Export de la classe principale
if (typeof window !== 'undefined') {
    window.BudgetPredictionsAI = BudgetPredictionsAI;
}