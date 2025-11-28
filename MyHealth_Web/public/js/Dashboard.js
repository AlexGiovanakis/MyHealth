import { DataManager } from './datamanager.js';
import { FilterManager } from './FilterManager.js';
import { MultiSelectManager } from './MultiSelectManager.js';
import { ChartManager } from './ChartManager.js';
import { DatePickerManager } from './DatePickerManager.js';
import { StatisticsManager } from './StatisticsManager.js';
import { AdvancedChartsManager } from './AdvancedChartsManager.js';

class Dashboard {
    constructor() {
        this.dataManager = new DataManager();
        this.filterManager = new FilterManager(this.dataManager);
        
        this.multiSelectManager = new MultiSelectManager(this);
        this.chartManager = new ChartManager(this.filterManager);
        this.datePickerManager = new DatePickerManager(this.filterManager, () => this.updateUI());
        this.statisticsManager = new StatisticsManager(this.filterManager);
        this.advancedChartsManager = new AdvancedChartsManager(this.filterManager);

        this.contextualFilteringEnabled = true;
        
        this.initializeUI();
        this.initializeEventListeners();
        this.initializeSmartFiltering();
        this.datePickerManager.initialize();
        
        this.dataManager.onDataLoaded((data) => {
            this.onDataLoaded(data);
        });
        this.dataManager.initialize();
    }

