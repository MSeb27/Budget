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

    // ===== MODÈLES DE PRÉDICTION =====

    prepareHistoricalData() {
        const transactions = this.transactionManager.getAllTransactions();
        const monthlyData = this.groupByMonth(transactions);
        
        return monthlyData.map(month => ({
            date: month.date,
            totalExpenses: month.expenses,
            totalIncome: month.income,
            balance: month.income - month.expenses,
            categories: month.categoryBreakdown,
            transactionCount: month.count
        }));
    }

    groupByMonth(transactions) {
        const groups = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups[monthKey]) {
                groups[monthKey] = {
                    date: monthKey,
                    income: 0,
                    expenses: 0,
                    count: 0,
                    categoryBreakdown: {}
                };
            }
            
            if (transaction.type === 'income') {
                groups[monthKey].income += transaction.amount;
            } else {
                groups[monthKey].expenses += transaction.amount;
            }
            
            groups[monthKey].count++;
            
            // Breakdown par catégorie
            const category = transaction.category;
            if (!groups[monthKey].categoryBreakdown[category]) {
                groups[monthKey].categoryBreakdown[category] = 0;
            }
            groups[monthKey].categoryBreakdown[category] += transaction.amount;
        });
        
        return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
    }

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
            
            accuracies[modelName] = Math.max(0.1, 1 - (totalError / testData.length));
        });
        
        return accuracies;
    }

    async predictByCategory(historicalData) {
        const categories = this.getAllCategories();
        const predictions = {};
        
        for (const category of categories) {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 2) {
                const prediction = this.models.linear.predict(categoryData);
                predictions[category] = {
                    predicted: prediction.amount,
                    confidence: prediction.confidence,
                    trend: this.calculateCategoryTrend(categoryData),
                    seasonality: this.detectSeasonality(categoryData)
                };
            }
        }
        
        return predictions;
    }

    // ===== ANALYSE DES TENDANCES =====

    analyzeTrends(historicalData) {
        const trends = {
            overall: this.calculateOverallTrend(historicalData),
            categories: {},
            patterns: this.identifyPatterns(historicalData)
        };
        
        const categories = this.getAllCategories();
        categories.forEach(category => {
            const categoryData = this.extractCategoryData(historicalData, category);
            if (categoryData.length >= 3) {
                trends.categories[category] = this.calculateCategoryTrend(categoryData);
            }
        });
        
        return trends;
    }

    calculateOverallTrend(data) {
        if (data.length < 2) return { direction: 'stable', slope: 0 };
        
        const expenses = data.map(d => d.totalExpenses);
        const slope = this.calculateSlope(expenses);
        
        return {
            direction: slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable',
            slope: slope,
            percentage: this.calculatePercentageChange(expenses),
            volatility: this.calculateVolatility(expenses)
        };
    }

    calculateCategoryTrend(categoryData) {
        const amounts = categoryData.map(d => d.amount || 0);
        const slope = this.calculateSlope(amounts);
        
        return {
            direction: slope > 2 ? 'increasing' : slope < -2 ? 'decreasing' : 'stable',
            slope: slope,
            volatility: this.calculateVolatility(amounts),
            growth: this.calculateGrowthRate(amounts)
        };
    }

    calculateSlope(values) {
        const n = values.length;
        if (n < 2) return 0;
        
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    calculateVolatility(values) {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance) / mean;
    }

    // ===== DÉTECTION D'ANOMALIES =====

    identifyRiskFactors(historicalData) {
        const risks = [];
        
        // Croissance rapide des dépenses
        const overallTrend = this.calculateOverallTrend(historicalData);
        if (overallTrend.slope > 10) {
            risks.push({
                type: 'rapid_growth',
                severity: 'high',
                description: 'Croissance rapide des dépenses détectée',
                impact: overallTrend.slope
            });
        }
        
        // Volatilité élevée
        if (overallTrend.volatility > 0.3) {
            risks.push({
                type: 'high_volatility',
                severity: 'medium',
                description: 'Dépenses très variables d\'un mois à l\'autre',
                impact: overallTrend.volatility
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
                    'Surveiller les catégories à risque'
                ]
            });
        }
        
        // Recommandations par catégorie
        const categoryAnalysis = this.analyzeCategoryEfficiency(historicalData);
        categoryAnalysis.forEach(analysis => {
            if (analysis.optimization > 0) {
                recommendations.push({
                    type: 'category_optimization',
                    priority: 'medium',
                    title: `Optimiser: ${analysis.category}`,
                    description: `Économies potentielles: ${analysis.optimization.toFixed(2)}€`,
                    actions: analysis.suggestions
                });
            }
        });
        
        // Détection de saisonnalité
        const seasonalPatterns = this.detectSeasonalPatterns(historicalData);
        seasonalPatterns.forEach(pattern => {
            recommendations.push({
                type: 'seasonal_planning',
                priority: 'low',
                title: `Planification saisonnière: ${pattern.category}`,
                description: `Pattern détecté: ${pattern.description}`,
                actions: [`Anticiper les variations pour ${pattern.period}`]
            });
        });
        
        return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
    }

    suggestOptimizations(historicalData) {
        const optimizations = [];
        
        // Analyse des doublons potentiels
        const duplicates = this.findPotentialDuplicates(historicalData);
        if (duplicates.length > 0) {
            optimizations.push({
                type: 'eliminate_duplicates',
                savings: duplicates.reduce((sum, d) => sum + d.amount, 0),
                description: `${duplicates.length} transactions suspectes détectées`,
                items: duplicates
            });
        }
        
        // Substitutions suggérées
        const substitutions = this.suggestSubstitutions(historicalData);
        optimizations.push(...substitutions);
        
        // Négociations possibles
        const negotiations = this.identifyNegotiationOpportunities(historicalData);
        optimizations.push(...negotiations);
        
        return optimizations;
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
            issues,
            monthsOfData,
            suggestions: this.generateDataQualitySuggestions(score, issues)
        };
    }

    calculateDataRegularity(transactions) {
        const monthlyData = this.groupByMonth(transactions);
        if (monthlyData.length < 2) return 0;
        
        const gaps = [];
        for (let i = 1; i < monthlyData.length; i++) {
            const current = new Date(monthlyData[i].date);
            const previous = new Date(monthlyData[i-1].date);
            const monthsDiff = (current.getFullYear() - previous.getFullYear()) * 12 + 
                             (current.getMonth() - previous.getMonth());
            gaps.push(monthsDiff);
        }
        
        const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        return Math.max(0, 1 - Math.abs(avgGap - 1) * 0.5);
    }

    calculateAmountConsistency(transactions) {
        const amounts = transactions.map(t => t.amount);
        const outliers = this.anomalyDetector.detectOutliers(amounts);
        return Math.max(0, 1 - (outliers.length / amounts.length));
    }

    generateDataQualitySuggestions(score, issues) {
        const suggestions = [];
        
        if (score < 60) {
            suggestions.push('Saisir régulièrement toutes les transactions');
            suggestions.push('Utiliser des catégories détaillées');
            suggestions.push('Vérifier la cohérence des montants');
        }
        
        if (issues.includes('Données insuffisantes pour prédictions fiables')) {
            suggestions.push('Continuer la saisie pendant au moins 6 mois');
        }
        
        return suggestions;
    }
}

