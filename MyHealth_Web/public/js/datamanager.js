import { fetchData } from '../firebase.js';

export class DataManager {
    constructor() {
        this.allData = [];
        this.dataLoadedCallback = null;
        this._dataCache = new Map();
    }

    onDataLoaded(callback) {
        this.dataLoadedCallback = callback;
    }

    initialize() {
        fetchData('/', (data) => {
            if (data) {
                this.processFirebaseData(data);
                if (this.dataLoadedCallback) {
                    this.dataLoadedCallback(this.allData);
                }
            } else {
                if (this.dataLoadedCallback) {
                    this.dataLoadedCallback([]);
                }
            }
        });
    }

    processFirebaseData(data) {
        this.allData = [];
        this._dataCache.clear();

        const resultsData = data.Results || {};

        Object.keys(resultsData).forEach(key => {
            if (resultsData[key] && typeof resultsData[key] === 'object' && key.startsWith('result_')) {
                const record = resultsData[key];
                const processedRecord = this._processRecord(key, record);
                this.allData.push(processedRecord);
            }
        });
    }

    _processRecord(key, record) {
        const locationDetails = record["Location Details"] || record.LocationDetails;
        let cityValue = locationDetails?.city || 'Unknown';

        const processedRecord = {
            id: key,
            username: record.UserInfo?.username || 'Unknown',
            age: record.UserInfo?.userAge || 0,
            ageRange: this.getAgeRange(record.UserInfo?.userAge || 0),
            gender: this.normalizeGender(record.UserInfo?.gender),
            city: cityValue,
            latitude: locationDetails?.latitude,
            longitude: locationDetails?.longitude,
            date: this.parseDate(record.SelectedDate),
            dateStr: record.SelectedDate,
            systemSettings: record.SystemSettings,
            ailments: [],
            symptoms: new Set(),
            maxMatchPercentage: 0
        };

        if (record.DetailedAilments && typeof record.DetailedAilments === 'object') {
            this._processAilments(processedRecord, record.DetailedAilments);
        }

        processedRecord.symptomsArray = Array.from(processedRecord.symptoms);
        return processedRecord;
    }

    _processAilments(processedRecord, detailedAilments) {
        Object.keys(detailedAilments).forEach(ailmentName => {
            const ailmentDetails = detailedAilments[ailmentName];
            const ailmentSpecificSymptoms = [];

            if (ailmentDetails.selectedSymptomsWithWeights) {
                Object.keys(ailmentDetails.selectedSymptomsWithWeights).forEach(symptom => {
                    ailmentSpecificSymptoms.push(symptom);
                });
            }

            processedRecord.ailments.push({
                name: ailmentName,
                matchPercentage: parseFloat(ailmentDetails.matchPercentage) || 0,
                confidenceLevel: ailmentDetails.confidenceLevel,
                symptomsMatched: ailmentDetails.symptomsMatched || 0,
                symptoms: ailmentSpecificSymptoms
            });

            if (ailmentDetails.matchPercentage > processedRecord.maxMatchPercentage) {
                processedRecord.maxMatchPercentage = ailmentDetails.matchPercentage;
            }

            ailmentSpecificSymptoms.forEach(symptom => {
                processedRecord.symptoms.add(symptom);
            });
        });
    }

    getAllData() {
        return this.allData;
    }

    getRecordById(id) {
        return this.allData.find(record => record.id === id);
    }

    getUniqueValues(field) {
        const cacheKey = `unique_${field}`;
        
        if (this._dataCache.has(cacheKey)) {
            return this._dataCache.get(cacheKey);
        }

        const values = new Set();

        if (field === 'city') {
            this.allData.forEach(record => {
                if (record.city) values.add(record.city);
            });
        } else if (field === 'ailment') {
            this.allData.forEach(record => {
                record.ailments.forEach(ailment => values.add(ailment.name));
            });
        } else if (field === 'symptoms') {
            this.allData.forEach(record => {
                record.symptomsArray.forEach(symptom => values.add(symptom));
            });
        } else {
            this.allData.forEach(record => {
                if (record[field]) values.add(record[field]);
            });
        }

        const uniqueValues = Array.from(values).sort();
        this._dataCache.set(cacheKey, uniqueValues);
        return uniqueValues;
    }

    parseDate(dateStr) {
        if (!dateStr) return new Date();

        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);

                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    return new Date(year, month, day);
                }
            }
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
        }

        return new Date(dateStr);
    }

    normalizeGender(gender) {
        if (!gender) return 'Other';
        const normalized = gender.toLowerCase();
        if (normalized.includes('αρσεν') || normalized.includes('άνδρ') || normalized === 'male') {
            return 'Male';
        } else if (normalized.includes('θηλυ') || normalized.includes('γυναί') || normalized === 'female') {
            return 'Female';
        }
        return 'Other';
    }

    getAgeRange(age) {
        const ageNum = parseInt(age);
        if (ageNum < 18) return '0-17';
        if (ageNum <= 30) return '18-30';
        if (ageNum <= 50) return '31-50';
        if (ageNum <= 70) return '51-70';
        return '70+';
    }

    clearData() {
        this.allData = [];
        this._dataCache.clear();
    }

    refreshData() {
        this.initialize();
    }
}