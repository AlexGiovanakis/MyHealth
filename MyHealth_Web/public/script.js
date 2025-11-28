import { fetchData } from "./firebase.js"; // Import Firebase function

document.addEventListener("DOMContentLoaded", () => {
    /** ==============================
     * 🔹 VARIABLES & ELEMENTS
     * ============================== */
    const dateInput = document.getElementById("dateFilter");
    const locationInput = document.getElementById("locationFilter");
    const symptomInput = document.getElementById("symptomFilter");
    const ailmentInput = document.getElementById("ailmentFilter");

    const locationSuggestions = document.getElementById("locationSuggestions");
    const symptomSuggestions = document.getElementById("symptomSuggestions");
    const ailmentSuggestions = document.getElementById("ailmentSuggestions");

    const applyFiltersBtn = document.getElementById("applyFilters");
    const chartSection = document.querySelector(".charts");
    const chartCanvas = document.getElementById("healthChart").getContext("2d");
    let healthChart;

    let availableDates = new Set(); 
    let selectedDate = ""; // Stores the selected date
    let allLocations = new Set();
    let allSymptoms = new Set();
    let allAilments = new Set();
    let rawData = [];

    /** ==============================
     * 🔹 FETCH & STORE DATA FROM FIREBASE
     * ============================== */
    fetchData("Results", (data) => {
        if (!data) return;
        rawData = Object.values(data); // Store full dataset

        rawData.forEach(entry => {
            if (entry.SelectedDate) availableDates.add(entry.SelectedDate);
            if (entry["Locations Details"]?.SelectedLocation) allLocations.add(entry["Locations Details"].SelectedLocation);
            if (entry.SelectedSymptoms) entry.SelectedSymptoms.forEach(symptom => allSymptoms.add(symptom));
            if (entry.Ailments) entry.Ailments.forEach(ailment => allAilments.add(ailment));
        });

        restrictDateSelection();
    });

    /** ==============================
     * 🔹 DATE SELECTION HANDLING
     * ============================== */
    function restrictDateSelection() {
        const allowedDates = [...availableDates]
            .map(date => ({ original: date, parsed: parseDateFromDDMMYYYY(date) }))
            .sort((a, b) => a.parsed - b.parsed)
            .map(dateObj => dateObj.original);

        dateInput.addEventListener("focus", () => showDateDropdown(allowedDates));
    }

    function showDateDropdown(allowedDates) {
        let dropdown = document.createElement("ul");
        dropdown.classList.add("date-dropdown");

        allowedDates.forEach(date => {
            let option = document.createElement("li");
            option.textContent = date;
            option.addEventListener("click", () => {
                dateInput.value = date; 
                selectedDate = date;
                dropdown.remove();
            });
            dropdown.appendChild(option);
        });

        document.querySelectorAll(".date-dropdown").forEach(e => e.remove());
        document.body.appendChild(dropdown);

        // Position dropdown below input field
        const rect = dateInput.getBoundingClientRect();
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;

        setTimeout(() => dropdown.classList.add("active"), 10);
    }

    function parseDateFromDDMMYYYY(dateStr) {
        const [day, month, year] = dateStr.split("/").map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
    }

    dateInput.addEventListener("click", (e) => e.preventDefault());

    /** ==============================
     * 🔹 AUTOCOMPLETE FOR INPUT FIELDS
     * ============================== */
    function populateSuggestions(input, suggestionsList, allItems, showAll = false) {
        const filter = input.toLowerCase();
        let filteredItems = showAll ? [...allItems] : [...allItems].filter(item => item.toLowerCase().includes(filter));

        suggestionsList.innerHTML = ""; // Clear previous suggestions
        if (filteredItems.length === 0) {
            suggestionsList.style.display = "none";
            return;
        }

        filteredItems.forEach(item => {
            let li = document.createElement("li");
            li.textContent = item;
            li.addEventListener("click", () => {
                if (suggestionsList === locationSuggestions) locationInput.value = item;
                if (suggestionsList === symptomSuggestions) symptomInput.value = item;
                if (suggestionsList === ailmentSuggestions) ailmentInput.value = item;
                suggestionsList.style.display = "none"; // Hide dropdown after selection
            });
            suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = "block"; // Show dropdown
    }

    function setupAutocomplete(input, suggestionsList, dataSet) {
        input.addEventListener("focus", () => populateSuggestions(input.value, suggestionsList, dataSet, true));
        input.addEventListener("input", () => {
            if (input.value.length > 0) populateSuggestions(input.value, suggestionsList, dataSet);
            else suggestionsList.style.display = "none";
        });
    }

    setupAutocomplete(locationInput, locationSuggestions, allLocations);
    setupAutocomplete(symptomInput, symptomSuggestions, allSymptoms);
    setupAutocomplete(ailmentInput, ailmentSuggestions, allAilments);

    document.addEventListener("click", (event) => {
        if (!locationInput.contains(event.target) && !locationSuggestions.contains(event.target)) locationSuggestions.style.display = "none";
        if (!symptomInput.contains(event.target) && !symptomSuggestions.contains(event.target)) symptomSuggestions.style.display = "none";
        if (!ailmentInput.contains(event.target) && !ailmentSuggestions.contains(event.target)) ailmentSuggestions.style.display = "none";
    });

    /** ==============================
     * 🔹 APPLY FILTERS & UPDATE CHART
     * ============================== */
    applyFiltersBtn.addEventListener("click", () => {
        const selectedLocation = locationInput.value.trim().toLowerCase();
        const selectedSymptom = symptomInput.value.trim().toLowerCase();
        const selectedAilment = ailmentInput.value.trim().toLowerCase();

        if (!selectedLocation && !selectedSymptom && !selectedAilment) {
            alert("Please select at least one filter (Location, Symptom, or Ailment) before applying filters.");
            return;
        }

        let filteredData = rawData.filter(entry => {
            const locationMatch = selectedLocation ? (entry["Locations Details"]?.SelectedLocation?.toLowerCase() || "").includes(selectedLocation) : false;
            const symptomMatch = selectedSymptom ? entry.SelectedSymptoms?.some(s => s.toLowerCase().includes(selectedSymptom)) : false;
            const ailmentMatch = selectedAilment ? entry.Ailments?.some(a => a.toLowerCase().includes(selectedAilment)) : false;
            return locationMatch || symptomMatch || ailmentMatch;
        });

        let ailmentCounts = {};
        filteredData.forEach(entry => {
            entry.Ailments.forEach(a => {
                ailmentCounts[a] = (ailmentCounts[a] || 0) + 1;
            });
        });

        if (filteredData.length === 0) {
            alert("No data found for the selected filters.");
            chartSection.style.display = "none";
            return;
        }

        chartSection.style.display = "block";
        updateChart(ailmentCounts, document.getElementById("chartType").value);
    });

    function updateChart(data, chartType) {
        if (healthChart) healthChart.destroy();
        healthChart = new Chart(chartCanvas, {
            type: chartType,
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: "Cases",
                    data: Object.values(data),
                    backgroundColor: ["#FF5733", "#33FF57", "#3357FF"],
                }]
            }
        });
    }
});
