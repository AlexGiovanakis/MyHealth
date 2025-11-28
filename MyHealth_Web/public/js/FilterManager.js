export class FilterManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.filteredData = [];
        this.filters = {
            ages: [],
            genders: [],
            cities: [],
            ailments: [],
            symptoms: [],
            dateRange: null
        };
        this._filterCache = new Map();
    }

    updateFilters(filterType, values) {
        this.filters[filterType] = values;
        this.clearRelevantCache(filterType);
        this.applyFilters();
    }

    clearRelevantCache(changedFilterType) {
        const keysToRemove = [];
        
        for (let key of this._filterCache.keys()) {
            if (this.shouldClearCacheKey(key, changedFilterType)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            this._filterCache.delete(key);
        });
    }

    shouldClearCacheKey(cacheKey, changedFilterType) {
        if (cacheKey.includes(changedFilterType)) {
            return true;
        }
        
        const filterTypeMap = {
            'ages': 'ages',
            'genders': 'genders', 
            'cities': 'cities',
            'ailments': 'ailments',
            'symptoms': 'symptoms',
            'dateRange': 'nodate'
        };
        
        const cacheFilterName = filterTypeMap[changedFilterType];
        if (cacheFilterName && cacheKey.includes(cacheFilterName)) {
            return true;
        }
        
        return false;
    }

    applyFilters() {
        const allData = this.dataManager.getAllData();
        const beforeFilterCount = allData.length;

        this.filteredData = allData.filter(record => {
            if (this.filters.ages.length > 0 && !this.filters.ages.includes(record.ageRange)) {
                return false;
            }

            if (this.filters.genders.length > 0 && !this.filters.genders.includes(record.gender)) {
                return false;
            }

            if (this.filters.cities.length > 0 && !this.filters.cities.includes(record.city)) {
                return false;
            }

            if (this.filters.ailments.length > 0) {
                const hasAnyAilment = record.ailments.some(ailment =>
                    this.filters.ailments.includes(ailment.name)
                );
                if (!hasAnyAilment) return false;
            }

            if (this.filters.symptoms.length > 0) {
                const hasAnySymptom = record.ailments.some(ailment =>
                    this.filters.symptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasAnySymptom) return false;
            }

            if (this.filters.dateRange) {
                const recordDate = record.date;
                const { start, end } = this.filters.dateRange;
                if (recordDate < start || recordDate > end) {
                    return false;
                }
            }

            return true;
        });
    }

    getFilteredData() {
        return this.filteredData;
    }

    clearAllFilters() {
        this.filters = {
            ages: [],
            genders: [],
            cities: [],
            ailments: [],
            symptoms: [],
            dateRange: null
        };
        this._filterCache.clear();
        this.filteredData = [...this.dataManager.getAllData()];
    }

    getSymptomsTimelineDataByDateRange(startDate, endDate) {
        let baseData = this.getFilteredData();
        const dateFilteredData = this.filterDataByDateRange(baseData, startDate, endDate);
        
        if (dateFilteredData.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: 0,
                isEmpty: true,
                message: 'Δεν υπάρχουν δεδομένα συμπτωμάτων για την επιλεγμένη χρονική περίοδο',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const uniqueDates = this.getUniqueDatesFromData(dateFilteredData);
        
        if (uniqueDates.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν έγκυρες ημερομηνίες στα δεδομένα',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const symptomOccurrencesByDate = this.countSymptomsPerDate(dateFilteredData, uniqueDates);
        const totalSymptomFrequency = this.calculateTotalFrequencies(symptomOccurrencesByDate);

        const selectedSymptoms = this.filters.symptoms;
        let symptomsToShow;
        let mode = 'discovery';

        if (selectedSymptoms.length > 0) {
            mode = 'selected';
            
            symptomsToShow = selectedSymptoms.filter(symptom => 
                totalSymptomFrequency[symptom] && totalSymptomFrequency[symptom] > 0
            );
            
            if (symptomsToShow.length === 0) {
                return {
                    datasets: [],
                    labels: [],
                    totalAssessments: dateFilteredData.length,
                    isEmpty: true,
                    message: 'Τα επιλεγμένα συμπτώματα δεν βρέθηκαν στα φιλτραρισμένα δεδομένα',
                    view: this.getViewNameFromDateRange(startDate, endDate)
                };
            }
        } else {
            mode = 'discovery';
            
            const maxSymptoms = 7;
            symptomsToShow = Object.entries(totalSymptomFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxSymptoms)
                .map(([symptom]) => symptom);
        }

        const datasets = symptomsToShow.map((symptom, index) => {
            const data = uniqueDates.map(dateStr => {
                return symptomOccurrencesByDate[dateStr]?.[symptom] || 0;
            });

            const total = data.reduce((sum, count) => sum + count, 0);
            const peak = Math.max(...data);
            const nonZeroCount = data.filter(count => count > 0).length;

            return {
                label: symptom,
                data: data,
                borderColor: this.getTimelineColor(index),
                backgroundColor: this.getTimelineColor(index, 0.1),
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                showLine: true,
                pointRadius: data.map(count => count === 0 ? 0 : Math.min(3 + count * 0.5, 8)),
                pointHoverRadius: data.map(count => count === 0 ? 0 : Math.min(5 + count * 0.5, 12)),
                pointBackgroundColor: this.getTimelineColor(index),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                spanGaps: false,
                _meta: {
                    total: total,
                    peak: peak,
                    average: (total / data.length).toFixed(2),
                    activePeriods: nonZeroCount,
                    frequency: totalSymptomFrequency[symptom],
                    type: 'symptoms',
                    mode: mode
                }
            };
        });

        const formattedLabels = uniqueDates.map(dateStr => {
            const [day, month] = dateStr.split('/');
            return `${day}/${month}`;
        });

        const additionalSymptoms = Object.keys(totalSymptomFrequency).length - symptomsToShow.length;
        const displayedSymptomOccurrences = symptomsToShow.reduce((sum, symptom) => 
            sum + (totalSymptomFrequency[symptom] || 0), 0);

        return {
            labels: formattedLabels,
            datasets: datasets,
            totalAssessments: dateFilteredData.length,
            isEmpty: false,
            view: this.getViewNameFromDateRange(startDate, endDate),
            mode: mode,
            
            metadata: {
                type: 'symptoms',
                mode: mode,
                totalItems: Object.keys(totalSymptomFrequency).length,
                displayedItems: symptomsToShow,
                selectedItems: selectedSymptoms,
                additionalItems: additionalSymptoms,
                totalOccurrences: displayedSymptomOccurrences,
                dateRange: {
                    start: uniqueDates[0],
                    end: uniqueDates[uniqueDates.length - 1]
                },
                averagePerPeriod: (displayedSymptomOccurrences / uniqueDates.length).toFixed(1),
                daysWithData: uniqueDates.length
            },
            
            rawData: {
                uniqueDates: uniqueDates,
                symptomOccurrencesByDate: symptomOccurrencesByDate,
                totalFrequencies: totalSymptomFrequency
            }
        };
    }

    getDiseasesTimelineDataByDateRange(startDate, endDate) {
        let baseData = this.getFilteredData();
        const dateFilteredData = this.filterDataByDateRange(baseData, startDate, endDate);
        
        if (dateFilteredData.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: 0,
                isEmpty: true,
                message: 'Δεν υπάρχουν δεδομένα ασθενειών για την επιλεγμένη χρονική περίοδο',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const uniqueDates = this.getUniqueDatesFromData(dateFilteredData);
        
        if (uniqueDates.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν έγκυρες ημερομηνίες στα δεδομένα',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const diseaseOccurrencesByDate = this.countDiseasesPerDate(dateFilteredData, uniqueDates);
        const totalDiseaseFrequency = this.calculateTotalFrequencies(diseaseOccurrencesByDate);

        const selectedAilments = this.filters.ailments;
        let ailmentsToShow;
        let mode = 'discovery';

        if (selectedAilments.length > 0) {
            mode = 'selected';
            
            ailmentsToShow = selectedAilments.filter(ailment => 
                totalDiseaseFrequency[ailment] && totalDiseaseFrequency[ailment] > 0
            );
            
            if (ailmentsToShow.length === 0) {
                return {
                    datasets: [],
                    labels: [],
                    totalAssessments: dateFilteredData.length,
                    isEmpty: true,
                    message: 'Οι επιλεγμένες ασθένειες δεν βρέθηκαν στα φιλτραρισμένα δεδομένα',
                    view: this.getViewNameFromDateRange(startDate, endDate)
                };
            }
        } else {
            mode = 'discovery';
            
            const maxDiseases = 7;
            ailmentsToShow = Object.entries(totalDiseaseFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxDiseases)
                .map(([disease]) => disease);
        }

        const datasets = ailmentsToShow.map((disease, index) => {
            const data = uniqueDates.map(dateStr => {
                return diseaseOccurrencesByDate[dateStr]?.[disease] || 0;
            });

            const total = data.reduce((sum, count) => sum + count, 0);
            const peak = Math.max(...data);
            const nonZeroCount = data.filter(count => count > 0).length;

            return {
                label: disease,
                data: data,
                borderColor: this.getTimelineColor(index),
                backgroundColor: this.getTimelineColor(index, 0.15),
                borderWidth: 2.5,
                fill: false,
                tension: 0.2,
                showLine: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: this.getTimelineColor(index),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                spanGaps: false,
                _meta: {
                    total: total,
                    peak: peak,
                    average: (total / data.length).toFixed(2),
                    activePeriods: nonZeroCount,
                    frequency: totalDiseaseFrequency[disease],
                    type: 'diseases',
                    mode: mode
                }
            };
        });

        const formattedLabels = uniqueDates.map(dateStr => {
            const [day, month] = dateStr.split('/');
            return `${day}/${month}`;
        });

        const additionalDiseases = Object.keys(totalDiseaseFrequency).length - ailmentsToShow.length;
        const displayedDiseaseOccurrences = ailmentsToShow.reduce((sum, disease) => 
            sum + (totalDiseaseFrequency[disease] || 0), 0);

        return {
            labels: formattedLabels,
            datasets: datasets,
            totalAssessments: dateFilteredData.length,
            isEmpty: false,
            view: this.getViewNameFromDateRange(startDate, endDate),
            mode: mode,
            
            metadata: {
                type: 'diseases',
                mode: mode,
                totalItems: Object.keys(totalDiseaseFrequency).length,
                displayedItems: ailmentsToShow,
                selectedItems: selectedAilments,
                additionalItems: additionalDiseases,
                totalOccurrences: displayedDiseaseOccurrences,
                dateRange: {
                    start: uniqueDates[0],
                    end: uniqueDates[uniqueDates.length - 1]
                },
                averagePerPeriod: (displayedDiseaseOccurrences / uniqueDates.length).toFixed(1),
                daysWithData: uniqueDates.length
            },
            
            rawData: {
                uniqueDates: uniqueDates,
                diseaseOccurrencesByDate: diseaseOccurrencesByDate,
                totalFrequencies: totalDiseaseFrequency
            }
        };
    }

    getLocationSymptomsTimelineData(startDate, endDate) {
        let baseData = this.getFilteredData();
        const dateFilteredData = this.filterDataByDateRange(baseData, startDate, endDate);
        
        if (dateFilteredData.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: 0,
                isEmpty: true,
                message: 'Δεν υπάρχουν δεδομένα συμπτωμάτων ανά τοποθεσία για την επιλεγμένη χρονική περίοδο',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const uniqueDates = this.getUniqueDatesFromData(dateFilteredData);
        
        if (uniqueDates.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν έγκυρες ημερομηνίες στα δεδομένα',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const topLocations = this.getTopLocations(dateFilteredData, 7);
        
        if (topLocations.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν τοποθεσίες με δεδομένα συμπτωμάτων',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const symptomsByLocationAndDate = this.countSymptomsPerLocationAndDate(dateFilteredData, uniqueDates);

        const datasets = topLocations.map((location, index) => {
            const data = uniqueDates.map(dateStr => {
                return symptomsByLocationAndDate[location]?.[dateStr] || 0;
            });

            const total = data.reduce((sum, count) => sum + count, 0);
            const peak = Math.max(...data);
            const nonZeroCount = data.filter(count => count > 0).length;

            return {
                label: location,
                data: data,
                borderColor: this.getTimelineColor(index),
                backgroundColor: this.getTimelineColor(index, 0.1),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                showLine: true,
                pointRadius: data.map(count => count === 0 ? 0 : Math.min(4 + count * 0.3, 8)),
                pointHoverRadius: data.map(count => count === 0 ? 0 : Math.min(6 + count * 0.3, 12)),
                pointBackgroundColor: this.getTimelineColor(index),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                spanGaps: false,
                _meta: {
                    total: total,
                    peak: peak,
                    average: (total / data.length).toFixed(2),
                    activePeriods: nonZeroCount,
                    location: location,
                    type: 'location-symptoms'
                }
            };
        });

        const formattedLabels = uniqueDates.map(dateStr => {
            const [day, month] = dateStr.split('/');
            return `${day}/${month}`;
        });

        const totalSymptomOccurrences = Object.values(symptomsByLocationAndDate)
            .reduce((total, locationData) => {
                return total + Object.values(locationData).reduce((sum, count) => sum + count, 0);
            }, 0);

        return {
            labels: formattedLabels,
            datasets: datasets,
            totalAssessments: dateFilteredData.length,
            isEmpty: false,
            view: this.getViewNameFromDateRange(startDate, endDate),
            
            metadata: {
                type: 'location-symptoms',
                totalLocations: topLocations.length,
                topLocations: topLocations,
                totalOccurrences: totalSymptomOccurrences,
                dateRange: {
                    start: uniqueDates[0],
                    end: uniqueDates[uniqueDates.length - 1]
                },
                averagePerPeriod: (totalSymptomOccurrences / uniqueDates.length).toFixed(1),
                daysWithData: uniqueDates.length
            },
            
            rawData: {
                uniqueDates: uniqueDates,
                symptomsByLocationAndDate: symptomsByLocationAndDate,
                topLocations: topLocations
            }
        };
    }

    getLocationDiseasesTimelineData(startDate, endDate) {
        let baseData = this.getFilteredData();
        const dateFilteredData = this.filterDataByDateRange(baseData, startDate, endDate);
        
        if (dateFilteredData.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: 0,
                isEmpty: true,
                message: 'Δεν υπάρχουν δεδομένα ασθενειών ανά τοποθεσία για την επιλεγμένη χρονική περίοδο',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const uniqueDates = this.getUniqueDatesFromData(dateFilteredData);
        
        if (uniqueDates.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν έγκυρες ημερομηνίες στα δεδομένα',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const topLocations = this.getTopLocations(dateFilteredData, 7);
        
        if (topLocations.length === 0) {
            return {
                datasets: [],
                labels: [],
                totalAssessments: dateFilteredData.length,
                isEmpty: true,
                message: 'Δεν υπάρχουν τοποθεσίες με δεδομένα ασθενειών',
                view: this.getViewNameFromDateRange(startDate, endDate)
            };
        }

        const diseasesByLocationAndDate = this.countDiseasesPerLocationAndDate(dateFilteredData, uniqueDates);

        const datasets = topLocations.map((location, index) => {
            const data = uniqueDates.map(dateStr => {
                return diseasesByLocationAndDate[location]?.[dateStr] || 0;
            });

            const total = data.reduce((sum, count) => sum + count, 0);
            const peak = Math.max(...data);
            const nonZeroCount = data.filter(count => count > 0).length;

            return {
                label: location,
                data: data,
                borderColor: this.getTimelineColor(index),
                backgroundColor: this.getTimelineColor(index, 0.15),
                borderWidth: 2.5,
                fill: false,
                tension: 0.3,
                showLine: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: this.getTimelineColor(index),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                spanGaps: false,
                _meta: {
                    total: total,
                    peak: peak,
                    average: (total / data.length).toFixed(2),
                    activePeriods: nonZeroCount,
                    location: location,
                    type: 'location-diseases'
                }
            };
        });

        const formattedLabels = uniqueDates.map(dateStr => {
            const [day, month] = dateStr.split('/');
            return `${day}/${month}`;
        });

        const totalDiseaseOccurrences = Object.values(diseasesByLocationAndDate)
            .reduce((total, locationData) => {
                return total + Object.values(locationData).reduce((sum, count) => sum + count, 0);
            }, 0);

        return {
            labels: formattedLabels,
            datasets: datasets,
            totalAssessments: dateFilteredData.length,
            isEmpty: false,
            view: this.getViewNameFromDateRange(startDate, endDate),
            
            metadata: {
                type: 'location-diseases',
                totalLocations: topLocations.length,
                topLocations: topLocations,
                totalOccurrences: totalDiseaseOccurrences,
                dateRange: {
                    start: uniqueDates[0],
                    end: uniqueDates[uniqueDates.length - 1]
                },
                averagePerPeriod: (totalDiseaseOccurrences / uniqueDates.length).toFixed(1),
                daysWithData: uniqueDates.length
            },
            
            rawData: {
                uniqueDates: uniqueDates,
                diseasesByLocationAndDate: diseasesByLocationAndDate,
                topLocations: topLocations
            }
        };
    }

    filterDataByDateRange(data, startDate, endDate) {
        if (!startDate && !endDate) {
            return data;
        }

        return data.filter(record => {
            if (!record.date) return false;

            const recordDate = record.date;

            if (startDate && recordDate < startDate) {
                return false;
            }

            if (endDate && recordDate > endDate) {
                return false;
            }

            return true;
        });
    }

    getUniqueDatesFromData(data) {
        const dates = new Set();
        
        data.forEach(record => {
            if (record.date) {
                const dateStr = this.formatDateForDisplay(record.date);
                dates.add(dateStr);
            }
        });

        return Array.from(dates).sort((a, b) => {
            const dateA = this.parseDisplayDate(a);
            const dateB = this.parseDisplayDate(b);
            return dateA - dateB;
        });
    }

    countSymptomsPerDate(data, uniqueDates) {
        const symptomsByDate = {};
        
        uniqueDates.forEach(dateStr => {
            symptomsByDate[dateStr] = {};
        });

        data.forEach(record => {
            const dateStr = this.formatDateForDisplay(record.date);
            if (symptomsByDate[dateStr]) {
                record.symptomsArray.forEach(symptom => {
                    if (!symptomsByDate[dateStr][symptom]) {
                        symptomsByDate[dateStr][symptom] = 0;
                    }
                    symptomsByDate[dateStr][symptom]++;
                });
            }
        });

        return symptomsByDate;
    }

    countDiseasesPerDate(data, uniqueDates) {
        const diseasesByDate = {};
        
        uniqueDates.forEach(dateStr => {
            diseasesByDate[dateStr] = {};
        });

        data.forEach(record => {
            const dateStr = this.formatDateForDisplay(record.date);
            if (diseasesByDate[dateStr]) {
                record.ailments.forEach(ailment => {
                    if (!diseasesByDate[dateStr][ailment.name]) {
                        diseasesByDate[dateStr][ailment.name] = 0;
                    }
                    
                    diseasesByDate[dateStr][ailment.name]++;
                });
            }
        });

        return diseasesByDate;
    }

    calculateTotalFrequencies(occurrencesByDate) {
        const totals = {};
        
        Object.values(occurrencesByDate).forEach(dateData => {
            Object.entries(dateData).forEach(([item, count]) => {
                totals[item] = (totals[item] || 0) + count;
            });
        });

        return totals;
    }

    getViewNameFromDateRange(startDate, endDate) {
        if (!startDate && !endDate) {
            return 'all';
        }

        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 7) return '7days';
            if (diffDays <= 30) return '30days';
            if (diffDays <= 90) return '90days';
            return 'custom';
        }

        return 'custom';
    }

    countSymptomsPerLocationAndDate(data, uniqueDates) {
        const result = {};
        
        data.forEach(record => {
            if (!result[record.city]) {
                result[record.city] = {};
            }
        });

        data.forEach(record => {
            const location = record.city;
            const dateStr = this.formatDateForDisplay(record.date);
            
            if (!result[location][dateStr]) {
                result[location][dateStr] = 0;
            }
            
            result[location][dateStr] += record.symptomsArray.length;
        });
        
        return result;
    }

    countDiseasesPerLocationAndDate(data, uniqueDates) {
        const result = {};
        
        data.forEach(record => {
            if (!result[record.city]) {
                result[record.city] = {};
            }
        });

        data.forEach(record => {
            const location = record.city;
            const dateStr = this.formatDateForDisplay(record.date);
            
            if (!result[location][dateStr]) {
                result[location][dateStr] = 0;
            }
            
            result[location][dateStr] += record.ailments.length;
        });
        
        return result;
    }

    getTopLocations(data, limit = 7) {
        const locationCounts = {};
        
        data.forEach(record => {
            if (record.city) {
                locationCounts[record.city] = (locationCounts[record.city] || 0) + 1;
            }
        });
        
        const sortedLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([location]) => location);
        
        return sortedLocations;
    }

    getSymptomsTimelineData(granularity = 'weekly') {
        return this.getSymptomsTimelineDataByDateRange(null, null);
    }

    getDiseasesTimelineData(granularity = 'weekly') {
        return this.getDiseasesTimelineDataByDateRange(null, null);
    }

    formatDateForDisplay(date) {
        if (!date) return 'Unknown';
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    parseDisplayDate(dateStr) {
        if (!dateStr || dateStr === 'Unknown') return new Date();
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }

    getTimelineColor(index, alpha = 1) {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
            '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];

        if (alpha !== 1) {
            const hex = colors[index % colors.length];
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        return colors[index % colors.length];
    }

    getLineThickness(index) {
        if (index < 5) return 3;
        if (index < 15) return 2;
        return 1;
    }

    getContextualAges(selectedGenders = [], selectedCities = [], selectedAilments = [], selectedSymptoms = [], selectedDateRange = null) {
        const cacheKey = `ages_${selectedGenders.join(',')}_${selectedCities.join(',')}_${selectedAilments.join(',')}_${selectedSymptoms.join(',')}_${selectedDateRange ? `${selectedDateRange.start.getTime()}-${selectedDateRange.end.getTime()}` : 'nodate'}`;

        if (this._filterCache.has(cacheKey)) {
            return this._filterCache.get(cacheKey);
        }

        if (selectedGenders.length === 0 && selectedCities.length === 0 &&
            selectedAilments.length === 0 && selectedSymptoms.length === 0 && !selectedDateRange) {
            const allAges = ['0-17', '18-30', '31-50', '51-70', '70+'];
            return allAges;
        }

        const contextualAges = new Set();
        const allData = this.dataManager.getAllData();

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedGenders.length > 0 && !selectedGenders.includes(record.gender)) {
                includeRecord = false;
            }

            if (selectedCities.length > 0 && !selectedCities.includes(record.city)) {
                includeRecord = false;
            }

            if (selectedAilments.length > 0) {
                const hasAilment = record.ailments.some(ailment =>
                    selectedAilments.includes(ailment.name)
                );
                if (!hasAilment) includeRecord = false;
            }

            if (selectedSymptoms.length > 0) {
                const hasSymptom = record.ailments.some(ailment =>
                    selectedSymptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasSymptom) includeRecord = false;
            }

            if (selectedDateRange) {
                const recordDate = record.date;
                const { start, end } = selectedDateRange;
                if (recordDate < start || recordDate > end) {
                    includeRecord = false;
                }
            }

            if (includeRecord && record.ageRange) {
                contextualAges.add(record.ageRange);
            }
        });

        const resultAges = Array.from(contextualAges).sort();
        this._filterCache.set(cacheKey, resultAges);

        return resultAges;
    }

    getContextualGenders(selectedAges = [], selectedCities = [], selectedAilments = [], selectedSymptoms = [], selectedDateRange = null) {
        const cacheKey = `genders_${selectedAges.join(',')}_${selectedCities.join(',')}_${selectedAilments.join(',')}_${selectedSymptoms.join(',')}_${selectedDateRange ? `${selectedDateRange.start.getTime()}-${selectedDateRange.end.getTime()}` : 'nodate'}`;

        if (this._filterCache.has(cacheKey)) {
            return this._filterCache.get(cacheKey);
        }

        if (selectedAges.length === 0 && selectedCities.length === 0 &&
            selectedAilments.length === 0 && selectedSymptoms.length === 0 && !selectedDateRange) {
            const allGenders = ['Male', 'Female', 'Other'];
            return allGenders;
        }

        const contextualGenders = new Set();
        const allData = this.dataManager.getAllData();

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedAges.length > 0 && !selectedAges.includes(record.ageRange)) {
                includeRecord = false;
            }

            if (selectedCities.length > 0 && !selectedCities.includes(record.city)) {
                includeRecord = false;
            }

            if (selectedAilments.length > 0) {
                const hasAilment = record.ailments.some(ailment =>
                    selectedAilments.includes(ailment.name)
                );
                if (!hasAilment) includeRecord = false;
            }

            if (selectedSymptoms.length > 0) {
                const hasSymptom = record.ailments.some(ailment =>
                    selectedSymptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasSymptom) includeRecord = false;
            }

            if (selectedDateRange) {
                const recordDate = record.date;
                const { start, end } = selectedDateRange;
                if (recordDate < start || recordDate > end) {
                    includeRecord = false;
                }
            }

            if (includeRecord && record.gender) {
                contextualGenders.add(record.gender);
            }
        });

        const resultGenders = Array.from(contextualGenders).sort();
        this._filterCache.set(cacheKey, resultGenders);

        return resultGenders;
    }

    getContextualSymptoms(selectedAges = [], selectedGenders = [], selectedCities = [], selectedAilments = [], selectedDateRange = null) {
        const cacheKey = `symptoms_${selectedAges.join(',')}_${selectedGenders.join(',')}_${selectedCities.join(',')}_${selectedAilments.join(',')}_${selectedDateRange ? `${selectedDateRange.start.getTime()}-${selectedDateRange.end.getTime()}` : 'nodate'}`;

        if (this._filterCache.has(cacheKey)) {
            return this._filterCache.get(cacheKey);
        }

        if (selectedAges.length === 0 && selectedGenders.length === 0 &&
            selectedCities.length === 0 && selectedAilments.length === 0 && !selectedDateRange) {
            const allSymptoms = this.dataManager.getUniqueValues('symptoms');
            return allSymptoms;
        }

        const contextualSymptoms = new Set();
        const allData = this.dataManager.getAllData();

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedAges.length > 0 && !selectedAges.includes(record.ageRange)) {
                includeRecord = false;
            }

            if (selectedGenders.length > 0 && !selectedGenders.includes(record.gender)) {
                includeRecord = false;
            }

            if (selectedCities.length > 0 && !selectedCities.includes(record.city)) {
                includeRecord = false;
            }

            if (selectedDateRange) {
                const recordDate = record.date;
                const { start, end } = selectedDateRange;
                if (recordDate < start || recordDate > end) {
                    includeRecord = false;
                }
            }

            if (includeRecord) {
                record.ailments.forEach((ailment) => {
                    if (selectedAilments.length === 0 || selectedAilments.includes(ailment.name)) {
                        ailment.symptoms.forEach(symptom => {
                            contextualSymptoms.add(symptom);
                        });
                    }
                });
            }
        });

        const resultSymptoms = Array.from(contextualSymptoms).sort();
        this._filterCache.set(cacheKey, resultSymptoms);

        return resultSymptoms;
    }

    getContextualAilments(selectedAges = [], selectedGenders = [], selectedCities = [], selectedSymptoms = [], selectedDateRange = null) {
        const cacheKey = `ailments_${selectedAges.join(',')}_${selectedGenders.join(',')}_${selectedCities.join(',')}_${selectedSymptoms.join(',')}_${selectedDateRange ? `${selectedDateRange.start.getTime()}-${selectedDateRange.end.getTime()}` : 'nodate'}`;

        if (this._filterCache.has(cacheKey)) {
            return this._filterCache.get(cacheKey);
        }

        if (selectedAges.length === 0 && selectedGenders.length === 0 &&
            selectedCities.length === 0 && selectedSymptoms.length === 0 && !selectedDateRange) {
            const allAilments = this.dataManager.getUniqueValues('ailment');
            return allAilments;
        }

        const contextualAilments = new Set();
        const allData = this.dataManager.getAllData();

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedAges.length > 0 && !selectedAges.includes(record.ageRange)) {
                includeRecord = false;
            }

            if (selectedGenders.length > 0 && !selectedGenders.includes(record.gender)) {
                includeRecord = false;
            }

            if (selectedCities.length > 0 && !selectedCities.includes(record.city)) {
                includeRecord = false;
            }

            if (selectedDateRange) {
                const recordDate = record.date;
                const { start, end } = selectedDateRange;
                if (recordDate < start || recordDate > end) {
                    includeRecord = false;
                }
            }

            if (includeRecord) {
                record.ailments.forEach((ailment) => {
                    if (selectedSymptoms.length === 0) {
                        contextualAilments.add(ailment.name);
                    } else {
                        const hasSelectedSymptom = selectedSymptoms.some(symptom =>
                            ailment.symptoms.includes(symptom)
                        );
                        if (hasSelectedSymptom) {
                            contextualAilments.add(ailment.name);
                        }
                    }
                });
            }
        });

        const resultAilments = Array.from(contextualAilments).sort();
        this._filterCache.set(cacheKey, resultAilments);

        return resultAilments;
    }

    getContextualCities(selectedAges = [], selectedGenders = [], selectedAilments = [], selectedSymptoms = [], selectedDateRange = null) {
        const cacheKey = `cities_${selectedAges.join(',')}_${selectedGenders.join(',')}_${selectedAilments.join(',')}_${selectedSymptoms.join(',')}_${selectedDateRange ? `${selectedDateRange.start.getTime()}-${selectedDateRange.end.getTime()}` : 'nodate'}`;

        if (this._filterCache.has(cacheKey)) {
            return this._filterCache.get(cacheKey);
        }

        if (selectedAges.length === 0 && selectedGenders.length === 0 &&
            selectedAilments.length === 0 && selectedSymptoms.length === 0 && !selectedDateRange) {
            return this.dataManager.getUniqueValues('city');
        }

        const contextualCities = new Set();
        const allData = this.dataManager.getAllData();

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedAges.length > 0 && !selectedAges.includes(record.ageRange)) {
                includeRecord = false;
            }

            if (selectedGenders.length > 0 && !selectedGenders.includes(record.gender)) {
                includeRecord = false;
            }

            if (selectedAilments.length > 0) {
                const hasSelectedAilment = record.ailments.some(ailment =>
                    selectedAilments.includes(ailment.name)
                );
                if (!hasSelectedAilment) includeRecord = false;
            }

            if (selectedSymptoms.length > 0) {
                const hasSelectedSymptom = record.ailments.some(ailment =>
                    selectedSymptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasSelectedSymptom) includeRecord = false;
            }

            if (selectedDateRange) {
                const recordDate = record.date;
                const { start, end } = selectedDateRange;
                if (recordDate < start || recordDate > end) {
                    includeRecord = false;
                }
            }

            if (includeRecord && record.city) {
                contextualCities.add(record.city);
            }
        });

        const resultCities = Array.from(contextualCities).sort();
        this._filterCache.set(cacheKey, resultCities);

        return resultCities;
    }

    getContextualDateRange(selectedAges = [], selectedGenders = [], selectedCities = [], selectedAilments = [], selectedSymptoms = []) {
        const allData = this.dataManager.getAllData();

        if (selectedAges.length === 0 && selectedGenders.length === 0 &&
            selectedCities.length === 0 && selectedAilments.length === 0 && selectedSymptoms.length === 0) {
            const allDates = allData.map(record => record.date).filter(Boolean);
            if (allDates.length === 0) return null;

            const minDate = new Date(Math.min(...allDates));
            const maxDate = new Date(Math.max(...allDates));
            return { minDate, maxDate };
        }

        const relevantDates = [];

        allData.forEach((record) => {
            let includeRecord = true;

            if (selectedAges.length > 0 && !selectedAges.includes(record.ageRange)) {
                includeRecord = false;
            }

            if (selectedGenders.length > 0 && !selectedGenders.includes(record.gender)) {
                includeRecord = false;
            }

            if (selectedCities.length > 0 && !selectedCities.includes(record.city)) {
                includeRecord = false;
            }

            if (selectedAilments.length > 0) {
                const hasSelectedAilment = record.ailments.some(ailment =>
                    selectedAilments.includes(ailment.name)
                );
                if (!hasSelectedAilment) includeRecord = false;
            }

            if (selectedSymptoms.length > 0) {
                const hasSelectedSymptom = record.ailments.some(ailment =>
                    selectedSymptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasSelectedSymptom) includeRecord = false;
            }

            if (includeRecord && record.date) {
                relevantDates.push(record.date);
            }
        });

        if (relevantDates.length === 0) return null;

        const minDate = new Date(Math.min(...relevantDates));
        const maxDate = new Date(Math.max(...relevantDates));

        return { minDate, maxDate };
    }

    getAllContextualOptions(excludeFilter = null) {
        const currentAges = excludeFilter === 'ages' ? [] : this.filters.ages;
        const currentGenders = excludeFilter === 'genders' ? [] : this.filters.genders;
        const currentCities = excludeFilter === 'cities' ? [] : this.filters.cities;
        const currentAilments = excludeFilter === 'ailments' ? [] : this.filters.ailments;
        const currentSymptoms = excludeFilter === 'symptoms' ? [] : this.filters.symptoms;
        const currentDateRange = excludeFilter === 'dateRange' ? null : this.filters.dateRange;

        const contextualOptions = {
            ages: this.getContextualAges(currentGenders, currentCities, currentAilments, currentSymptoms, currentDateRange),
            genders: this.getContextualGenders(currentAges, currentCities, currentAilments, currentSymptoms, currentDateRange),
            cities: this.getContextualCities(currentAges, currentGenders, currentAilments, currentSymptoms, currentDateRange),
            ailments: this.getContextualAilments(currentAges, currentGenders, currentCities, currentSymptoms, currentDateRange),
            symptoms: this.getContextualSymptoms(currentAges, currentGenders, currentCities, currentAilments, currentDateRange),
            dateRange: this.getContextualDateRange(currentAges, currentGenders, currentCities, currentAilments, currentSymptoms)
        };

        return contextualOptions;
    }

    getContextualOptionsFor(filterType, excludeCurrentSelection = true) {
        const currentAges = (excludeCurrentSelection && filterType === 'ages') ? [] : this.filters.ages;
        const currentGenders = (excludeCurrentSelection && filterType === 'genders') ? [] : this.filters.genders;
        const currentCities = (excludeCurrentSelection && filterType === 'cities') ? [] : this.filters.cities;
        const currentAilments = (excludeCurrentSelection && filterType === 'ailments') ? [] : this.filters.ailments;
        const currentSymptoms = (excludeCurrentSelection && filterType === 'symptoms') ? [] : this.filters.symptoms;
        const currentDateRange = (excludeCurrentSelection && filterType === 'dateRange') ? null : this.filters.dateRange;

        switch (filterType) {
            case 'ages':
                return this.getContextualAges(currentGenders, currentCities, currentAilments, currentSymptoms, currentDateRange);
            case 'genders':
                return this.getContextualGenders(currentAges, currentCities, currentAilments, currentSymptoms, currentDateRange);
            case 'cities':
                return this.getContextualCities(currentAges, currentGenders, currentAilments, currentSymptoms, currentDateRange);
            case 'ailments':
                return this.getContextualAilments(currentAges, currentGenders, currentCities, currentSymptoms, currentDateRange);
            case 'symptoms':
                return this.getContextualSymptoms(currentAges, currentGenders, currentCities, currentAilments, currentDateRange);
            case 'dateRange':
                return this.getContextualDateRange(currentAges, currentGenders, currentCities, currentAilments, currentSymptoms);
            default:
                return [];
        }
    }

    getStatistics() {
        const data = this.filteredData;

        const totalAssessments = data.length;

        const avgMatch = data.length > 0
            ? data.reduce((sum, record) => sum + record.maxMatchPercentage, 0) / data.length
            : 0;

        const ailmentCounts = {};
        data.forEach(record => {
            record.ailments.forEach(ailment => {
                ailmentCounts[ailment.name] = (ailmentCounts[ailment.name] || 0) + 1;
            });
        });
        const topAilment = Object.keys(ailmentCounts).length > 0
            ? Object.entries(ailmentCounts).sort((a, b) => b[1] - a[1])[0][0]
            : '-';

        const symptomCounts = {};
        data.forEach(record => {
            record.symptomsArray.forEach(symptom => {
                symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            });
        });
        const mostCommonSymptom = Object.keys(symptomCounts).length > 0
            ? Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0][0]
            : '-';

        const uniqueCities = new Set(data.map(record => record.city));
        const citiesCount = uniqueCities.size;

        return {
            totalAssessments,
            avgMatch: avgMatch.toFixed(1),
            topAilment,
            mostCommonSymptom,
            citiesCount
        };
    }

    getChartData() {
        const data = this.filteredData;

        const ageCounts = { '0-17': 0, '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
        data.forEach(record => {
            if (record.ageRange) ageCounts[record.ageRange]++;
        });

        const genderCounts = {};
        data.forEach(record => {
            if (record.gender) {
                genderCounts[record.gender] = (genderCounts[record.gender] || 0) + 1;
            }
        });

        const ailmentCounts = {};
        data.forEach(record => {
            record.ailments.forEach(ailment => {
                ailmentCounts[ailment.name] = (ailmentCounts[ailment.name] || 0) + 1;
            });
        });
        const topAilments = Object.entries(ailmentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const matchRanges = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
        data.forEach(record => {
            const match = record.maxMatchPercentage;
            if (match <= 20) matchRanges['0-20%']++;
            else if (match <= 40) matchRanges['21-40%']++;
            else if (match <= 60) matchRanges['41-60%']++;
            else if (match <= 80) matchRanges['61-80%']++;
            else matchRanges['81-100%']++;
        });

        const cityCounts = {};
        data.forEach((record) => {
            if (record.city) {
                cityCounts[record.city] = (cityCounts[record.city] || 0) + 1;
            }
        });
        
        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const ageAilmentData = {};
        const top5Ailments = topAilments.slice(0, 5).map(([name]) => name);

        Object.keys(ageCounts).forEach(ageRange => {
            ageAilmentData[ageRange] = {};
            top5Ailments.forEach(ailmentName => {
                ageAilmentData[ageRange][ailmentName] = 0;
            });
        });

        data.forEach(record => {
            if (record.ageRange) {
                record.ailments.forEach(ailment => {
                    if (top5Ailments.includes(ailment.name)) {
                        ageAilmentData[record.ageRange][ailment.name]++;
                    }
                });
            }
        });

        return {
            ageDistribution: ageCounts,
            genderDistribution: genderCounts,
            topAilments,
            matchDistribution: matchRanges,
            topCities,
            cityDistribution: cityCounts,
            ageAilmentData
        };
    }

    getFilterSummary() {
        const activeFilters = Object.entries(this.filters)
            .filter(([key, value]) => {
                if (key === 'dateRange') return value !== null;
                return Array.isArray(value) && value.length > 0;
            })
            .map(([key, value]) => ({
                type: key,
                count: key === 'dateRange' ? 1 : value.length,
                values: value
            }));

        return {
            activeFilterCount: activeFilters.length,
            activeFilters,
            totalRecords: this.dataManager.getAllData().length,
            filteredRecords: this.filteredData.length,
            filterPercentage: ((this.filteredData.length / this.dataManager.getAllData().length) * 100).toFixed(1)
        };
    }

    hasActiveFilters() {
        return this.filters.ages.length > 0 ||
            this.filters.genders.length > 0 ||
            this.filters.cities.length > 0 ||
            this.filters.ailments.length > 0 ||
            this.filters.symptoms.length > 0 ||
            this.filters.dateRange !== null;
    }

    getPreviewCount(filterType, filterValue) {
        const tempFilters = { ...this.filters };

        if (Array.isArray(tempFilters[filterType])) {
            tempFilters[filterType] = [...tempFilters[filterType], filterValue];
        } else if (filterType === 'dateRange') {
            tempFilters[filterType] = filterValue;
        }

        const allData = this.dataManager.getAllData();
        return allData.filter(record => {
            if (tempFilters.ages.length > 0 && !tempFilters.ages.includes(record.ageRange)) {
                return false;
            }
            if (tempFilters.genders.length > 0 && !tempFilters.genders.includes(record.gender)) {
                return false;
            }
            if (tempFilters.cities.length > 0 && !tempFilters.cities.includes(record.city)) {
                return false;
            }
            if (tempFilters.ailments.length > 0) {
                const hasAnyAilment = record.ailments.some(ailment =>
                    tempFilters.ailments.includes(ailment.name)
                );
                if (!hasAnyAilment) return false;
            }
            if (tempFilters.symptoms.length > 0) {
                const hasAnySymptom = record.ailments.some(ailment =>
                    tempFilters.symptoms.some(symptom => ailment.symptoms.includes(symptom))
                );
                if (!hasAnySymptom) return false;
            }
            if (tempFilters.dateRange) {
                const recordDate = record.date;
                const { start, end } = tempFilters.dateRange;
                if (recordDate < start || recordDate > end) {
                    return false;
                }
            }
            return true;
        }).length;
    }

    exportFilterState() {
        return {
            filters: { ...this.filters },
            filteredRecordCount: this.filteredData.length,
            totalRecordCount: this.dataManager.getAllData().length,
            filterSummary: this.getFilterSummary(),
            timestamp: new Date().toISOString()
        };
    }

    importFilterState(filterState) {
        if (filterState && filterState.filters) {
            this.filters = { ...filterState.filters };
            this._filterCache.clear();
            this.applyFilters();
            return true;
        }
        return false;
    }

    resetFilter(filterType) {
        if (this.filters.hasOwnProperty(filterType)) {
            if (filterType === 'dateRange') {
                this.filters[filterType] = null;
            } else {
                this.filters[filterType] = [];
            }
            this._filterCache.clear();
            this.applyFilters();
            return true;
        }
        return false;
    }

    getFilterStatistics() {
        const stats = {
            totalRecords: this.dataManager.getAllData().length,
            filteredRecords: this.filteredData.length,
            filterEfficiency: this.dataManager.getAllData().length > 0 ?
                (this.filteredData.length / this.dataManager.getAllData().length * 100).toFixed(1) : 0,
            activeFilterTypes: Object.keys(this.filters).filter(key => {
                if (key === 'dateRange') return this.filters[key] !== null;
                return Array.isArray(this.filters[key]) && this.filters[key].length > 0;
            }).length,
            cacheSize: this._filterCache.size
        };

        return stats;
    }
}