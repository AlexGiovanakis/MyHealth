export class MultiSelectManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.multiSelectStates = {
            age: { selected: [], isOpen: false },
            gender: { selected: [], isOpen: false },
            city: { selected: [], isOpen: false },
            ailment: { selected: [], isOpen: false },
            symptom: { selected: [], isOpen: false }
        };
        this.isUpdatingContextual = false;
        this.updateQueue = [];
        this.lastUpdateTime = 0;
        this.debounceTimer = null;
    }

    initializeMultiSelect(type, options = []) {
        const display = document.getElementById(`${type}Display`);
        const dropdown = document.getElementById(`${type}Dropdown`);
        const optionsContainer = document.getElementById(`${type}Options`);
        const selectAll = document.getElementById(`selectAll${type.charAt(0).toUpperCase() + type.slice(1)}s`);
        
        if (options.length > 0 && optionsContainer) {
            const optionsHTML = options.map(option => {
                const value = option;
                const label = this.getOptionLabel(type, option);
                return `
                    <div class="option-item">
                        <input type="checkbox" id="${type}_${value.replace(/\s+/g, '_')}" value="${value}">
                        <label for="${type}_${value.replace(/\s+/g, '_')}">${label}</label>
                    </div>
                `;
            }).join('');
            
            optionsContainer.innerHTML = optionsHTML;
        }
        
        if (display) {
            display.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(type);
            });
        }
        
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.handleSelectAll(type, e.target.checked);
            });
        }
        
        if (optionsContainer) {
            optionsContainer.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleOptionChange(type, e.target.value, e.target.checked);
                }
            });
        }
        
        const searchInput = document.getElementById(`${type}Search`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterOptions(type, e.target.value);
            });
        }
    }

    getOptionLabel(type, value) {
        const labels = {
            age: {
                '0-17': 'Κάτω από 18',
                '18-30': '18-30',
                '31-50': '31-50',
                '51-70': '51-70',
                '70+': '70+'
            },
            gender: {
                'Male': 'Αρσενικό',
                'Female': 'Θηλυκό',
                'Other': 'Άλλο'
            }
        };
        
        return labels[type]?.[value] || value;
    }

    toggleDropdown(type) {
        Object.keys(this.multiSelectStates).forEach(key => {
            if (key !== type) {
                this.closeDropdown(key);
            }
        });
        
        const dropdown = document.getElementById(`${type}Dropdown`);
        const display = document.getElementById(`${type}Display`);
        const arrow = display?.querySelector('.dropdown-arrow');
        
        if (this.multiSelectStates[type].isOpen) {
            this.closeDropdown(type);
        } else {
            dropdown?.classList.add('show');
            display?.classList.add('active');
            arrow?.classList.add('rotated');
            this.multiSelectStates[type].isOpen = true;
        }
    }

    closeDropdown(type) {
        const dropdown = document.getElementById(`${type}Dropdown`);
        const display = document.getElementById(`${type}Display`);
        const arrow = display?.querySelector('.dropdown-arrow');
        
        dropdown?.classList.remove('show');
        display?.classList.remove('active');
        arrow?.classList.remove('rotated');
        this.multiSelectStates[type].isOpen = false;
    }

    handleSelectAll(type, checked) {
        const container = document.getElementById(`${type}Options`);
        const checkboxes = container?.querySelectorAll('input[type="checkbox"]') || [];
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        if (checked) {
            this.multiSelectStates[type].selected = Array.from(checkboxes).map(cb => cb.value);
        } else {
            this.multiSelectStates[type].selected = [];
        }
        
        this.updateMultiSelectDisplay(type);
        this.applyFiltersDebounced();
    }

    handleOptionChange(type, value, checked) {
        if (checked) {
            if (!this.multiSelectStates[type].selected.includes(value)) {
                this.multiSelectStates[type].selected.push(value);
            }
        } else {
            this.multiSelectStates[type].selected = this.multiSelectStates[type].selected.filter(v => v !== value);
        }
        
        this.updateMultiSelectDisplay(type);
        this.updateSelectAllCheckbox(type);
        
        this.applyFiltersDebounced();
    }

    updateMultiSelectDisplay(type) {
        const display = document.getElementById(`${type}Display`);
        if (!display) return;
        
        const selected = this.multiSelectStates[type].selected;
        
        if (selected.length === 0) {
            display.innerHTML = `
                <span class="placeholder">Επιλέξτε ${this.getFilterLabel(type)}...</span>
                <span class="dropdown-arrow">▼</span>
            `;
        } else if (selected.length <= 3) {
            const items = selected.map(value => `
                <span class="selected-item">
                    ${this.getOptionLabel(type, value)}
                    <span class="remove-item" data-type="${type}" data-value="${value}">×</span>
                </span>
            `).join('');
            display.innerHTML = `
                <div class="selected-items">${items}</div>
                <span class="dropdown-arrow">▼</span>
            `;
        } else {
            display.innerHTML = `
                <div class="selected-items">
                    <span class="selected-item">${selected.length} επιλεγμένα</span>
                </div>
                <span class="dropdown-arrow">▼</span>
            `;
        }
        
        display.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnType = e.target.dataset.type;
                const value = e.target.dataset.value;
                this.removeSelectedItem(btnType, value);
            });
        });
    }

    removeSelectedItem(type, value) {
        const checkbox = document.querySelector(`#${type}Options input[value="${value}"]`);
        if (checkbox) checkbox.checked = false;
        
        this.handleOptionChange(type, value, false);
    }

    updateSelectAllCheckbox(type) {
        const selectAll = document.getElementById(`selectAll${type.charAt(0).toUpperCase() + type.slice(1)}s`);
        const container = document.getElementById(`${type}Options`);
        if (!container || !selectAll) return;
        
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const checkedCount = container.querySelectorAll('input[type="checkbox"]:checked').length;
        
        selectAll.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }

    filterOptions(type, searchTerm) {
        const container = document.getElementById(`${type}Options`);
        if (!container) return;
        
        const options = container.querySelectorAll('.option-item');
        
        options.forEach(option => {
            const label = option.querySelector('label')?.textContent?.toLowerCase() || '';
            if (label.includes(searchTerm.toLowerCase())) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }

    getFilterLabel(type) {
        const labels = {
            age: 'ηλικιακά εύρη',
            gender: 'φύλα',
            city: 'πόλεις',
            ailment: 'ασθένειες',
            symptom: 'συμπτώματα'
        };
        return labels[type] || type;
    }

    populateDynamicFilters() {
        const cities = this.dashboard.dataManager.getUniqueValues('city');
        this.initializeMultiSelect('city', cities);
        
        const ailments = this.dashboard.dataManager.getUniqueValues('ailment');
        this.initializeMultiSelect('ailment', ailments);
        
        const symptoms = this.dashboard.dataManager.getUniqueValues('symptoms');
        this.initializeMultiSelect('symptom', symptoms);
    }

    applyFiltersDebounced() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.applyFilters();
        }, 200);
    }

    applyFilters() {
        if (this.isUpdatingContextual) {
            return;
        }
        
        const selectedAges = this.multiSelectStates.age.selected;
        const selectedGenders = this.multiSelectStates.gender.selected;
        const selectedCities = this.multiSelectStates.city.selected;
        const selectedAilments = this.multiSelectStates.ailment.selected;
        const selectedSymptoms = this.multiSelectStates.symptom.selected;
        
        this.dashboard.filterManager.updateFilters('ages', selectedAges);
        this.dashboard.filterManager.updateFilters('genders', selectedGenders);
        this.dashboard.filterManager.updateFilters('cities', selectedCities);
        this.dashboard.filterManager.updateFilters('ailments', selectedAilments);
        this.dashboard.filterManager.updateFilters('symptoms', selectedSymptoms);
        
        this.updateAllContextualOptions();
        
        this.dashboard.updateUI();
    }

    updateAllContextualOptions() {
        if (this.isUpdatingContextual) {
        return;
    }
    
    if (!this.dashboard.contextualFilteringEnabled) {
        // Ensure we don't leave updates hanging
        this.isUpdatingContextual = false;
        return;
    }

        this.isUpdatingContextual = true;

        try {
            const selectedAges = this.multiSelectStates.age.selected;
            const selectedGenders = this.multiSelectStates.gender.selected;
            const selectedCities = this.multiSelectStates.city.selected;
            const selectedAilments = this.multiSelectStates.ailment.selected;
            const selectedSymptoms = this.multiSelectStates.symptom.selected;
            const selectedDateRange = this.dashboard.filterManager.filters.dateRange;
            
            const contextualAges = this.dashboard.filterManager.getContextualAges(
                selectedGenders, selectedCities, selectedAilments, selectedSymptoms, selectedDateRange
            );
            
            const contextualGenders = this.dashboard.filterManager.getContextualGenders(
                selectedAges, selectedCities, selectedAilments, selectedSymptoms, selectedDateRange
            );
            
            const contextualCities = this.dashboard.filterManager.getContextualCities(
                selectedAges, selectedGenders, selectedAilments, selectedSymptoms, selectedDateRange
            );
            
            const contextualAilments = this.dashboard.filterManager.getContextualAilments(
                selectedAges, selectedGenders, selectedCities, selectedSymptoms, selectedDateRange
            );
            
            const contextualSymptoms = this.dashboard.filterManager.getContextualSymptoms(
                selectedAges, selectedGenders, selectedCities, selectedAilments, selectedDateRange
            );
            
            this.updateDropdownOptionsQuiet('age', contextualAges);
            this.updateDropdownOptionsQuiet('gender', contextualGenders);
            this.updateDropdownOptionsQuiet('city', contextualCities);
            this.updateDropdownOptionsQuiet('ailment', contextualAilments);
            this.updateDropdownOptionsQuiet('symptom', contextualSymptoms);
            
            this.updateDatePickerRange(selectedAges, selectedGenders, selectedCities, selectedAilments, selectedSymptoms);
            
        } catch (error) {
            console.error('Error updating contextual options:', error);
        } finally {
            this.isUpdatingContextual = false;
        }
    }

    updateDropdownOptionsQuiet(type, newOptions) {
        const container = document.getElementById(`${type}Options`);
        if (!container) {
            return;
        }
        
        const validSelections = this.multiSelectStates[type].selected.filter(selection => 
            newOptions.includes(selection)
        );
        
        const removedSelections = this.multiSelectStates[type].selected.filter(selection => 
            !newOptions.includes(selection)
        );
        
        this.multiSelectStates[type].selected = validSelections;
        
        const optionsFragment = document.createDocumentFragment();
        newOptions.forEach(option => {
            const value = option;
            const label = this.getOptionLabel(type, option);
            const isSelected = validSelections.includes(value);
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.style.display = 'flex';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${type}_${value.replace(/\s+/g, '_')}`;
            checkbox.value = value;
            checkbox.checked = isSelected;
            
            const labelElement = document.createElement('label');
            labelElement.setAttribute('for', checkbox.id);
            labelElement.textContent = label;
            
            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(labelElement);
            optionsFragment.appendChild(optionDiv);
        });
        
        container.innerHTML = '';
        container.appendChild(optionsFragment);
        
        this.updateMultiSelectDisplay(type);
        this.updateSelectAllCheckbox(type);
        
        if (removedSelections.length > 0) {
            const filterKey = type === 'age' ? 'ages' : 
                           type === 'gender' ? 'genders' :
                           type === 'city' ? 'cities' :
                           type === 'ailment' ? 'ailments' :
                           type === 'symptom' ? 'symptoms' : type;
            
            this.dashboard.filterManager.updateFilters(filterKey, validSelections);
        }
    }

    updateDatePickerRange(selectedAges, selectedGenders, selectedCities, selectedAilments, selectedSymptoms) {
        if (this.dashboard.datePickerManager && this.dashboard.datePickerManager.updateRangeBasedOnAllFilters) {
            this.dashboard.datePickerManager.updateRangeBasedOnAllFilters(
                selectedAges, selectedGenders, selectedCities, selectedAilments, selectedSymptoms
            );
        }
    }

    clearFilter(type) {
        const previousSelection = [...this.multiSelectStates[type].selected];
        
        this.multiSelectStates[type].selected = [];
        
        const container = document.getElementById(`${type}Options`);
        if (container) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        }
        
        this.updateMultiSelectDisplay(type);
        this.updateSelectAllCheckbox(type);
        
        this.applyFiltersDebounced();
        
        return previousSelection;
    }

    resetAllContextualFilters() {
        this.isUpdatingContextual = true;
        
        try {
            const previousState = {};
            Object.keys(this.multiSelectStates).forEach(type => {
                previousState[type] = [...this.multiSelectStates[type].selected];
            });
            
            Object.keys(this.multiSelectStates).forEach(type => {
                this.multiSelectStates[type].selected = [];
                
                const container = document.getElementById(`${type}Options`);
                if (container) {
                    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(checkbox => checkbox.checked = false);
                }
                
                this.updateMultiSelectDisplay(type);
                this.updateSelectAllCheckbox(type);
            });
            
            this.dashboard.filterManager.clearAllFilters();
            
        } finally {
            this.isUpdatingContextual = false;
        }
        
        setTimeout(() => {
            const allAges = ['0-17', '18-30', '31-50', '51-70', '70+'];
            const allGenders = ['Male', 'Female', 'Other'];
            const allCities = this.dashboard.dataManager.getUniqueValues('city');
            const allAilments = this.dashboard.dataManager.getUniqueValues('ailment');
            const allSymptoms = this.dashboard.dataManager.getUniqueValues('symptoms');
            
            this.updateDropdownOptionsQuiet('age', allAges);
            this.updateDropdownOptionsQuiet('gender', allGenders);
            this.updateDropdownOptionsQuiet('city', allCities);
            this.updateDropdownOptionsQuiet('ailment', allAilments);
            this.updateDropdownOptionsQuiet('symptom', allSymptoms);
            
            if (this.dashboard.datePickerManager) {
                this.dashboard.datePickerManager.resetToFullRange();
            }
            
            this.dashboard.updateUI();
        }, 100);
    }

    batchUpdateFilters(updates) {
        this.isUpdatingContextual = true;
        
        try {
            Object.entries(updates).forEach(([type, values]) => {
                if (this.multiSelectStates[type]) {
                    this.multiSelectStates[type].selected = values;
                    
                    const container = document.getElementById(`${type}Options`);
                    if (container) {
                        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = values.includes(checkbox.value);
                        });
                    }
                    
                    this.updateMultiSelectDisplay(type);
                    this.updateSelectAllCheckbox(type);
                }
            });
        } finally {
            this.isUpdatingContextual = false;
        }
        
        this.applyFilters();
    }

    getStateSummary() {
        return {
            selections: Object.fromEntries(
                Object.entries(this.multiSelectStates).map(([key, state]) => [key, state.selected])
            ),
            totalSelected: Object.values(this.multiSelectStates).reduce((total, state) => 
                total + state.selected.length, 0),
            isUpdating: this.isUpdatingContextual,
            contextualEnabled: this.dashboard.contextualFilteringEnabled,
            openDropdowns: Object.entries(this.multiSelectStates)
                .filter(([, state]) => state.isOpen)
                .map(([key]) => key)
        };
    }

    exportState() {
        return {
            multiSelectStates: JSON.parse(JSON.stringify(this.multiSelectStates)),
            contextualEnabled: this.dashboard.contextualFilteringEnabled,
            timestamp: new Date().toISOString()
        };
    }

    importState(state) {
        if (state && state.multiSelectStates) {
            this.multiSelectStates = state.multiSelectStates;
            
            Object.keys(this.multiSelectStates).forEach(type => {
                const container = document.getElementById(`${type}Options`);
                if (container) {
                    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = this.multiSelectStates[type].selected.includes(checkbox.value);
                    });
                }
                
                this.updateMultiSelectDisplay(type);
                this.updateSelectAllCheckbox(type);
            });
            
            this.applyFilters();
            return true;
        }
        return false;
    }

    closeAllDropdowns() {
        Object.keys(this.multiSelectStates).forEach(type => {
            this.closeDropdown(type);
        });
    }

    initializeStaticMultiSelects() {
        this.initializeMultiSelect('age', ['0-17', '18-30', '31-50', '51-70', '70+']);
        this.initializeMultiSelect('gender', ['Male', 'Female', 'Other']);
    }

    getPerformanceMetrics() {
        return {
            lastUpdateTime: this.lastUpdateTime,
            updateQueueLength: this.updateQueue.length,
            totalSelections: Object.values(this.multiSelectStates).reduce((total, state) => 
                total + state.selected.length, 0),
            isUpdating: this.isUpdatingContextual,
            hasDebounceTimer: !!this.debounceTimer
        };
    }

    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        this.isUpdatingContextual = false;
        this.updateQueue = [];
        
        this.closeAllDropdowns();
    }
}