    initializeUI() {
        this.multiSelectManager.initializeStaticMultiSelects();
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.multi-select-container')) {
                this.multiSelectManager.closeAllDropdowns();
            }
        });

        const clearAllBtn = document.getElementById('clearAllFilters');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        this.setupFilterSummaryUpdates();
    }

    initializeSmartFiltering() {
        const toggle = document.getElementById('autoFilterToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.toggleContextualFiltering(e.target.checked);
            });
        }
    }

    clearAllFilters() {
        try {
            this.multiSelectManager.resetAllContextualFilters();
            this.datePickerManager.clearDateFilter();
            this.updateFilterSummary();
            this.updateUI();
            this.showToast('Όλα τα φίλτρα καθαρίστηκαν', 'success');
            
        } catch (error) {
            console.error('Error clearing filters:', error);
            this.showToast('Σφάλμα κατά τον καθαρισμό φίλτρων', 'error');
        }
    }

    setupFilterSummaryUpdates() {
        const originalUpdateFilters = this.filterManager.updateFilters.bind(this.filterManager);
        this.filterManager.updateFilters = (filterType, values) => {
            originalUpdateFilters(filterType, values);
            this.updateFilterSummary();
        };
    }

    updateFilterSummary() {
        const summary = this.filterManager.getFilterSummary();
        const countElement = document.getElementById('activeFiltersCount');
        
        if (countElement) {
            const activeCount = summary.activeFilterCount;
            countElement.textContent = activeCount === 0 ? 
                'Κανένα ενεργό φίλτρο' : 
                `${activeCount} ενεργά φίλτρα`;
            
            countElement.className = activeCount > 0 ? 'active' : '';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `filter-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    toggleContextualFiltering(enabled) {
        this.contextualFilteringEnabled = enabled;
        this.multiSelectManager.updateAllContextualOptions();
        
        if (!enabled) {
            this.datePickerManager.resetToFullRange();
        }
    }

    onDataLoaded(data) {
        try {
            this.filterManager.filteredData = [...data];
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('chartsContainer').style.display = 'grid';
            
            this.multiSelectManager.populateDynamicFilters();
            this.datePickerManager.setupCalendarWithLimits();
            this.updateUI();
            
        } catch (error) {
            console.error('Error processing loaded data:', error);
            this.showToast('Σφάλμα φόρτωσης δεδομένων', 'error');
            
            document.getElementById('loading').innerHTML = `
                <div style="color: #e74c3c;">
                    ⚠️ Σφάλμα φόρτωσης δεδομένων
                    <br><small>Παρακαλώ ανανεώστε τη σελίδα</small>
                </div>
            `;
        }
    }

    updateUI() {
        try {
            this.statisticsManager.updateStatistics();
            this.chartManager.updateAllCharts();
            this.advancedChartsManager.updateAllAdvancedCharts();
            this.updateFilterSummary();
            
        } catch (error) {
            console.error('Error updating UI:', error);
            this.showToast('Σφάλμα ενημέρωσης γραφημάτων', 'error');
        }
    }

    updateUIAnimated() {
        this.statisticsManager.updateStatisticsAnimated();
        this.chartManager.updateAllCharts();
        this.advancedChartsManager.updateAllAdvancedCharts();
    }

    resetDashboard() {
        try {
            this.statisticsManager.resetStatistics();
            this.chartManager.destroyAllCharts();
            this.advancedChartsManager.destroyAllCharts();
            this.datePickerManager.clearDateFilter();
            this.multiSelectManager.closeAllDropdowns();
            this.updateFilterSummary();
            
        } catch (error) {
            console.error('Error resetting dashboard:', error);
        }
    }

    getContextualFilteringSummary() {
        const summary = {
            enabled: this.contextualFilteringEnabled,
            activeFilters: this.multiSelectManager.multiSelectStates,
            dateRange: this.datePickerManager.getContextualRangeInfo(),
            filteredRecords: this.filterManager.getFilteredData().length,
            totalRecords: this.dataManager.getAllData().length
        };
        
        return summary;
    }

    exportDashboardData() {
        const stats = this.statisticsManager.getStatistics();
        const selectedDates = this.datePickerManager.getSelectedDates();
        const chartData = this.filterManager.getChartData();
        
        return {
            statistics: stats,
            selectedDateRange: selectedDates,
            chartData: chartData,
            advancedChartsState: this.advancedChartsManager.exportState(),
            contextualFiltering: this.getContextualFilteringSummary(),
            timestamp: new Date().toISOString()
        };
    }

    getDashboardSummary() {
        return this.statisticsManager.getStatisticsSummary();
    }

    refreshData() {
        this.dataManager.initialize();
    }

    getPerformanceMetrics() {
        return {
            dataManager: {
                recordCount: this.dataManager.getAllData().length,
                cacheSize: this.dataManager._dataCache?.size || 0
            },
            filterManager: {
                filteredCount: this.filterManager.getFilteredData().length,
                cacheSize: this.filterManager._filterCache?.size || 0,
                activeFilters: this.filterManager.hasActiveFilters()
            },
            chartManager: {
                activeCharts: Object.values(this.chartManager.charts).filter(chart => chart !== null).length,
                totalCharts: Object.keys(this.chartManager.charts).length
            },
            advancedCharts: this.advancedChartsManager.getPerformanceMetrics(),
            multiSelect: this.multiSelectManager.getPerformanceMetrics(),
            datePicker: this.datePickerManager.getPerformanceMetrics(),
            contextualFiltering: this.contextualFilteringEnabled,
            timestamp: new Date().toISOString()
        };
    }

    debugDashboard() {
        const performanceMetrics = this.getPerformanceMetrics();
        const contextualSummary = this.getContextualFilteringSummary();
        const filterState = this.filterManager.exportFilterState();
        
        return {
            performance: performanceMetrics,
            contextual: contextualSummary,
            filters: filterState
        };
    }

    destroy() {
        if (this.advancedChartsManager) {
            this.advancedChartsManager.destroy();
        }
        
        if (this.chartManager) {
            this.chartManager.destroyAllCharts();
        }
        
        if (this.multiSelectManager) {
            this.multiSelectManager.destroy();
        }
        
        if (this.datePickerManager) {
            this.datePickerManager.destroy();
        }
        
        if (this.dataManager) {
            this.dataManager.clearData();
        }
        
        if (this.filterManager) {
            this.filterManager.clearAllFilters();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.healthDashboard = new Dashboard();
    
    window.debugDashboard = () => {
        if (window.healthDashboard) {
            return window.healthDashboard.debugDashboard();
        }
    };
});

export default Dashboard;