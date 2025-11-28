package com.example.myhealth;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.Collections;

public class SubmitSymptoms extends AppCompatActivity {
    User user;
    DatabaseReference symptomsRef = FirebaseDatabase.getInstance().getReference("Admin Symptoms");
    private AutoCompleteTextView searchView;
    private ListView listView, displayedSymptomsListView;
    private ArrayList<String> selectedSymptoms, filteredSymptoms, displayedSymptoms;
    private TextView popuptextview, noSymptoms, yourSymptoms, symptomCounter, stepTitle, stepCounter, nextStepHint;

    private ProgressBar progressBar;
    private ImageView imageUserSickness;
    private ArrayAdapter<String> adapter;
    private BottomNavigationView bottomNavigationView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_submit_symptoms);
        initViews();
        readSymptoms();

        user = User.getCurrentUser();
        displayedSymptoms = new ArrayList<>();
        visibilityCheck();
        updateProgressHeader();
        popuptextview.setOnClickListener(view -> showCheckListDialog());

        listView.setChoiceMode(ListView.CHOICE_MODE_MULTIPLE);
        displayedSymptomsListView.setChoiceMode(ListView.CHOICE_MODE_MULTIPLE);
        adapter = new ArrayAdapter<String>(this, android.R.layout.simple_expandable_list_item_1, displayedSymptoms);

        // Enhanced TextWatcher with clean search experience
        searchView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
            }
            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
            }
            @Override
            public void afterTextChanged(Editable editable) {
                filteredSymptoms = new ArrayList<>();
                boolean isSearching = !editable.toString().isEmpty();
                if (isSearching) {
                    // Filter symptoms based on search input
                    for (String symptom : selectedSymptoms) {
                        if (symptom.toLowerCase().contains(editable.toString().toLowerCase())) {
                            filteredSymptoms.add(symptom);
                        }
                    }
                    // Hide the "select from list" option during search
                    popuptextview.setVisibility(View.GONE);
                    // Clean UI - Hide distracting elements during search
                    findViewById(R.id.selectedSymptomsLayout).setVisibility(View.GONE);
                    findViewById(R.id.buttonsContainer).setVisibility(View.GONE);
                    findViewById(R.id.emptyStateLayout).setVisibility(View.GONE);
                    // Show search results only if we have matches
                    if (filteredSymptoms.size() > 0) {
                        ArrayAdapter<String> searchAdapter = new ArrayAdapter<>(SubmitSymptoms.this,
                                android.R.layout.simple_list_item_1, filteredSymptoms);
                        listView.setAdapter(searchAdapter);
                        listView.setVisibility(View.VISIBLE);
                    } else
                        listView.setVisibility(View.GONE);

                } else {
                    // Not searching - show normal state
                    popuptextview.setVisibility(View.VISIBLE);
                    listView.setVisibility(View.GONE);
                    // Restore normal visibility based on whether symptoms are selected
                    visibilityCheck();
                }
            }
        });

        // Enhanced ListView click listener with keyboard management
        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                String selectedSymptom = parent.getItemAtPosition(position).toString();
                if (!displayedSymptoms.contains(selectedSymptom)) {
                    displayedSymptoms.add(selectedSymptom);
                    adapter.notifyDataSetChanged();
                    searchView.setText("");
                    hideKeyboard();
                    searchView.clearFocus();
                    visibilityCheck();
                }
            }
        });
        displayedSymptomsListView.setAdapter(adapter);
        displayedSymptomsListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                displayedSymptoms.remove(position);
                adapter.notifyDataSetChanged();
                visibilityCheck();
            }
        });
        bottomNavigationView.setOnNavigationItemSelectedListener(new BottomNavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                switch (item.getItemId()) {
                    case R.id.navigation_statistics:
                        Intent intent = new Intent(SubmitSymptoms.this, Statistics.class);
                        startActivity(intent);
                        break;
                    case R.id.navigation_maps:
                        Intent intentmap = new Intent(SubmitSymptoms.this, MapSickness.class);
                        startActivity(intentmap);
                        break;
                    case R.id.navigation_log_out:
                        showLogoutConfirmationDialog();
                        break;
                    default:
                        return false;
                }
                return true;
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Check if user session is still valid
        if (User.getCurrentUser() == null) {
            Toast.makeText(this, "Session expired. Please login again.", Toast.LENGTH_SHORT).show();
            redirectToLogin();
        }
    }

    private void redirectToLogin() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void initViews() {
        searchView = findViewById(R.id.searchText2);
        listView = findViewById(R.id.list_view2);
        displayedSymptomsListView = findViewById(R.id.displayed_symptoms_list_view);
        noSymptoms = findViewById(R.id.no_symptoms);
        yourSymptoms = findViewById(R.id.yourSymptoms);
        imageUserSickness = findViewById(R.id.userSickness);
        popuptextview = findViewById(R.id.popupChoise);
        bottomNavigationView = findViewById(R.id.bottom_navigation);
        stepTitle = findViewById(R.id.stepTitle);
        stepCounter = findViewById(R.id.stepCounter);
        nextStepHint = findViewById(R.id.nextStepHint);
        progressBar = findViewById(R.id.progressBar);
        // Add symptom counter reference
        symptomCounter = findViewById(R.id.symptomCounter);
        // Set initial visibility
        listView.setVisibility(View.GONE);
        // Set initial button states
        findViewById(R.id.ClearAllSubmit).setEnabled(false);
        findViewById(R.id.valueSubmit).setEnabled(false);
    }

    private void visibilityCheck() {
        if (displayedSymptoms.isEmpty()) {
            // Show empty state
            findViewById(R.id.emptyStateLayout).setVisibility(View.VISIBLE);
            findViewById(R.id.selectedSymptomsLayout).setVisibility(View.GONE);
            findViewById(R.id.buttonsContainer).setVisibility(View.GONE);
            // Disable buttons
            findViewById(R.id.ClearAllSubmit).setEnabled(false);
            findViewById(R.id.valueSubmit).setEnabled(false);
        } else {
            // Show selected symptoms
            findViewById(R.id.emptyStateLayout).setVisibility(View.GONE);
            findViewById(R.id.selectedSymptomsLayout).setVisibility(View.VISIBLE);
            findViewById(R.id.buttonsContainer).setVisibility(View.VISIBLE);
            // Enable buttons
            findViewById(R.id.ClearAllSubmit).setEnabled(true);
            findViewById(R.id.valueSubmit).setEnabled(true);
            // Update counter
            int count = displayedSymptoms.size();
            if (symptomCounter != null) {
                symptomCounter.setText(count + " συμπτώματα");
            }
        }
        updateProgressHeader();
    }

    private void hideKeyboard() {
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null && getCurrentFocus() != null) {
            imm.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), 0);
        }
    }

    private void readSymptoms() {
        symptomsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                selectedSymptoms = new ArrayList<>();
                for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                    String symptomName = snapshot.getValue(String.class);
                    selectedSymptoms.add(symptomName);
                }
                Collections.sort(selectedSymptoms);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
            }
        });
    }

    private void showCheckListDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Επιλέξτε συμπτώματα");
        boolean[] checkedItems = new boolean[selectedSymptoms.size()];
        for (int i = 0; i < selectedSymptoms.size(); i++) {
            if (displayedSymptoms.contains(selectedSymptoms.get(i))) {
                checkedItems[i] = true;
            }
        }
        builder.setMultiChoiceItems(selectedSymptoms.
                toArray(new String[0]), checkedItems, (dialog, which, isChecked) -> {
            checkedItems[which] = isChecked;
        });
        builder.setPositiveButton("OK", (dialog, which) -> {
            for (int i = 0; i < selectedSymptoms.size(); i++) {
                if (checkedItems[i] && !displayedSymptoms.contains(selectedSymptoms.get(i))) {
                    displayedSymptoms.add(selectedSymptoms.get(i));
                }
            }
            ((ArrayAdapter) displayedSymptomsListView.getAdapter()).notifyDataSetChanged();
            visibilityCheck();
        });
        builder.setNegativeButton("Ακύρωση", (dialog, which) -> dialog.dismiss());
        AlertDialog dialog = builder.create();
        dialog.show();
    }

    public void clearDisplayedSymptoms(View view) {
        if (displayedSymptoms.size() != 0) {
            displayedSymptoms.clear();
            ((ArrayAdapter) displayedSymptomsListView.getAdapter()).notifyDataSetChanged();
            visibilityCheck();
        } else {
            Toast.makeText(this, "Δεν υπήρχαν στοιχεία για διαγραφή.", Toast.LENGTH_LONG).show();
        }
    }

    public void goToDiseaseDiagnosis(View view) {
        if (displayedSymptoms.size() >= 1) {
            Intent intent = new Intent(SubmitSymptoms.this, DiseaseDiagnosis.class);
            intent.putStringArrayListExtra("displayedSymptoms", displayedSymptoms);
            startActivity(intent);
        } else {
            Toast.makeText(this, "Παρακαλώ προσθέστε τουλάχιστον ένα σύμπτωμα για να συνεχίσετε."
                    , Toast.LENGTH_LONG).show();
        }
    }

    private void showLogoutConfirmationDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Έξοδος");
        builder.setMessage("Επιβεβαίωση αποσύνδεσης ");
        builder.setPositiveButton("Ναι", (dialog, which) -> {
            User.clearCurrentUser();
            Toast.makeText(SubmitSymptoms.this, "Έχετε αποσυνδεθεί.", Toast.LENGTH_SHORT).show();
            finish();
        });
        builder.setNegativeButton("Οχι", (dialog, which) -> {
            dialog.dismiss();
        });
        AlertDialog dialog = builder.create();
        dialog.show();
    }

    private void updateProgressHeader() {
        if (displayedSymptoms.isEmpty()) {
            // No symptoms - Step 0
            stepTitle.setText("Επιλέξτε συμπτώματα");
            stepCounter.setText("0/4");
            nextStepHint.setText("Προσθέστε συμπτώματα");
            progressBar.setProgress(0);
            // Optional: Change colors for "not started" state
            stepCounter.setBackgroundColor(getColor(android.R.color.darker_gray));
            stepCounter.setTextColor(getColor(android.R.color.white));
        } else {
            // Has symptoms - Step 1 completed
            stepTitle.setText("Βήμα 1: Καταγραφή Συμπτωμάτων");
            stepCounter.setText("1/4");
            nextStepHint.setText("Επόμενο: Τοποθεσία");
            progressBar.setProgress(25);
            // Green color for active step
            stepCounter.setBackgroundColor(getColor(android.R.color.holo_green_light));
            stepCounter.setTextColor(getColor(android.R.color.white));
        }
    }
}