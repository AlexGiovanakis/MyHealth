export class AdvancedChartsManager {
    constructor(filterManager) {
        this.filterManager = filterManager;
        this.charts = {
            symptomsTimeline: null,
            diseasesTimeline: null,
            locationSymptomsTimeline: null,
            locationDiseasesTimeline: null
        };
    }

    updateAllAdvancedCharts() {
        this.updateTimelineCharts();
        this.updateLocationTimelineCharts();
    }

    updateTimelineCharts() {
        this.updateSymptomsTimeline();
        this.updateDiseasesTimeline();
    }

    updateLocationTimelineCharts() {
        this.updateLocationSymptomsTimeline();
        this.updateLocationDiseasesTimeline();
    }

    updateSymptomsTimeline() {
        const globalDateRange = this.filterManager.filters.dateRange;
        const startDate = globalDateRange?.start || null;
        const endDate = globalDateRange?.end || null;
        
        const timelineData = this.filterManager.getSymptomsTimelineDataByDateRange(startDate, endDate);

        if (!timelineData || timelineData.isEmpty) {
            this.showEmptyTimelineMessage('symptomsTimelineChart', timelineData?.message || 'Δεν υπάρχουν δεδομένα συμπτωμάτων');
            return;
        }

        this.updateTimelineInfo('symptomsTimelineInfo', timelineData);

        this.updateTimelineChart('symptomsTimeline', 'symptomsTimelineChart', {
            type: 'line',
            data: timelineData,
            options: this.getTimelineChartOptions('Συχνότητα Συμπτωμάτων')
        });
    }

    updateDiseasesTimeline() {
        const globalDateRange = this.filterManager.filters.dateRange;
        const startDate = globalDateRange?.start || null;
        const endDate = globalDateRange?.end || null;
        
        const timelineData = this.filterManager.getDiseasesTimelineDataByDateRange(startDate, endDate);

        if (!timelineData || timelineData.isEmpty) {
            this.showEmptyTimelineMessage('diseasesTimelineChart', timelineData?.message || 'Δεν υπάρχουν δεδομένα ασθενειών');
            return;
        }

        this.updateTimelineInfo('diseasesTimelineInfo', timelineData);

        this.updateTimelineChart('diseasesTimeline', 'diseasesTimelineChart', {
            type: 'line',
            data: timelineData,
            options: this.getTimelineChartOptions('Συχνότητα Ασθενειών')
        });
    }

    updateLocationSymptomsTimeline() {
        const globalDateRange = this.filterManager.filters.dateRange;
        const startDate = globalDateRange?.start || null;
        const endDate = globalDateRange?.end || null;
        
        const timelineData = this.filterManager.getLocationSymptomsTimelineData(startDate, endDate);

        if (!timelineData || timelineData.isEmpty) {
            this.showEmptyTimelineMessage('singleSymptomTimelineChart', timelineData?.message || 'Δεν υπάρχουν δεδομένα συμπτωμάτων ανά τοποθεσία');
            return;
        }

        this.updateLocationTimelineInfo('singleSymptomTimelineInfo', timelineData, 'συμπτωμάτων');

        this.updateTimelineChart('locationSymptomsTimeline', 'singleSymptomTimelineChart', {
            type: 'line',
            data: timelineData,
            options: this.getLocationTimelineChartOptions('Συμπτώματα ανά Τοποθεσία')
        });
    }

    updateLocationDiseasesTimeline() {
        const globalDateRange = this.filterManager.filters.dateRange;
        const startDate = globalDateRange?.start || null;
        const endDate = globalDateRange?.end || null;
        
        const timelineData = this.filterManager.getLocationDiseasesTimelineData(startDate, endDate);

        if (!timelineData || timelineData.isEmpty) {
            this.showEmptyTimelineMessage('singleConditionTimelineChart', timelineData?.message || 'Δεν υπάρχουν δεδομένα ασθενειών ανά τοποθεσία');
            return;
        }

        this.updateLocationTimelineInfo('singleConditionTimelineInfo', timelineData, 'ασθενειών');

        this.updateTimelineChart('locationDiseasesTimeline', 'singleConditionTimelineChart', {
            type: 'line',
            data: timelineData,
            options: this.getLocationTimelineChartOptions('Ασθένειες ανά Τοποθεσία')
        });
    }

    updateTimelineChart(chartKey, canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        
        const container = canvas.closest('.chart-wrapper');
        if (container) {
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '350px';
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
        }

        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
        }

        const enhancedConfig = {
            ...config,
            options: {
                ...config.options,
                responsive: true,
                maintainAspectRatio: false
            }
        };

        this.charts[chartKey] = new Chart(ctx, enhancedConfig);
    }

    getLocationTimelineChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 1,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 40,
                    left: 20
                }
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                        filter: function(legendItem, chartData) {
                            return true;
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `📅 ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const location = context.dataset.label;
                            const value = context.parsed.y;
                            return `🌍 ${location}: ${value} περιπτώσεις`;
                        },
                        afterBody: function(tooltipItems) {
                            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                            return `📊 Σύνολο: ${total} περιπτώσεις`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Ημερομηνίες',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 8,
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 11 }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Αριθμός Περιπτώσεων',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        };
    }

    getTimelineChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 1,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 40,
                    left: 20
                }
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Ημερομηνίες',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 8,
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 11 }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Αριθμός Περιπτώσεων',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            }
        };
    }

    updateTimelineInfo(infoElementId, timelineData) {
        const infoElement = document.getElementById(infoElementId);
        if (!infoElement) return;

        const totalAssessments = timelineData.totalAssessments || 0;
        const meta = timelineData.metadata || {};
        const mode = timelineData.mode || 'discovery';
        
        let dateRangeText = 'όλα τα δεδομένα';
        const globalDateRange = this.filterManager.filters.dateRange;
        
        if (globalDateRange && globalDateRange.start && globalDateRange.end) {
            const startStr = globalDateRange.start.toLocaleDateString('el-GR');
            const endStr = globalDateRange.end.toLocaleDateString('el-GR');
            dateRangeText = `${startStr} - ${endStr}`;
        }

        let modeText = '';
        let itemsInfo = '';

        if (mode === 'selected') {
            const selectedItems = meta.selectedItems || [];
            const displayedItems = meta.displayedItems || [];
            modeText = `Επιλεγμένα (${displayedItems.length}/${selectedItems.length})`;
            itemsInfo = displayedItems.length;
        } else {
            const topItemsCount = meta.topItems?.length || timelineData.datasets?.length || 0;
            const totalItemsCount = meta.totalItems || 0;
            modeText = `Κορυφαία ${topItemsCount}`;
            itemsInfo = topItemsCount;
        }

        if (meta.totalOccurrences !== undefined) {
            const totalOccurrences = Math.round(meta.totalOccurrences || 0);
            const periodsCount = timelineData.labels?.length || 0;

            infoElement.textContent = `📊 ${modeText} | ${totalOccurrences} συνολικά | ${periodsCount} ημέρες | ${dateRangeText}`;
        } else {
            const periodsCount = timelineData.labels?.length || 0;

            infoElement.textContent = `📊 ${modeText} | ${totalAssessments} αξιολογήσεις | ${periodsCount} ημέρες | ${dateRangeText}`;
        }
    }

    updateLocationTimelineInfo(infoElementId, timelineData, dataType) {
        const infoElement = document.getElementById(infoElementId);
        if (!infoElement) return;

        const totalAssessments = timelineData.totalAssessments || 0;
        const meta = timelineData.metadata || {};
        
        let dateRangeText = 'όλα τα δεδομένα';
        const globalDateRange = this.filterManager.filters.dateRange;
        
        if (globalDateRange && globalDateRange.start && globalDateRange.end) {
            const startStr = globalDateRange.start.toLocaleDateString('el-GR');
            const endStr = globalDateRange.end.toLocaleDateString('el-GR');
            dateRangeText = `${startStr} - ${endStr}`;
        }

        const totalOccurrences = Math.round(meta.totalOccurrences || 0);
        const locationsCount = meta.topLocations?.length || 0;
        const totalLocations = meta.totalLocations || 0;
        const periodsCount = timelineData.labels?.length || 0;

        infoElement.textContent = `🌍 ${totalOccurrences} ${dataType} | ${locationsCount} τοποθεσίες | ${periodsCount} ημέρες | ${dateRangeText}`;
    }

    showEmptyTimelineMessage(canvasId, message) {
        const chartKey = this.getChartKeyFromCanvasId(canvasId);
        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
            this.charts[chartKey] = null;
        }

        const infoId = canvasId.replace('Chart', 'Info');
        const infoElement = document.getElementById(infoId);
        if (infoElement) {
            infoElement.textContent = '📊 Δεν υπάρχουν δεδομένα';
        }

        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    getChartKeyFromCanvasId(canvasId) {
        if (canvasId.includes('symptomsTimeline')) return 'symptomsTimeline';
        if (canvasId.includes('diseasesTimeline')) return 'diseasesTimeline';
        if (canvasId.includes('singleSymptomTimeline')) return 'locationSymptomsTimeline';
        if (canvasId.includes('singleConditionTimeline')) return 'locationDiseasesTimeline';
        return 'symptomsTimeline';
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        this.charts = {
            symptomsTimeline: null,
            diseasesTimeline: null,
            locationSymptomsTimeline: null,
            locationDiseasesTimeline: null
        };
    }

    getChart(chartKey) {
        return this.charts[chartKey];
    }

    hasChart(chartKey) {
        return this.charts[chartKey] !== null;
    }

    exportState() {
        return {
            hasCharts: Object.values(this.charts).some(chart => chart !== null),
            chartCount: Object.values(this.charts).filter(chart => chart !== null).length,
            locationChartsEnabled: true,
            selectedOnlyMode: true,
            timestamp: new Date().toISOString()
        };
    }

    getPerformanceMetrics() {
        return {
            chartsCount: Object.keys(this.charts).length,
            activeCharts: Object.values(this.charts).filter(chart => chart !== null).length,
            locationChartsEnabled: true,
            selectedOnlyMode: true,
            usesGlobalDateFilter: true,
            timestamp: new Date().toISOString()
        };
    }

    getCurrentModes() {
        return {
            symptoms: this.filterManager.filters.symptoms.length > 0 ? 'selected' : 'discovery',
            diseases: this.filterManager.filters.ailments.length > 0 ? 'selected' : 'discovery',
            locations: 'top-locations'
        };
    }

    hasSelectedModeActive() {
        const modes = this.getCurrentModes();
        return modes.symptoms === 'selected' || modes.diseases === 'selected';
    }

    getSelectedItemsSummary() {
        const selectedSymptoms = this.filterManager.filters.symptoms;
        const selectedAilments = this.filterManager.filters.ailments;
        
        return {
            symptoms: {
                count: selectedSymptoms.length,
                items: selectedSymptoms,
                mode: selectedSymptoms.length > 0 ? 'selected' : 'discovery'
            },
            ailments: {
                count: selectedAilments.length,
                items: selectedAilments,
                mode: selectedAilments.length > 0 ? 'selected' : 'discovery'
            },
            hasSelections: selectedSymptoms.length > 0 || selectedAilments.length > 0
        };
    }

    destroy() {
        this.destroyAllCharts();
    }
}