// ===== MODÈLES DE PRÉDICTION SPÉCIALISÉS =====

class LinearRegressionModel {
    predict(data) {
        if (data.length < 2) {
            return { amount: 0, confidence: 0 };
        }
        
        const expenses = data.map(d => d.totalExpenses);
        const x = Array.from({length: expenses.length}, (_, i) => i);
        
        // Calcul de la régression linéaire
        const n = expenses.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = expenses.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * expenses[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const nextValue = slope * n + intercept;
        
        // Calcul de la confiance basé sur R²
        const meanY = sumY / n;
        const ssRes = expenses.reduce((sum, val, i) => {
            const predicted = slope * i + intercept;
            return sum + Math.pow(val - predicted, 2);
        }, 0);
        const ssTot = expenses.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);
        
        return {
            amount: Math.max(0, nextValue),
            confidence: Math.max(0.1, Math.min(0.9, rSquared))
        };
    }
}

class SeasonalModel {
    predict(data) {
        if (data.length < 4) {
            return { amount: 0, confidence: 0 };
        }
        
        const expenses = data.map(d => d.totalExpenses);
        
        // Détection de saisonnalité simple (cycle de 12 mois)
        const currentMonth = new Date().getMonth();
        const seasonalFactors = this.calculateSeasonalFactors(data);
        
        const baselineAverage = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;
        const seasonalFactor = seasonalFactors[currentMonth] || 1;
        
        const prediction = baselineAverage * seasonalFactor;
        const confidence = this.calculateSeasonalConfidence(data);
        
        return {
            amount: Math.max(0, prediction),
            confidence: Math.max(0.2, Math.min(0.8, confidence))
        };
    }
    
    calculateSeasonalFactors(data) {
        const monthlyAverages = {};
        const monthlyData = {};
        
        data.forEach(d => {
            const date = new Date(d.date);
            const month = date.getMonth();
            
            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(d.totalExpenses);
        });
        
        const overallAverage = data.reduce((sum, d) => sum + d.totalExpenses, 0) / data.length;
        
        Object.keys(monthlyData).forEach(month => {
            const monthData = monthlyData[month];
            const monthAverage = monthData.reduce((sum, val) => sum + val, 0) / monthData.length;
            monthlyAverages[month] = monthAverage / overallAverage;
        });
        
        return monthlyAverages;
    }
    
    calculateSeasonalConfidence(data) {
        if (data.length < 12) return 0.3;
        
        const seasonalFactors = this.calculateSeasonalFactors(data);
        const variance = Object.values(seasonalFactors).reduce((sum, factor) => {
            return sum + Math.pow(factor - 1, 2);
        }, 0) / Object.keys(seasonalFactors).length;
        
        return Math.max(0.2, 1 - variance);
    }
}

