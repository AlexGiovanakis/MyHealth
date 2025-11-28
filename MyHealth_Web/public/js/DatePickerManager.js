export class DatePickerManager {
    constructor(filterManager, onDateChange) {
        this.filterManager = filterManager;
        this.onDateChange = onDateChange;
        this.flatpickrInstance = null;
        this.originalMinDate = null;
        this.originalMaxDate = null;
        this.currentContextualRange = null;
        this.lastContextualFilters = null;
        this.isUpdating = false;
        this.updateQueue = [];
    }

    initialize() {
        this.setupBasicDatePicker();
    }

    setupBasicDatePicker() {
        const dateFilterElement = document.getElementById('dateFilter');
        if (!dateFilterElement) {
            return;
        }

        this.flatpickrInstance = flatpickr("#dateFilter", {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "gr",
            defaultDate: null,
            allowInput: false,
            appendTo: document.body,
            position: "auto",
            placeholder: "Επιλέξτε εύρος ημερομηνιών...",
            onChange: (selectedDates) => {
                this.handleDateChange(selectedDates);
            },
            onReady: (selectedDates, dateStr, instance) => {
                this.addCustomButtons(instance);
            }
        });
    }

    handleDateChange(selectedDates) {
        if (this.isUpdating) {
            return;
        }

        if (selectedDates.length === 2) {
            const dateRange = {
                start: selectedDates[0],
                end: selectedDates[1]
            };
            
            this.filterManager.updateFilters('dateRange', dateRange);
            
            if (this.onDateChange) {
                this.onDateChange();
            }
        } else if (selectedDates.length === 0) {
            this.filterManager.updateFilters('dateRange', null);
            
            if (this.onDateChange) {
                this.onDateChange();
            }
        }
    }

    addCustomButtons(instance) {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Καθαρισμός';
        clearBtn.className = 'flatpickr-clear-btn';
        clearBtn.style.cssText = 'margin: 5px; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;';
        clearBtn.onclick = () => {
            this.clearDateFilter();
        };
        
        instance.calendarContainer.appendChild(clearBtn);

        if (this.currentContextualRange && this.currentContextualRange.filterContext) {
            this.addContextualInfoButton(instance);
        }
    }

    addContextualInfoButton(instance) {
        const infoBtn = document.createElement('button');
        infoBtn.innerHTML = 'ℹ️ Φίλτρα';
        infoBtn.className = 'flatpickr-info-btn';
        infoBtn.style.cssText = 'margin: 5px; padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;';
        infoBtn.onclick = () => {
            this.showContextualInfo();
        };
        
        instance.calendarContainer.appendChild(infoBtn);
    }

    getAvailableDates() {
        const dates = this.filterManager.dataManager.getAllData().map(record => {
            return record.dateStr;
        }).filter(Boolean);
        
        const uniqueAndSorted = [...new Set(dates)].sort();
        
        return uniqueAndSorted;
    }

    toDateObj(dateString) {
        if (!dateString) return new Date();
        
        const [day, month, year] = dateString.split('/');
        const dateObj = new Date(year, month - 1, day);
        return dateObj;
    }

    setupCalendarWithLimits() {
        const availableDates = this.getAvailableDates();
        
        if (availableDates.length === 0) {
            return;
        }

        const earliestDate = availableDates
            .map(dateStr => this.toDateObj(dateStr))
            .reduce((min, date) => date < min ? date : min, new Date());

        const today = new Date();

        this.originalMinDate = earliestDate;
        this.originalMaxDate = today;

        const minDateStr = this.formatDateForFlatpickr(earliestDate);
        const maxDateStr = this.formatDateForFlatpickr(today);

        this.createFlatpickrInstance(minDateStr, maxDateStr, 'initial-setup');
    }

    formatDateForFlatpickr(date) {
        return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    }

    updateRangeBasedOnContext(contextMinDate, contextMaxDate, filterContext = null) {
        if (filterContext) {
            this.lastContextualFilters = filterContext;
        }

        this.currentContextualRange = { 
            min: contextMinDate, 
            max: contextMaxDate,
            filterContext: filterContext 
        };

        const effectiveMinDate = contextMinDate < this.originalMinDate ? this.originalMinDate : contextMinDate;
        const effectiveMaxDate = contextMaxDate > this.originalMaxDate ? this.originalMaxDate : contextMaxDate;

        const currentSelectedDates = this.getSelectedDates();
        let needsSelectionUpdate = false;

        if (currentSelectedDates.length > 0) {
            const isStartValid = currentSelectedDates[0] >= effectiveMinDate && currentSelectedDates[0] <= effectiveMaxDate;
            const isEndValid = currentSelectedDates.length > 1 && 
                               currentSelectedDates[1] >= effectiveMinDate && 
                               currentSelectedDates[1] <= effectiveMaxDate;

            if (!isStartValid || (currentSelectedDates.length > 1 && !isEndValid)) {
                needsSelectionUpdate = true;
            }
        }

        const minDateStr = this.formatDateForFlatpickr(effectiveMinDate);
        const maxDateStr = this.formatDateForFlatpickr(effectiveMaxDate);

        this.createFlatpickrInstance(minDateStr, maxDateStr, 'context-update');

        if (needsSelectionUpdate) {
            this.clearDateSelection();
        }
    }

    updateRangeBasedOnAllFilters(selectedAges = [], selectedGenders = [], selectedCities = [], selectedAilments = [], selectedSymptoms = []) {
        if (this.isUpdating) {
            this.updateQueue.push({ selectedAges, selectedGenders, selectedCities, selectedAilments, selectedSymptoms });
            return;
        }

        this.isUpdating = true;

        try {
            const dateRange = this.filterManager.getContextualDateRange(
                selectedAges, selectedGenders, selectedCities, selectedAilments, selectedSymptoms
            );

            if (dateRange) {
                const filterContext = {
                    ages: selectedAges,
                    genders: selectedGenders,
                    cities: selectedCities,
                    ailments: selectedAilments,
                    symptoms: selectedSymptoms,
                    timestamp: new Date().toISOString()
                };

                this.updateRangeBasedOnContext(dateRange.minDate, dateRange.maxDate, filterContext);
            } else {
                this.resetToFullRange();
            }
        } finally {
            this.isUpdating = false;
            
            if (this.updateQueue.length > 0) {
                const nextUpdate = this.updateQueue.shift();
                setTimeout(() => {
                    this.updateRangeBasedOnAllFilters(
                        nextUpdate.selectedAges, nextUpdate.selectedGenders, 
                        nextUpdate.selectedCities, nextUpdate.selectedAilments, 
                        nextUpdate.selectedSymptoms
                    );
                }, 50);
            }
        }
    }

    resetToFullRange() {
        if (!this.originalMinDate || !this.originalMaxDate) {
            this.setupCalendarWithLimits();
            return;
        }

        this.currentContextualRange = null;
        this.lastContextualFilters = null;

        const minDateStr = this.formatDateForFlatpickr(this.originalMinDate);
        const maxDateStr = this.formatDateForFlatpickr(this.originalMaxDate);

        this.createFlatpickrInstance(minDateStr, maxDateStr, 'full-reset');
    }

    createFlatpickrInstance(minDateStr, maxDateStr, reason = 'unknown') {
        const currentSelection = this.flatpickrInstance ? this.flatpickrInstance.selectedDates : [];

       if (this.flatpickrInstance) {
        // Clean up custom buttons and their event listeners
        const customButtons = this.flatpickrInstance.calendarContainer?.querySelectorAll('.flatpickr-clear-btn, .flatpickr-info-btn');
        customButtons?.forEach(btn => {
            btn.onclick = null; // Remove event listeners
        });
        
        this.flatpickrInstance.destroy();
    }

        this.flatpickrInstance = flatpickr("#dateFilter", {
            dateFormat: "d/m/Y",
            allowInput: false,
            locale: "gr",
            minDate: minDateStr,
            maxDate: maxDateStr,
            mode: "range",
            appendTo: document.body,
            position: "auto",
            placeholder: "Επιλέξτε εύρος ημερομηνιών...",
            onChange: (selectedDates, dateStr, instance) => {
                this.handleDateChange(selectedDates);
            },
            onReady: (selectedDates, dateStr, instance) => {
                this.addCustomButtons(instance);

                if (currentSelection.length > 0 && reason !== 'full-reset') {
                    const validSelection = this.filterValidSelection(currentSelection, minDateStr, maxDateStr);
                    
                    if (validSelection.length === currentSelection.length) {
                        setTimeout(() => {
                            instance.setDate(validSelection);
                        }, 10);
                    }
                }
            },
            onOpen: () => {},
            onClose: () => {}
        });
    }

    filterValidSelection(selection, minDateStr, maxDateStr) {
        const minDate = this.parseDate(minDateStr);
        const maxDate = this.parseDate(maxDateStr);
        
        return selection.filter(date => date >= minDate && date <= maxDate);
    }

    parseDate(dateStr) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }

    showContextualInfo() {
        if (!this.currentContextualRange || !this.currentContextualRange.filterContext) {
            alert('Δεν υπάρχουν πληροφορίες φιλτραρίσματος διαθέσιμες.');
            return;
        }

        const context = this.currentContextualRange.filterContext;
        let infoText = 'Το εύρος ημερομηνιών φιλτράρεται βάσει των παρακάτω επιλογών:\n\n';

        const filters = [];

        if (context.ages && context.ages.length > 0) {
            const ageLabels = context.ages.map(age => {
                const labels = { '0-17': 'Κάτω από 18', '18-30': '18-30', '31-50': '31-50', '51-70': '51-70', '70+': '70+' };
                return labels[age] || age;
            });
            filters.push(`• Ηλικίες: ${ageLabels.join(', ')}`);
        }

        if (context.genders && context.genders.length > 0) {
            const genderLabels = context.genders.map(gender => {
                const labels = { 'Male': 'Αρσενικό', 'Female': 'Θηλυκό', 'Other': 'Άλλο' };
                return labels[gender] || gender;
            });
            filters.push(`• Φύλα: ${genderLabels.join(', ')}`);
        }

        if (context.cities && context.cities.length > 0) {
            const cityDisplay = context.cities.length > 3 
                ? `${context.cities.slice(0, 3).join(', ')} και ${context.cities.length - 3} ακόμη`
                : context.cities.join(', ');
            filters.push(`• Πόλεις: ${cityDisplay}`);
        }

        if (context.ailments && context.ailments.length > 0) {
            const ailmentDisplay = context.ailments.length > 3 
                ? `${context.ailments.slice(0, 3).join(', ')} και ${context.ailments.length - 3} ακόμη`
                : context.ailments.join(', ');
            filters.push(`• Ασθένειες: ${ailmentDisplay}`);
        }

        if (context.symptoms && context.symptoms.length > 0) {
            const symptomDisplay = context.symptoms.length > 3 
                ? `${context.symptoms.slice(0, 3).join(', ')} και ${context.symptoms.length - 3} ακόμη`
                : context.symptoms.join(', ');
            filters.push(`• Συμπτώματα: ${symptomDisplay}`);
        }

        if (filters.length > 0) {
            infoText += filters.join('\n');
            infoText += '\n\nΕμφανίζονται μόνο οι ημερομηνίες που ταιριάζουν στα επιλεγμένα φίλτρα.';
        } else {
            infoText = 'Δεν υπάρχουν ενεργά φίλτρα που να επηρεάζουν το εύρος ημερομηνιών.';
        }

        const stats = this.getDateRangeStats();
        if (stats.isReduced) {
            infoText += `\n\nΣτατιστικά:\n• Αρχικό εύρος: ${stats.originalDays} ημέρες\n• Φιλτραρισμένο εύρος: ${stats.contextualDays} ημέρες\n• Μείωση: ${stats.reductionPercentage}%`;
        }

        alert(infoText);
    }

    clearDateFilter() {
        if (this.flatpickrInstance) {
            this.flatpickrInstance.clear();
            this.filterManager.updateFilters('dateRange', null);
            
            if (this.onDateChange) {
                this.onDateChange();
            }
        }
    }

    clearDateSelection() {
        if (this.flatpickrInstance) {
            this.isUpdating = true;
            this.flatpickrInstance.clear();
            this.filterManager.updateFilters('dateRange', null);
            this.isUpdating = false;
            
            if (this.onDateChange) {
                this.onDateChange();
            }
        }
    }

    setDateRange(startDate, endDate) {
        if (this.flatpickrInstance) {
            this.flatpickrInstance.setDate([startDate, endDate]);
        }
    }

    getSelectedDates() {
        if (this.flatpickrInstance) {
            return this.flatpickrInstance.selectedDates;
        }
        return [];
    }

    getContextualRangeInfo() {
        return {
            originalRange: {
                min: this.originalMinDate,
                max: this.originalMaxDate
            },
            currentContextualRange: this.currentContextualRange,
            lastContextualFilters: this.lastContextualFilters,
            isContextual: this.currentContextualRange !== null,
            hasFilterContext: this.currentContextualRange && this.currentContextualRange.filterContext !== null,
            stats: this.getDateRangeStats(),
            isUpdating: this.isUpdating,
            queueLength: this.updateQueue.length
        };
    }

    isRangeAffectedByFilter(filterType, filterValue) {
        if (!this.currentContextualRange || !this.currentContextualRange.filterContext) {
            return false;
        }

        const context = this.currentContextualRange.filterContext;
        
        switch (filterType) {
            case 'age':
                return context.ages && context.ages.includes(filterValue);
            case 'gender':
                return context.genders && context.genders.includes(filterValue);
            case 'city':
                return context.cities && context.cities.includes(filterValue);
            case 'ailment':
                return context.ailments && context.ailments.includes(filterValue);
            case 'symptom':
                return context.symptoms && context.symptoms.includes(filterValue);
            default:
                return false;
        }
    }

    getDateRangeStats() {
        const originalDays = this.originalMaxDate && this.originalMinDate 
            ? Math.ceil((this.originalMaxDate - this.originalMinDate) / (1000 * 60 * 60 * 24)) 
            : 0;

        const contextualDays = this.currentContextualRange 
            ? Math.ceil((this.currentContextualRange.max - this.currentContextualRange.min) / (1000 * 60 * 60 * 24))
            : originalDays;

        const reductionPercentage = originalDays > 0 
            ? ((originalDays - contextualDays) / originalDays * 100).toFixed(1)
            : 0;

        return {
            originalDays,
            contextualDays,
            reductionPercentage: parseFloat(reductionPercentage),
            isReduced: contextualDays < originalDays,
            efficiency: originalDays > 0 ? (contextualDays / originalDays * 100).toFixed(1) : 100
        };
    }

    isDateInCurrentRange(date) {
        if (!this.flatpickrInstance) return false;
        
        const minDate = this.currentContextualRange ? this.currentContextualRange.min : this.originalMinDate;
        const maxDate = this.currentContextualRange ? this.currentContextualRange.max : this.originalMaxDate;
        
        return date >= minDate && date <= maxDate;
    }

    refreshWithCurrentContext() {
        if (this.currentContextualRange) {
            this.updateRangeBasedOnContext(
                this.currentContextualRange.min, 
                this.currentContextualRange.max, 
                this.currentContextualRange.filterContext
            );
        } else {
            this.resetToFullRange();
        }
    }

    getAvailableDatesInContext() {
        if (!this.currentContextualRange) {
            return this.getAvailableDates();
        }

        const allDates = this.getAvailableDates();
        const minDate = this.currentContextualRange.min;
        const maxDate = this.currentContextualRange.max;

        return allDates.filter(dateStr => {
            const date = this.toDateObj(dateStr);
            return date >= minDate && date <= maxDate;
        });
    }

    destroy() {
        if (this.flatpickrInstance) {
            this.flatpickrInstance.destroy();
            this.flatpickrInstance = null;
        }
        
        this.currentContextualRange = null;
        this.lastContextualFilters = null;
        this.updateQueue = [];
        this.isUpdating = false;
    }

    isInitialized() {
        return this.flatpickrInstance !== null;
    }

    exportState() {
        return {
            originalRange: {
                min: this.originalMinDate,
                max: this.originalMaxDate
            },
            currentContextualRange: this.currentContextualRange,
            selectedDates: this.getSelectedDates().map(d => d.toISOString()),
            isContextual: this.currentContextualRange !== null,
            stats: this.getDateRangeStats(),
            isUpdating: this.isUpdating,
            queueLength: this.updateQueue.length,
            timestamp: new Date().toISOString()
        };
    }

    importState(state) {
        if (!state) return false;

        try {
            if (state.originalRange) {
                this.originalMinDate = state.originalRange.min ? new Date(state.originalRange.min) : null;
                this.originalMaxDate = state.originalRange.max ? new Date(state.originalRange.max) : null;
            }

            if (state.currentContextualRange) {
                this.currentContextualRange = {
                    min: new Date(state.currentContextualRange.min),
                    max: new Date(state.currentContextualRange.max),
                    filterContext: state.currentContextualRange.filterContext
                };
            }

            if (state.selectedDates && state.selectedDates.length > 0) {
                const dates = state.selectedDates.map(d => new Date(d));
                this.setDateRange(dates[0], dates[1] || dates[0]);
            }

            return true;
        } catch (error) {
            console.error('Error importing date picker state:', error);
            return false;
        }
    }

    getPerformanceMetrics() {
        return {
            isUpdating: this.isUpdating,
            queueLength: this.updateQueue.length,
            hasContextualRange: !!this.currentContextualRange,
            rangeReduction: this.getDateRangeStats().reductionPercentage,
            isInitialized: this.isInitialized(),
            selectedDatesCount: this.getSelectedDates().length
        };
    }
}