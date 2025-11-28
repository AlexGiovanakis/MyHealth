export class ChartManager {
    constructor(filterManager) {
        this.filterManager = filterManager;
        this.charts = {
            age: null,
            gender: null,
            ailments: null,
            match: null,
            city: null,
            ageAilment: null,
            symptoms: null
        };
    }

    updateAllCharts() {
        const chartData = this.filterManager.getChartData();

        this.updateChart('age', 'ageChart', {
            type: 'doughnut',
            data: {
                labels: Object.keys(chartData.ageDistribution),
                datasets: [{
                    data: Object.values(chartData.ageDistribution),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        this.updateChart('gender', 'genderChart', {
            type: 'pie',
            data: {
                labels: Object.keys(chartData.genderDistribution).map(gender => {
                    const genderLabels = { 'Male': 'Αρσενικό', 'Female': 'Θηλυκό', 'Other': 'Άλλο' };
                    return genderLabels[gender] || gender;
                }),
                datasets: [{
                    data: Object.values(chartData.genderDistribution),
                    backgroundColor: ['#667eea', '#764ba2', '#f093fb']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        this.updateFilteredAilmentsChart();

        this.updateChart('match', 'matchChart', {
            type: 'bar',
            data: {
                labels: Object.keys(chartData.matchDistribution),
                datasets: [{
                    label: 'Αριθμός Αξιολογήσεων',
                    data: Object.values(chartData.matchDistribution),
                    backgroundColor: '#764ba2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        const selectedCities = this.filterManager.filters.cities;
        let cityChartData;

        if (selectedCities.length > 0) {
            cityChartData = selectedCities.map(city => {
                const count = chartData.cityDistribution[city] || 0;
                return [city, count];
            }).filter(([, count]) => count > 0);
        } else {
            cityChartData = chartData.topCities;
        }

        this.updateChart('city', 'cityChart', {
            type: 'bar',
            data: {
                labels: cityChartData.map(([city]) => city),
                datasets: [{
                    label: 'Αριθμός Αξιολογήσεων',
                    data: cityChartData.map(([, count]) => count),
                    backgroundColor: '#f093fb',
                    borderColor: '#e077e0',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                categoryPercentage: 0.8,
                barPercentage: 0.6,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#f093fb',
                        borderWidth: 2,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(tooltipItems) {
                                return `🌍 ${tooltipItems[0].label}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return `Αξιολογήσεις: ${value} περιπτώσεις`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        display: true,
                        title: {
                            display: true,
                            text: 'Πόλεις',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Αριθμός Αξιολογήσεων',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            stepSize: 1,
                            font: { size: 11 },
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1
                        }
                    }
                },
                onClick: (event, activeElements, chart) => {
                    if (activeElements.length > 0) {
                        const element = activeElements[0];
                        const city = chart.data.labels[element.index];
                        const count = chart.data.datasets[0].data[element.index];
                        
                        const filters = this.filterManager.filters;
                        const activeFilters = [];
                        
                        if (filters.ages.length > 0) activeFilters.push(`Ηλικίες: ${filters.ages.join(', ')}`);
                        if (filters.genders.length > 0) activeFilters.push(`Φύλα: ${filters.genders.join(', ')}`);
                        if (filters.ailments.length > 0) activeFilters.push(`Ασθένειες: ${filters.ailments.slice(0, 3).join(', ')}${filters.ailments.length > 3 ? '...' : ''}`);
                        if (filters.symptoms.length > 0) activeFilters.push(`Συμπτώματα: ${filters.symptoms.slice(0, 3).join(', ')}${filters.symptoms.length > 3 ? '...' : ''}`);
                        if (filters.dateRange) {
                            const start = filters.dateRange.start.toLocaleDateString('el-GR');
                            const end = filters.dateRange.end.toLocaleDateString('el-GR');
                            activeFilters.push(`Περίοδος: ${start} - ${end}`);
                        }
                        
                        const filtersText = activeFilters.length > 0 ? 
                            `\n\nΕνεργά φίλτρα:\n${activeFilters.join('\n')}` : 
                            '\n\nΦίλτρα: Κανένα (όλα τα δεδομένα)';

                        alert(`🌍 Λεπτομέρειες Πόλης\n\nΠόλη: ${city}\nΑξιολογήσεις: ${count}${filtersText}`);
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                },
                layout: {
                    padding: {
                        top: 10,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                }
            }
        });

        const ageRanges = Object.keys(chartData.ageAilmentData);
        const allAilments = new Set();
        ageRanges.forEach(age => {
            Object.keys(chartData.ageAilmentData[age]).forEach(ailment => allAilments.add(ailment));
        });

        const datasets = Array.from(allAilments).slice(0, 5).map((ailment, index) => ({
            label: ailment,
            data: ageRanges.map(age => chartData.ageAilmentData[age][ailment] || 0),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index]
        }));

        this.updateChart('ageAilment', 'ageAilmentChart', {
            type: 'bar',
            data: {
                labels: ageRanges.map(range => {
                    const rangeLabels = {
                        '0-17': 'Κάτω από 18',
                        '18-30': '18-30',
                        '31-50': '31-50',
                        '51-70': '51-70',
                        '70+': '70+'
                    };
                    return rangeLabels[range] || range;
                }),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { 
                        stacked: true, 
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        this.updateFilteredSymptomsChart();
    }

    updateFilteredAilmentsChart() {
        const ailmentsData = this.getFilteredAilmentsData();

        if (!ailmentsData || ailmentsData.isEmpty) {
            this.showEmptyChart('ailmentsChart', ailmentsData?.message || 'Δεν υπάρχουν δεδομένα ασθενειών για τα επιλεγμένα φίλτρα');
            return;
        }

        this.updateChart('ailments', 'ailmentsChart', {
            type: 'bar',
            data: {
                labels: ailmentsData.labels,
                datasets: [{
                    label: 'Συχνότητα Ασθενειών',
                    data: ailmentsData.values,
                    backgroundColor: '#667eea',
                    borderColor: '#5a6fd8',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: this.getFilteredChartOptions('Κορυφαίες Ασθένειες (Φιλτραρισμένες)', 'ailments')
        });

        this.updateChartInfo('ailmentsChartInfo', ailmentsData, 'ασθένειες');
    }

    updateFilteredSymptomsChart() {
        const symptomsData = this.getFilteredSymptomsData();

        if (!symptomsData || symptomsData.isEmpty) {
            this.showEmptyChart('symptomsChart', symptomsData?.message || 'Δεν υπάρχουν δεδομένα συμπτωμάτων για τα επιλεγμένα φίλτρα');
            return;
        }

        this.updateChart('symptoms', 'symptomsChart', {
            type: 'bar',
            data: {
                labels: symptomsData.labels,
                datasets: [{
                    label: 'Συχνότητα Συμπτωμάτων',
                    data: symptomsData.values,
                    backgroundColor: '#4BC0C0',
                    borderColor: '#3aa6a6',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: this.getFilteredChartOptions('Κορυφαία Συμπτώματα (Φιλτραρισμένα)', 'symptoms')
        });

        this.updateChartInfo('symptomsChartInfo', symptomsData, 'συμπτώματα');
    }

    getFilteredChartOptions(title, chartType) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            categoryPercentage: 0.8,
            barPercentage: 0.6,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartType === 'ailments' ? '#667eea' : '#4BC0C0',
                    borderWidth: 2,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `📊 ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const type = chartType === 'ailments' ? 'ασθένεια' : 'σύμπτωμα';
                            return `Συχνότητα: ${value} περιπτώσεις ${type}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: chartType === 'ailments' ? 'Ασθένειες' : 'Συμπτώματα',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Συχνότητα Εμφάνισης',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    }
                }
            },
            onClick: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const element = activeElements[0];
                    const item = chart.data.labels[element.index];
                    const frequency = chart.data.datasets[0].data[element.index];
                    
                    this.handleFilteredChartClick(item, frequency, chartType);
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            }
        };
    }

    getFilteredAilmentsData() {
        const selectedAilments = this.filterManager.filters.ailments;
        const filteredData = this.filterManager.getFilteredData();

        if (filteredData.length === 0) {
            return { isEmpty: true, message: 'Δεν υπάρχουν δεδομένα για τα επιλεγμένα κριτήρια' };
        }

        let ailmentCounts = {};
        let mode = 'discovery';

        if (selectedAilments.length > 0) {
            mode = 'selected';
            
            selectedAilments.forEach(ailmentName => {
                ailmentCounts[ailmentName] = 0;
            });

            filteredData.forEach(record => {
                record.ailments.forEach(ailment => {
                    if (selectedAilments.includes(ailment.name)) {
                        ailmentCounts[ailment.name]++;
                    }
                });
            });

            const ailmentsWithData = Object.entries(ailmentCounts)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1]);

            if (ailmentsWithData.length === 0) {
                return { 
                    isEmpty: true, 
                    message: 'Οι επιλεγμένες ασθένειες δεν βρέθηκαν στα φιλτραρισμένα δεδομένα' 
                };
            }
        } else {
            mode = 'discovery';

            filteredData.forEach(record => {
                record.ailments.forEach(ailment => {
                    ailmentCounts[ailment.name] = (ailmentCounts[ailment.name] || 0) + 1;
                });
            });

            const sortedAilments = Object.entries(ailmentCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15);

            if (sortedAilments.length === 0) {
                return { isEmpty: true, message: 'Δεν βρέθηκαν ασθένειες στα επιλεγμένα δεδομένα' };
            }
        }

        const sortedAilments = Object.entries(ailmentCounts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        const result = {
            labels: sortedAilments.map(([ailment]) => ailment),
            values: sortedAilments.map(([, count]) => count),
            totalAilments: Object.keys(ailmentCounts).length,
            totalOccurrences: Object.values(ailmentCounts).reduce((sum, count) => sum + count, 0),
            recordsCount: filteredData.length,
            isEmpty: false,
            mode: mode,
            metadata: {
                filters: this.filterManager.filters,
                topAilments: sortedAilments.length,
                mode: mode
            }
        };

        return result;
    }

    getFilteredSymptomsData() {
        const selectedSymptoms = this.filterManager.filters.symptoms;
        const filteredData = this.filterManager.getFilteredData();

        if (filteredData.length === 0) {
            return { isEmpty: true, message: 'Δεν υπάρχουν δεδομένα για τα επιλεγμένα κριτήρια' };
        }

        let symptomCounts = {};
        let mode = 'discovery';

        if (selectedSymptoms.length > 0) {
            mode = 'selected';
            
            selectedSymptoms.forEach(symptomName => {
                symptomCounts[symptomName] = 0;
            });

            filteredData.forEach(record => {
                record.symptomsArray.forEach(symptom => {
                    if (selectedSymptoms.includes(symptom)) {
                        symptomCounts[symptom]++;
                    }
                });
            });

            const symptomsWithData = Object.entries(symptomCounts)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1]);

            if (symptomsWithData.length === 0) {
                return { 
                    isEmpty: true, 
                    message: 'Τα επιλεγμένα συμπτώματα δεν βρέθηκαν στα φιλτραρισμένα δεδομένα' 
                };
            }
        } else {
            mode = 'discovery';

            filteredData.forEach(record => {
                record.symptomsArray.forEach(symptom => {
                    symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
                });
            });

            const sortedSymptoms = Object.entries(symptomCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15);

            if (sortedSymptoms.length === 0) {
                return { isEmpty: true, message: 'Δεν βρέθηκαν συμπτώματα στα επιλεγμένα δεδομένα' };
            }
        }

        const sortedSymptoms = Object.entries(symptomCounts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        const result = {
            labels: sortedSymptoms.map(([symptom]) => symptom),
            values: sortedSymptoms.map(([, count]) => count),
            totalSymptoms: Object.keys(symptomCounts).length,
            totalOccurrences: Object.values(symptomCounts).reduce((sum, count) => sum + count, 0),
            recordsCount: filteredData.length,
            isEmpty: false,
            mode: mode,
            metadata: {
                filters: this.filterManager.filters,
                topSymptoms: sortedSymptoms.length,
                mode: mode
            }
        };

        return result;
    }

    handleFilteredChartClick(item, frequency, chartType) {
        const filters = this.filterManager.filters;
        const activeFilters = [];
        
        if (filters.cities.length > 0) activeFilters.push(`Πόλεις: ${filters.cities.join(', ')}`);
        if (filters.ages.length > 0) activeFilters.push(`Ηλικίες: ${filters.ages.join(', ')}`);
        if (filters.genders.length > 0) activeFilters.push(`Φύλα: ${filters.genders.join(', ')}`);
        if (filters.dateRange) {
            const start = filters.dateRange.start.toLocaleDateString('el-GR');
            const end = filters.dateRange.end.toLocaleDateString('el-GR');
            activeFilters.push(`Περίοδος: ${start} - ${end}`);
        }
        
        const filtersText = activeFilters.length > 0 ? 
            `\n\nΕνεργά φίλτρα:\n${activeFilters.join('\n')}` : 
            '\n\nΦίλτρα: Κανένα (όλα τα δεδομένα)';

        const typeText = chartType === 'ailments' ? 'Ασθένεια' : 'Σύμπτωμα';
        
        alert(`📊 Λεπτομέρειες\n\n${typeText}: ${item}\nΠεριπτώσεις: ${frequency}${filtersText}`);
    }

    updateChartInfo(infoElementId, chartData, type) {
        const infoElement = document.getElementById(infoElementId);
        if (!infoElement) {
            return;
        }

        const totalOccurrences = chartData.totalOccurrences || 0;
        const recordsCount = chartData.recordsCount || 0;
        const displayedItems = chartData.labels ? chartData.labels.length : 0;
        const totalItems = type === 'ασθένειες' ? chartData.totalAilments : 
                          type === 'συμπτώματα' ? chartData.totalSymptoms :
                          chartData.totalSymptoms;

        const filters = chartData.metadata?.filters || {};
        const mode = chartData.mode || 'discovery';
        
        let modeText;
        if (mode === 'selected') {
            modeText = `Επιλεγμένα (${displayedItems})`;
        } else {
            const hasFilters = (filters.cities && filters.cities.length > 0) ||
                              (filters.ages && filters.ages.length > 0) ||
                              (filters.genders && filters.genders.length > 0) ||
                              (filters.dateRange !== null);
            modeText = hasFilters ? `Κορυφαία ${displayedItems}` : `Κορυφαία ${displayedItems}`;
        }

        infoElement.textContent = `📊 ${modeText} ${type} | ${totalOccurrences} εμφανίσεις | ${recordsCount} αξιολογήσεις`;
    }

    showEmptyChart(canvasId, message) {
        const chartKey = this.getChartKeyFromCanvasId(canvasId);
        
        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
            this.charts[chartKey] = null;
        }

        const infoId = canvasId.replace('Chart', 'ChartInfo');
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
        if (canvasId.includes('ailments')) return 'ailments';
        if (canvasId.includes('symptoms') && !canvasId.includes('location')) return 'symptoms';
        if (canvasId.includes('age')) return 'age';
        if (canvasId.includes('gender')) return 'gender';
        if (canvasId.includes('match')) return 'match';
        if (canvasId.includes('city')) return 'city';
        if (canvasId.includes('ageAilment')) return 'ageAilment';
        return 'ailments';
    }

    updateChart(chartKey, canvasId, config) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
        }

        this.charts[chartKey] = new Chart(ctx, config);
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        this.charts = {
            age: null,
            gender: null,
            ailments: null,
            match: null,
            city: null,
            ageAilment: null,
            symptoms: null
        };
    }

    getChart(chartKey) {
        return this.charts[chartKey];
    }

    hasChart(chartKey) {
        return this.charts[chartKey] !== null;
    }

    updateSpecificChart(chartKey) {
        const chartData = this.filterManager.getChartData();

        switch (chartKey) {
            case 'age':
                this.updateChart('age', 'ageChart', {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(chartData.ageDistribution),
                        datasets: [{
                            data: Object.values(chartData.ageDistribution),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
                break;

            case 'gender':
                this.updateChart('gender', 'genderChart', {
                    type: 'pie',
                    data: {
                        labels: Object.keys(chartData.genderDistribution).map(gender => {
                            const genderLabels = { 'Male': 'Αρσενικό', 'Female': 'Θηλυκό', 'Other': 'Άλλο' };
                            return genderLabels[gender] || gender;
                        }),
                        datasets: [{
                            data: Object.values(chartData.genderDistribution),
                            backgroundColor: ['#667eea', '#764ba2', '#f093fb']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
                break;

            case 'city':
                const selectedCities = this.filterManager.filters.cities;
                let cityData;

                if (selectedCities.length > 0) {
                    cityData = selectedCities.map(city => {
                        const count = chartData.cityDistribution[city] || 0;
                        return [city, count];
                    }).filter(([, count]) => count > 0);
                } else {
                    cityData = chartData.topCities;
                }

                this.updateChart('city', 'cityChart', {
                    type: 'bar',
                    data: {
                        labels: cityData.map(([city]) => city),
                        datasets: [{
                            label: 'Αριθμός Αξιολογήσεων',
                            data: cityData.map(([, count]) => count),
                            backgroundColor: '#f093fb',
                            borderColor: '#e077e0',
                            borderWidth: 2,
                            borderRadius: 4,
                            borderSkipped: false,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        categoryPercentage: 0.8,
                        barPercentage: 0.6,
                        scales: {
                            x: { 
                                ticks: {
                                    maxRotation: 45,
                                    minRotation: 0
                                },
                                grid: {
                                    display: false
                                }
                            },
                            y: { 
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
                break;

            case 'ailments':
                this.updateFilteredAilmentsChart();
                break;

            case 'symptoms':
                this.updateFilteredSymptomsChart();
                break;

            default:
                break;
        }
    }
}