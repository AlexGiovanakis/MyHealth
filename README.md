MyHealth 

Development of a System for the Collection and Analysis of Health Data via Mobile App

📋 Overview

MyHealth is a simple but powerful healthcare monitoring system created as part of a thesis project at the Democritus University of Thrace (Department of Informatics).
The project brings together two connected tools:

📱 Android Mobile App — where everyday users can report symptoms and get instant health insights
🌐 Web Dashboard — where researchers and health professionals can explore, visualize, and analyze real-world health data

👉 Live Web Dashboard:
https://myhealth-4533b.web.app/

Together, they create a real-time loop between users and researchers, helping track health patterns, understand trends, and support better decision-making.

✨ What the System Can Do
Mobile App Features (Android)

🔍 Symptom Checker — Users choose their symptoms and get possible conditions with confidence levels
📊 Smart Matching Algorithm — Produces intelligent, weighted diagnosis suggestions
📍 Location Awareness — Collects location data (with permission) for mapping health trends
👤 User Profiles — Supports demographic data like age and gender for richer insights
🔐 Secure Login — Register and log in safely
⚙️ Admin Tools — Add, edit, or manage all symptoms and conditions inside the app

Web Dashboard Features (Analytics)

🗺️ Interactive Maps — See where specific conditions occur 
📈 Trend Visualizations — Track how symptoms or illnesses evolve over time
🎯 Powerful Multi-Filters — Filter by gender, age, location, date, symptoms, or conditions
📊 Real-Time Charts — Dynamic statistics that update as the user interacts
🔄 Smart Filter Sync — Filters interact with each other and adapt automatically
📉 Deep Insights — View demographics, frequency charts, and condition distributions


🛠️ Technologies Behind MyHealth
Android App
Language: Java
IDE: Android Studio
Database: Firebase Realtime Database
Maps: Google Maps API
Location: Google Play Services
UI Tools: Material Design, RecyclerView, CardView

Web Dashboard
Frontend: HTML5, CSS3, JavaScript
Charts: Chart.js
Date Picker: Flatpickr
Database: Firebase Realtime Database
Responsiveness: Custom CSS
Hosting: Firebase Hosting (optional)

📱 How Users Interact With MyHealth
For Mobile App Users

Sign In or Create an Account
Select Symptoms from the list
Enable Location (optional but helpful)
Pick a Date for when symptoms started
View Suggested Conditions with confidence percentages
Check Your History in the log

For Admins

Log in using admin credentials
Add, modify, or remove symptoms
Add, modify, or remove ailments
Create connections between symptoms and ailments using weight factors
Adjust system settings like threshold values

For Researchers (Web Dashboard)

Open the dashboard in a browser
Apply various filters
View statistics, charts, and map data
Explore health trends over time
Export or capture visual insights as needed

🎯 How the Matching Algorithm Works
The algorithm uses weighted matching, meaning each symptom-condition pair carries a “weight” that determines how strongly they relate.

Steps:
Each symptom is assigned a weight (1–99) for each ailment
The system adds up the weights of the symptoms a user selected
It calculates the match percentage
Results are classified into:
High Confidence (≥ 70%)
Moderate Confidence (40–69%)
Low Confidence (< 40%)

Example:

Ailment: Common Cold  
Symptoms:  
- Sneezing (5)  
- Cough (10)  
- Fatigue (5)  
Total Weight = 20

User selects: Sneezing + Cough  
Matching Weight = 15  
Match % = (15/20) × 100 = 75% → High Confidence

🎨 Dashboard Visuals & Insights
Interactive Charts
Age Distribution
Gender Breakdown
Most Common Ailments
Most Frequent Symptoms
Match Confidence Levels
City Distribution
Timeline Trends (daily/weekly/monthly)
Location-Based Trends (per city over time)
Smart Filtering
Filters auto-update based on available data
Only valid combinations are shown
Date ranges adjust to selected categories
All statistics update instantly

👥 Project Details

Institution: Democritus University of Thrace
Department: Informatics
Project Type: Thesis
Year: 2025
