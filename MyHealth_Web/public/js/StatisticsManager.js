export class StatisticsManager {
    constructor(filterManager) {
        this.filterManager = filterManager;
    }

    updateStatistics() {
        const stats = this.filterManager.getStatistics();
        
        document.getElementById('totalAssessments').textContent = stats.totalAssessments;
        document.getElementById('avgMatch').textContent = stats.avgMatch + '%';
        document.getElementById('topAilment').textContent = stats.topAilment;
        document.getElementById('mostCommonSymptom').textContent = stats.mostCommonSymptom;
        document.getElementById('citiesCount').textContent = stats.citiesCount;
    }

    getStatistics() {
        return this.filterManager.getStatistics();
    }

    updateSpecificStatistic(statKey, value) {
        const elementId = this.getElementIdForStat(statKey);
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        }
    }

    formatStatistic(statKey, value) {
        switch(statKey) {
            case 'avgMatch':
                return `${value}%`;
            case 'totalAssessments':
            case 'citiesCount':
                return value.toString();
            case 'topAilment':
            case 'mostCommonSymptom':
                return value || '-';
            default:
                return value;
        }
    }

    getElementIdForStat(statKey) {
        const mapping = {
            'totalAssessments': 'totalAssessments',
            'avgMatch': 'avgMatch',
            'topAilment': 'topAilment',
            'mostCommonSymptom': 'mostCommonSymptom',
            'citiesCount': 'citiesCount'
        };
        return mapping[statKey];
    }

    animateStatisticUpdate(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.transform = 'scale(1.1)';
            element.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
            }, 150);
        }
    }

    updateStatisticsAnimated() {
        const stats = this.filterManager.getStatistics();
        
        this.animateStatisticUpdate('totalAssessments', stats.totalAssessments);
        this.animateStatisticUpdate('avgMatch', stats.avgMatch + '%');
        this.animateStatisticUpdate('topAilment', stats.topAilment);
        this.animateStatisticUpdate('mostCommonSymptom', stats.mostCommonSymptom);
        this.animateStatisticUpdate('citiesCount', stats.citiesCount);
    }

    resetStatistics() {
        document.getElementById('totalAssessments').textContent = '0';
        document.getElementById('avgMatch').textContent = '0%';
        document.getElementById('topAilment').textContent = '-';
        document.getElementById('mostCommonSymptom').textContent = '-';
        document.getElementById('citiesCount').textContent = '0';
    }

    validateStatistics(stats) {
        const required = ['totalAssessments', 'avgMatch', 'topAilment', 'mostCommonSymptom', 'citiesCount'];
        return required.every(key => stats.hasOwnProperty(key));
    }

    getStatisticsSummary() {
        const stats = this.filterManager.getStatistics();
        return `
            Συνολικές Αξιολογήσεις: ${stats.totalAssessments}
            Μέσος Όρος Ταιριάσματος: ${stats.avgMatch}%
            Πιο Συχνή Ασθένεια: ${stats.topAilment}
            Πιο Συχνό Σύμπτωμα: ${stats.mostCommonSymptom}
            Πόλεις που Καλύπτονται: ${stats.citiesCount}
        `.trim();
    }
}