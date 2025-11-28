package com.example.myhealth;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.Manifest;
import android.app.DatePickerDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;

public class DiseaseDiagnosis extends AppCompatActivity {

    // Constants
    private static final int TOTAL_STEPS = 4;

    // Progress Header Elements
    private TextView stepTitle, stepCounter, nextStepHint;
    private ProgressBar progressBar;

    // Step Status Elements
    private TextView locationStatus, dateStatus, resultsStatus;

    // Card Elements
    private LinearLayout locationCard, dateCard, resultsCard;

    // Location Elements
    private TextView selected_location;
    private LocationManager locationManager;
    private Button btn_automatic_location;
    private boolean isLocationSelected = false;

    // Date Elements
    private TextView dateOptionsSpinnerTextview;
    private Spinner dateOptionsSpinner;
    private String selectedDate;
    private boolean isDateSelected = false;

    // Results Elements
    private Button actionButton;
    private RecyclerView recyclerView;

    // Data
    private User user;
    private ArrayList<String> displayedSymptoms;
    private DatabaseReference association;
    private DatabaseReference adminSettings;
    private double globalWeightFactor;
    private double highMatchThreshold;
    private double moderateMatchThreshold;
    private List<Final_Ailments_Adapter.AilmentResult> highMatch = new ArrayList<>();
    private List<Final_Ailments_Adapter.AilmentResult> moderateMatch = new ArrayList<>();
    private List<Final_Ailments_Adapter.AilmentResult> lowMatch = new ArrayList<>();
    private List<Enhanced_AilmentResult> enhancedResults = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_disease_diagnosis);

        // Get intent data
        Intent incomingIntent = getIntent();
        user = User.getCurrentUser();
        displayedSymptoms = incomingIntent.getStringArrayListExtra("displayedSymptoms");

        // Check if user is available
        if (user == null) {
            Toast.makeText(this, "User session expired. Please login again.",
                    Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        initViews();
        setupInitialState();
        setupLocationButton();
        setupDateSpinner();
        setupActionButton();
        loadConfigurationAndCheckAilments();
    }

    private void initViews() {
        // Progress Header
        stepTitle = findViewById(R.id.stepTitle);
        stepCounter = findViewById(R.id.stepCounter);
        nextStepHint = findViewById(R.id.nextStepHint);
        progressBar = findViewById(R.id.progressBar);
        progressBar.setMax(100); // Explicitly set max

        // Status Elements
        locationStatus = findViewById(R.id.locationStatus);
        dateStatus = findViewById(R.id.dateStatus);
        resultsStatus = findViewById(R.id.resultsStatus);

        // Cards
        locationCard = findViewById(R.id.locationCard);
        dateCard = findViewById(R.id.dateCard);
        resultsCard = findViewById(R.id.resultsCard);

        // Location Elements
        selected_location = findViewById(R.id.selected_location);
        locationManager = new LocationManager(this, selected_location);
        btn_automatic_location = findViewById(R.id.btn_automatic_location);

        // Date Elements
        dateOptionsSpinner = findViewById(R.id.dateOptionsSpinner);
        dateOptionsSpinnerTextview = findViewById(R.id.dateOptionsSpinnerTextview);

        // Results Elements
        actionButton = findViewById(R.id.actionButton);
        recyclerView = findViewById(R.id.listView1234);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
    }

    private void setupInitialState() {
        // Start at Step 2 - Location Selection
        updateProgressHeader(2, "Βήμα 2: Επιλογή Τοποθεσίας", "Επόμενο: Επιλογή Ημερομηνίας");

        // Show only location card initially
        locationCard.setVisibility(View.VISIBLE);
        dateCard.setVisibility(View.GONE);
        resultsCard.setVisibility(View.GONE);

        // Set initial status
        locationStatus.setText("Απαιτείται");
        locationStatus.setTextColor(getColor(android.R.color.holo_orange_dark));
    }

    private void updateProgressHeader(int step, String title, String hint) {
        int progress = (step * 100) / TOTAL_STEPS;

        stepTitle.setText(title);
        stepCounter.setText(step + "/" + TOTAL_STEPS);
        nextStepHint.setText(hint);
        progressBar.setProgress(progress);

        // Update counter colors based on step
        if (step == 2) {
            stepCounter.setBackgroundColor(getColor(android.R.color.holo_blue_light));
        } else if (step == 3) {
            stepCounter.setBackgroundColor(getColor(android.R.color.holo_purple));
        } else if (step == 4) {
            stepCounter.setBackgroundColor(getColor(android.R.color.holo_green_light));
        }
        stepCounter.setTextColor(getColor(android.R.color.white));
    }

    private void setupLocationButton() {
        btn_automatic_location.setOnClickListener(v -> {
            checkAndRequestPermissions();
        });
    }

    private void onLocationReceived(String locationText) {
        if (locationText != null && !locationText.trim().isEmpty() && !locationText.equals("Unknown location")) {
            isLocationSelected = true;

            // Update location status
            locationStatus.setText("Ολοκληρώθηκε ✅");
            locationStatus.setTextColor(getColor(android.R.color.holo_green_dark));
            locationStatus.setBackgroundColor(getColor(android.R.color.white));

            // Move to Step 3 - Date Selection
            proceedToDateSelection();
        }
    }

    private void proceedToDateSelection() {
        // Update progress header
        updateProgressHeader(3, "Βήμα 3: Επιλογή Ημερομηνίας", "Επόμενο: Προβολή Αποτελεσμάτων");

        // Show date card
        dateCard.setVisibility(View.VISIBLE);

        // Update date status
        dateStatus.setText("Απαιτείται");
        dateStatus.setTextColor(getColor(android.R.color.holo_orange_dark));
    }

    private void setupDateSpinner() {
        String[] optionsDate = {
                "Ημερομηνία έναρξης συμπτωμάτων",
                "Πριν από 3 μέρες",
                "Πριν από 7 μέρες",
                "Πριν από 1 μήνα",
                "Επέλεξε χειροκίνητα ημερομηνία"
        };

        ArrayAdapter<String> adapterDate = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, optionsDate) {
            @Override
            public boolean isEnabled(int position) {
                // Disable the first item (hint)
                return position != 0;
            }

            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View view = super.getDropDownView(position, convertView, parent);
                TextView textView = (TextView) view;
                if (position == 0) {
                    // Make hint gray and italic
                    textView.setTextColor(Color.GRAY);
                    textView.setTypeface(null, Typeface.ITALIC);
                } else {
                    textView.setTextColor(Color.BLACK);
                    textView.setTypeface(null, Typeface.NORMAL);
                }
                return view;
            }
        };

        adapterDate.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        dateOptionsSpinner.setAdapter(adapterDate);

        dateOptionsSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position == 0) {
                    // Hint selected - do nothing
                    return;
                } else if (position == 4) {
                    showDatePickerDialog();
                } else {
                    Calendar c = Calendar.getInstance();
                    switch (position) {
                        case 1:
                            c.add(Calendar.DAY_OF_MONTH, -3);
                            break;
                        case 2:
                            c.add(Calendar.DAY_OF_MONTH, -7);
                            break;
                        case 3:
                            c.add(Calendar.MONTH, -1);
                            break;
                    }
                    selectedDate = String.format("%02d/%02d/%d", c.get(Calendar.DAY_OF_MONTH), c.get(Calendar.MONTH) + 1, c.get(Calendar.YEAR));
                    onDateSelected(selectedDate);
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });
    }

    private void showDatePickerDialog() {
        Calendar c = Calendar.getInstance();
        DatePickerDialog datePickerDialog = new DatePickerDialog(this, (view, year, month, dayOfMonth) -> {
            selectedDate = String.format("%02d/%02d/%d", dayOfMonth, month + 1, year);
            onDateSelected(selectedDate);
        }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH));

        datePickerDialog.show();
    }

    private boolean validateUserData() {
        if (user == null) return false;
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) return false;
        if (user.getDob() == null || user.getDob().trim().isEmpty()) return false;
        return true;
    }

    private void onDateSelected(String date) {
        selectedDate = date;
        isDateSelected = true;

        // Update UI
        dateOptionsSpinnerTextview.setText("Ημερομηνία συμπτωμάτων: " + selectedDate);
        dateOptionsSpinnerTextview.setVisibility(View.VISIBLE);

        // Update date status
        dateStatus.setText("Ολοκληρώθηκε ✅");
        dateStatus.setTextColor(getColor(android.R.color.holo_green_dark));
        dateStatus.setBackgroundColor(getColor(android.R.color.white));

        // Move to Step 4 - Results
        proceedToResults();
    }

    private void proceedToResults() {
        // Update progress header - Step 4 with action hint
        updateProgressHeader(4, "Βήμα 4: Αποτελέσματα", "Πατήστε 'Εμφάνιση Αποτελεσμάτων'");

        // Show results card
        resultsCard.setVisibility(View.VISIBLE);

        // Update results status
        resultsStatus.setText("Έτοιμα");
        resultsStatus.setTextColor(getColor(android.R.color.white));
        resultsStatus.setBackgroundColor(getColor(android.R.color.holo_green_dark));
    }

    private void setupActionButton() {
        actionButton.setOnClickListener(view -> {
            showResults();
            recyclerView.setVisibility(View.VISIBLE);
            nextStepHint.setText("Ολοκληρώθηκε");

        });
    }

    private void checkAndRequestPermissions() {
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
        } else {
            locationManager.checkLocationSettingsAndStartUpdates();
            monitorLocationChanges();
        }
    }

    private void monitorLocationChanges() {
        android.os.Handler handler = new android.os.Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                String currentLocation = selected_location.getText().toString();
                if (!currentLocation.equals("Η τοποθεσία σας θα εμφανιστεί εδώ...") &&
                        !currentLocation.equals("Unknown location") &&
                        !currentLocation.trim().isEmpty() &&
                        !isLocationSelected) {
                    onLocationReceived(currentLocation);
                } else if (!isLocationSelected) {
                    handler.postDelayed(this, 2000);
                }
            }
        }, 2000);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1 && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            locationManager.checkLocationSettingsAndStartUpdates();
            monitorLocationChanges();
        } else {
            Toast.makeText(this, "Permission denied!", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (User.getCurrentUser() == null) {
            Toast.makeText(this, "Session expired. Please login again.", Toast.LENGTH_SHORT).show();
            redirectToLogin();
            return;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        locationManager.stopLocationUpdates();
    }

    private void redirectToLogin() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void loadConfigurationAndCheckAilments() {
        adminSettings = FirebaseDatabase.getInstance().getReference("Admin Settings");
        adminSettings.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                // Load Weight Factor
                globalWeightFactor = dataSnapshot.child("weightFactor").exists()
                        ? Double.parseDouble(dataSnapshot.child("weightFactor").getValue(String.class).replace("%", ""))
                        : 15.0;

                // Load High Match Threshold
                highMatchThreshold = dataSnapshot.child("highMatchThreshold").exists()
                        ? Double.parseDouble(dataSnapshot.child("highMatchThreshold").getValue().toString().replace("%", ""))
                        : 70.0;

                // Load Moderate Match Threshold
                moderateMatchThreshold = dataSnapshot.child("moderateMatchThreshold").exists()
                        ? Double.parseDouble(dataSnapshot.child("moderateMatchThreshold").getValue().toString().replace("%", ""))
                        : 40.0;

                // Proceed with ailment checking using loaded configuration
                checkAilments();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(DiseaseDiagnosis.this, "Error loading configuration: " + error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void checkAilments() {
        association = FirebaseDatabase.getInstance().getReference("Admin Association");
        association.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                List<Enhanced_AilmentResult> allResults = new ArrayList<>();
                for (DataSnapshot category : dataSnapshot.getChildren()) {
                    String categoryKey = category.getKey();
                    // Initialize counters for this ailment
                    int matchingCount = 0;
                    double totalWeight = 0;
                    double matchingWeight = 0;
                    HashMap<String, Double> matchedSymptomsWithWeights = new HashMap<>();
                    // Loop through each symptom in this ailment
                    for (DataSnapshot item : category.getChildren()) {
                        String raw = item.getValue(String.class);
                        if (raw == null || raw.trim().isEmpty()) continue;
                        // Parse symptom and weight from the raw string
                        String[] parts = raw.split("\\|");
                        String symptom = parts[0].trim();
                        double weight = parts.length > 1 ? Double.parseDouble(parts[1].trim()) : 1.0;
                        // Add to total weight for this ailment
                        totalWeight += weight;
                        // Check if user selected this symptom
                        if (displayedSymptoms.contains(symptom)) {
                            matchingCount++;
                            matchingWeight += weight;
                            matchedSymptomsWithWeights.put(symptom, weight);
                        }
                    }
                    // Calculate percentage for this ailment
                    if (totalWeight > 0) {
                        double percentage = (matchingWeight / totalWeight) * 100;
                        // Apply weight factor threshold - ONLY include if above threshold
                        if (percentage >= globalWeightFactor && matchingCount > 0) {
                            allResults.add(new Enhanced_AilmentResult(
                                    categoryKey, percentage, matchingCount, matchedSymptomsWithWeights));
                        }
                    }
                }
                // Sort results by percentage (highest first)
                allResults.sort((a, b) -> Double.compare(b.percentage, a.percentage));
                // Convert to original format for adapter and categorize
                highMatch.clear();
                moderateMatch.clear();
                lowMatch.clear();
                for (Enhanced_AilmentResult result : allResults) {
                    Final_Ailments_Adapter.AilmentResult adapterResult =
                            new Final_Ailments_Adapter.AilmentResult(result.ailmentName,
                                    result.percentage, result.matchingSymptoms);
                    if (result.percentage >= highMatchThreshold) {
                        highMatch.add(adapterResult);
                    } else if (result.percentage >= moderateMatchThreshold) {
                        moderateMatch.add(adapterResult);
                    } else {
                        lowMatch.add(adapterResult);
                    }
                }
                // Store enhanced results for saving to Firebase
                enhancedResults = allResults;
                // Set up the adapter
                if (recyclerView.getAdapter() == null) {
                    Final_Ailments_Adapter adapter =
                            new Final_Ailments_Adapter(DiseaseDiagnosis.this);
                    recyclerView.setAdapter(adapter);
                }
                // Update the adapter with categorized results
                Final_Ailments_Adapter adapter = (Final_Ailments_Adapter) recyclerView.getAdapter();
                adapter.updateData(highMatch, moderateMatch, lowMatch);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(DiseaseDiagnosis.this,
                        "Error loading ailments: " + error.getMessage(),
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showResults() {
        if (user == null) {
            Toast.makeText(this, "User info is not available. Cannot save results.", Toast.LENGTH_SHORT).show();
            return;
        }
        // Save to Results with enhanced data
        saveToResults();

        Toast.makeText(this, "Results saved successfully!", Toast.LENGTH_SHORT).show();
    }

    private void saveToResults() {
        DatabaseReference resultsRef = FirebaseDatabase.getInstance().getReference("Results");
        if (!validateUserData()) {
            Toast.makeText(this, "Invalid user data. Please login again.", Toast.LENGTH_SHORT).show();
            redirectToLogin();
            return;
        }
        String customKey = "result_" + user.getUsername() + "_" + System.currentTimeMillis();

        // 1. USER INFORMATION with age and gender
        HashMap<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", user.getUsername());
        userInfo.put("userAge", calculateUserAge());
        userInfo.put("gender", user.getGender());

        // 2. LOCATION INFORMATION with coordinates
        HashMap<String, Object> locationDetails = new HashMap<>();
        locationDetails.put("city", selected_location.getText().toString());
        locationDetails.put("latitude", locationManager.getLatitude());
        locationDetails.put("longitude", locationManager.getLongitude());

        // 3. DETAILED AILMENT MATCHES with percentages, confidence, and symptom weights
        HashMap<String, Object> detailedAilments = new HashMap<>();
        for (Enhanced_AilmentResult result : enhancedResults) {
            HashMap<String, Object> ailmentDetail = new HashMap<>();

            ailmentDetail.put("matchPercentage", Math.round(result.percentage * 100.0) / 100.0);
            ailmentDetail.put("confidenceLevel", getConfidenceLevel(result.percentage));
            ailmentDetail.put("symptomsMatched", result.matchingSymptoms);
            ailmentDetail.put("selectedSymptomsWithWeights", result.matchedSymptomsWithWeights);

            // Use ailment name as the key instead of numeric index
            detailedAilments.put(result.ailmentName, ailmentDetail);
        }

        // 4. SYSTEM SETTINGS USED
        HashMap<String, Object> systemSettings = new HashMap<>();
        systemSettings.put("weightFactorUsed", globalWeightFactor + "%");
        systemSettings.put("highThresholdUsed", highMatchThreshold + "%");
        systemSettings.put("moderateThresholdUsed", moderateMatchThreshold + "%");

        // 5. COMPILE COMPLETE RESULTS
        HashMap<String, Object> completeResults = new HashMap<>();
        completeResults.put("UserInfo", userInfo);
        completeResults.put("Location Details", locationDetails);
        completeResults.put("SelectedDate", selectedDate);
        completeResults.put("DetailedAilments", detailedAilments);
        completeResults.put("SystemSettings", systemSettings);

        // SAVE TO FIREBASE
        resultsRef.child(customKey).setValue(completeResults);
    }

    private String getConfidenceLevel(double percentage) {
        if (percentage >= highMatchThreshold) return "ΥΨΗΛΗ";
        else if (percentage >= moderateMatchThreshold) return "ΜΕΤΡΙΑ";
        else return "ΧΑΜΗΛΗ";
    }

    private int calculateUserAge() {
        if (!validateUserData()) {
            return 0;
        }
        try {
            String[] dobParts = user.getDob().split("/");
            int day = Integer.parseInt(dobParts[0]);
            int month = Integer.parseInt(dobParts[1]);
            int year = Integer.parseInt(dobParts[2]);

            Calendar birthDate = Calendar.getInstance();
            birthDate.set(year, month - 1, day);

            Calendar today = Calendar.getInstance();

            int age = today.get(Calendar.YEAR) - birthDate.get(Calendar.YEAR);

            // Adjust if birthday hasn't occurred this year
            if (today.get(Calendar.DAY_OF_YEAR) < birthDate.get(Calendar.DAY_OF_YEAR)) {
                age--;
            }

            return age;
        } catch (Exception e) {
            android.util.Log.e("AGE_CALC", "Error calculating age from DOB: " + user.getDob());
            return 0;
        }
    }

    // Enhanced result class to store symptom weights
    private static class Enhanced_AilmentResult {
        String ailmentName;
        double percentage;
        int matchingSymptoms;
        HashMap<String, Double> matchedSymptomsWithWeights;

        Enhanced_AilmentResult(String ailmentName, double percentage, int matchingSymptoms, HashMap<String, Double> matchedSymptomsWithWeights) {
            this.ailmentName = ailmentName;
            this.percentage = percentage;
            this.matchingSymptoms = matchingSymptoms;
            this.matchedSymptomsWithWeights = matchedSymptomsWithWeights;
        }
    }
}