class ExponentialSmoothingModel {
    predict(data, alpha = 0.3) {
        if (data.length < 2) {
            return { amount: 0, confidence: 0 };
        }
        
        const expenses = data.map(d => d.totalExpenses);
        let smoothed = expenses[0];
        
        for (let i = 1; i < expenses.length; i++) {
            smoothed = alpha * expenses[i] + (1 - alpha) * smoothed;
        }
        
        // Calcul de l'erreur moyenne pour la confiance
        let totalError = 0;
        let currentSmoothed = expenses[0];
        
        for (let i = 1; i < expenses.length; i++) {
            const prediction = currentSmoothed;
            const actual = expenses[i];
            totalError += Math.abs(actual - prediction) / actual;
            currentSmoothed = alpha * actual + (1 - alpha) * currentSmoothed;
        }
        
        const averageError = totalError / (expenses.length - 1);
        const confidence = Math.max(0.1, 1 - averageError);
        
        return {
            amount: Math.max(0, smoothed),
            confidence: Math.min(0.8, confidence)
        };
    }
}

class AnomalyDetector {
    detect(transactions) {
        const anomalies = [];
        const amounts = transactions.map(t => t.amount);
        
        // Détection par IQR (Interquartile Range)
        const outliers = this.detectOutliers(amounts);
        
        transactions.forEach((transaction, index) => {
            if (outliers.includes(transaction.amount)) {
                anomalies.push({
                    transaction,
                    type: 'amount_outlier',
                    severity: this.calculateSeverity(transaction.amount, amounts),
                    description: `Montant inhabituel: ${transaction.amount}€`
                });
            }
        });
        
        // Détection de fréquence anormale
        const frequencyAnomalies = this.detectFrequencyAnomalies(transactions);
        anomalies.push(...frequencyAnomalies);
        
        return anomalies.sort((a, b) => b.severity - a.severity);
    }
    
    detectOutliers(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        return values.filter(value => value < lowerBound || value > upperBound);
    }
    
    calculateSeverity(amount, allAmounts) {
        const mean = allAmounts.reduce((sum, val) => sum + val, 0) / allAmounts.length;
        const deviation = Math.abs(amount - mean) / mean;
        
        if (deviation > 3) return 1; // Très élevé
        if (deviation > 2) return 0.8; // Élevé
        if (deviation > 1) return 0.6; // Modéré
        return 0.4; // Faible
    }
    
    detectFrequencyAnomalies(transactions) {
        // Implémentation simplifiée pour détecter des transactions inhabituellement fréquentes
        const dailyCounts = {};
        
        transactions.forEach(t => {
            const date = t.date;
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        const frequencies = Object.values(dailyCounts);
        const avgFrequency = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
        const anomalies = [];
        
        Object.entries(dailyCounts).forEach(([date, count]) => {
            if (count > avgFrequency * 3) { // Plus de 3x la moyenne
                const dayTransactions = transactions.filter(t => t.date === date);
                anomalies.push({
                    type: 'frequency_anomaly',
                    date,
                    count,
                    severity: Math.min(1, count / (avgFrequency * 3)),
                    description: `${count} transactions en une journée`,
                    transactions: dayTransactions
                });
            }
        });
        
        return anomalies;
    }
}

class TrendAnalyzer {
    analyzeLongTermTrends(data, periods = 12) {
        if (data.length < periods) return null;
        
        const recent = data.slice(-periods);
        const expenses = recent.map(d => d.totalExpenses);
        
        return {
            trend: this.calculateTrendDirection(expenses),
            volatility: this.calculateVolatility(expenses),
            cycles: this.detectCycles(expenses),
            acceleration: this.calculateAcceleration(expenses)
        };
    }
    
    calculateTrendDirection(values) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        return {
            direction: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable',
            magnitude: Math.abs(change),
            percentage: change * 100
        };
    }
    
    calculateAcceleration(values) {
        if (values.length < 3) return 0;
        
        const velocities = [];
        for (let i = 1; i < values.length; i++) {
            velocities.push(values[i] - values[i - 1]);
        }
        
        let acceleration = 0;
        for (let i = 1; i < velocities.length; i++) {
            acceleration += velocities[i] - velocities[i - 1];
        }
        
        return acceleration / (velocities.length - 1);
    }
    
    detectCycles(values) {
        // Détection simple de cycles en cherchant des patterns répétitifs
        const cycles = [];
        
        for (let period = 2; period <= Math.floor(values.length / 2); period++) {
            const correlation = this.calculateAutocorrelation(values, period);
            if (correlation > 0.7) {
                cycles.push({
                    period,
                    strength: correlation,
                    description: `Cycle de ${period} mois détecté`
                });
            }
        }
        
        return cycles.sort((a, b) => b.strength - a.strength);
    }
    
    calculateAutocorrelation(values, lag) {
        if (lag >= values.length) return 0;
        
        const n = values.length - lag;
        const mean1 = values.slice(0, n).reduce((sum, v) => sum + v, 0) / n;
        const mean2 = values.slice(lag).reduce((sum, v) => sum + v, 0) / n;
        
        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;
        
        for (let i = 0; i < n; i++) {
            const diff1 = values[i] - mean1;
            const diff2 = values[i + lag] - mean2;
            
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }
        
        return numerator / Math.sqrt(denom1 * denom2);
    }
}