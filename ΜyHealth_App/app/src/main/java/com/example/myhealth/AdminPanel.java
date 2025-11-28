package com.example.myhealth;

import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.HashMap;

public class AdminPanel extends AppCompatActivity {
    AlertDialog.Builder builderSympt;
    LinearLayout linearLayout;
    CardView constraintSymptoms, constraintAilment, constraintAssociation, constraintLogOut, constraintWeightFactor;
    EditText characteristicNameEditText;
    TextView sympNumber, adminAil, adminSympt, ailNumber, userNumber;

    FirebaseDatabase database = FirebaseDatabase.getInstance();

    DatabaseReference sympNumberRef = database.getReference("Admin Symptoms");
    DatabaseReference ailNumberRef = database.getReference("Admin Ailment");
    DatabaseReference userNumberRef = database.getReference("Users");
    DatabaseReference weightFactorRef = database.getReference("Admin Settings");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_panel);
        initViews();

        sympNumberRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                long count = snapshot.getChildrenCount();
                sympNumber.setText(String.valueOf(count));
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

        adminSympt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent I = new Intent(AdminPanel.this, AdminSymptoms.class);
                startActivity(I);
            }
        });

        adminAil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent I = new Intent(AdminPanel.this, AdminAilments.class);
                startActivity(I);
            }
        });

        ailNumberRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                long count = snapshot.getChildrenCount();
                ailNumber.setText(String.valueOf(count));
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

        userNumberRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                long count = snapshot.getChildrenCount();
                userNumber.setText(String.valueOf(count));
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

        constraintSymptoms.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ShowAddSymptoms();
            }
        });

        constraintAilment.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ShowAddAilment();
            }
        });

        constraintAssociation.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent I = new Intent(AdminPanel.this, AdminAssociation.class);
                startActivity(I);
            }
        });

        constraintLogOut.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent I = new Intent(AdminPanel.this, MainActivity.class);
                startActivity(I);
            }
        });

        constraintWeightFactor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ShowWeightFactorDialog();
            }
        });
    }

    private void initViews() {
        sympNumber = findViewById(R.id.SYMP_NUM);
        adminAil = findViewById(R.id.ADMIN_AIL);
        adminSympt = findViewById(R.id.ADMIN_SYMP);
        ailNumber = findViewById(R.id.AIL_NUM);
        userNumber = findViewById(R.id.USERS_NUM);
        constraintSymptoms = findViewById(R.id.cardView2);
        constraintAilment = findViewById(R.id.cardView3);
        constraintAssociation = findViewById(R.id.cardView4);
        constraintLogOut = findViewById(R.id.cardView5);
        constraintWeightFactor = findViewById(R.id.cardViewWeightFactor);
    }

    private void ShowAddSymptoms() {
        builderSympt = new AlertDialog.Builder(this);
        builderSympt.setTitle("Προσθήκη Συμπτωματος");

        linearLayout = new LinearLayout(this);
        linearLayout.setOrientation(LinearLayout.VERTICAL);

        characteristicNameEditText = new EditText(this);
        characteristicNameEditText.setHint("Όνομα Συμπτωματος");

        linearLayout.addView(characteristicNameEditText);

        builderSympt.setView(linearLayout);

        builderSympt.setPositiveButton("Προσθήκη", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                if (characteristicNameEditText.getText().toString().isEmpty()) {
                    Toast.makeText(getApplicationContext(),
                            "Πρέπει να συμπληρωθεί το όνομα της αρρώατιας",
                            Toast.LENGTH_SHORT).show();
                } else {
                    SaveSymptomsToDatabase(characteristicNameEditText.getText().toString());
                    Toast.makeText(AdminPanel.this,
                            "Επιτυχής καταχώριση", Toast.LENGTH_SHORT).show();
                }
            }
        });

        builderSympt.setNegativeButton("Ακύρωση", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        builderSympt.show();
    }

    private void SaveSymptomsToDatabase(String SymptomName) {
        DatabaseReference myRef = database.getReference("Admin Symptoms");
        myRef.child(SymptomName).setValue(SymptomName);
    }

    private void ShowAddAilment() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Προσθήκη Πάθησης");

        LinearLayout linearLayout = new LinearLayout(this);
        linearLayout.setOrientation(LinearLayout.VERTICAL);

        EditText ailmentNameEditText = new EditText(this);
        ailmentNameEditText.setHint("Προσθέστε την Πάθηση");
        linearLayout.addView(ailmentNameEditText);

        builder.setView(linearLayout);

        builder.setPositiveButton("Καταχώριση Πάθησης", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                if (ailmentNameEditText.getText().toString().isEmpty()) {
                    Toast.makeText(getApplicationContext(),
                            "Πρέπει να συμπληρωθεί το όνομα της πάθησης",
                            Toast.LENGTH_SHORT).show();
                } else {
                    SaveAilmentToDatabase(ailmentNameEditText.getText().toString());
                }
            }
        });

        builder.setNegativeButton("Ακύρωση", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        builder.show();
    }

    private void SaveAilmentToDatabase(String ailmentName) {
        DatabaseReference myRef = database.getReference("Admin Ailment");
        myRef.push().setValue(ailmentName);
    }

    private void ShowWeightFactorDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Ρύθμιση Παραγόντων Διάγνωσης");

        // Inflate the custom dialog layout
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_admin_panel_settings, null);

        // Find views from the XML
        android.widget.Spinner weightFactorSpinner = dialogView.findViewById(R.id.spinnerWeightFactor);
        EditText customWeightFactorEditText = dialogView.findViewById(R.id.etCustomWeightFactor);
        TextInputEditText highThresholdEditText = dialogView.findViewById(R.id.etHighThreshold);
        TextInputEditText moderateThresholdEditText = dialogView.findViewById(R.id.etModerateThreshold);
        TextView livePreviewTextView = dialogView.findViewById(R.id.tvLivePreview);

        // Set up spinner
        String[] percentageOptions = {"5%", "10%", "15%", "20%", "Προσαρμοσμένο"};
        android.widget.ArrayAdapter<String> adapter = new android.widget.ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item, percentageOptions);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        weightFactorSpinner.setAdapter(adapter);

        // Load current values
        loadCurrentWeightFactorAndThresholds(weightFactorSpinner, customWeightFactorEditText,
                highThresholdEditText, moderateThresholdEditText);

        // Spinner listener to show/hide custom EditText
        weightFactorSpinner.setOnItemSelectedListener
                (new android.widget.AdapterView.OnItemSelectedListener() {
                    @Override
                    public void onItemSelected(android.widget.AdapterView<?> parent,
                                               View view, int position, long id) {
                        if (position == 4) { // "Προσαρμοσμένο" selected
                            customWeightFactorEditText.setVisibility(View.VISIBLE);
                        } else {
                            customWeightFactorEditText.setVisibility(View.GONE);
                        }
                        updateLivePreview(weightFactorSpinner, customWeightFactorEditText,
                                highThresholdEditText, moderateThresholdEditText, livePreviewTextView);
                    }

                    @Override
                    public void onNothingSelected(android.widget.AdapterView<?> parent) {
                    }
                });

        // Add text watchers for live preview
        TextWatcher textWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateLivePreview(weightFactorSpinner, customWeightFactorEditText,
                        highThresholdEditText, moderateThresholdEditText, livePreviewTextView);
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        };

        customWeightFactorEditText.addTextChangedListener(textWatcher);
        highThresholdEditText.addTextChangedListener(textWatcher);
        moderateThresholdEditText.addTextChangedListener(textWatcher);

        builder.setView(dialogView);

        builder.setPositiveButton("Αποθήκευση Όλων", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                // Validate Weight Factor
                String selectedWeightFactor;
                int spinnerPosition = weightFactorSpinner.getSelectedItemPosition();

                if (spinnerPosition == 4) { // Custom option
                    String customValue = customWeightFactorEditText.getText().toString().trim();
                    if (customValue.isEmpty()) {
                        Toast.makeText(AdminPanel.this,
                                "Παρακαλώ εισάγετε παράγοντα βαρύτητας", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    try {
                        int percentage = Integer.parseInt(customValue);
                        if (percentage < 1 || percentage > 100) {
                            Toast.makeText(AdminPanel.this, "Ο παράγοντας βαρύτητας πρέπει να είναι μεταξύ 1-100", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        selectedWeightFactor = percentage + "%";
                    } catch (NumberFormatException e) {
                        Toast.makeText(AdminPanel.this, "Παρακαλώ εισάγετε έγκυρο αριθμό για παράγοντα βαρύτητας", Toast.LENGTH_SHORT).show();
                        return;
                    }
                } else {
                    selectedWeightFactor = percentageOptions[spinnerPosition];
                }

                // Validate Match Thresholds
                String highValue = highThresholdEditText.getText().toString().trim();
                String moderateValue = moderateThresholdEditText.getText().toString().trim();

                if (highValue.isEmpty() || moderateValue.isEmpty()) {
                    Toast.makeText(AdminPanel.this, "Παρακαλώ συμπληρώστε όλα τα όρια αντιστοίχισης", Toast.LENGTH_SHORT).show();
                    return;
                }

                try {
                    int highPercentage = Integer.parseInt(highValue);
                    int moderatePercentage = Integer.parseInt(moderateValue);
                    int weightFactorInt = Integer.parseInt(selectedWeightFactor.replace("%",
                            ""));

                    // Validation checks
                    if (highPercentage < 1 || highPercentage > 100 ||
                            moderatePercentage < 1 || moderatePercentage > 100) {
                        Toast.makeText(AdminPanel.this,
                                "Τα ποσοστά πρέπει να είναι μεταξύ 1-100",
                                Toast.LENGTH_SHORT).show();
                        return;
                    }

                    if (moderatePercentage >= highPercentage) {
                        Toast.makeText(AdminPanel.this,
                                "Η υψηλή αντιστοίχιση πρέπει να είναι μεγαλύτερη από τη μέτρια",
                                Toast.LENGTH_SHORT).show();
                        return;
                    }

                    if (weightFactorInt >= moderatePercentage) {
                        Toast.makeText(AdminPanel.this,
                                "Η μέτρια αντιστοίχιση πρέπει να είναι μεγαλύτερη" +
                                        " από τον παράγοντα βαρύτητας",
                                Toast.LENGTH_SHORT).show();
                        return;
                    }

                    // Save all values to Firebase
                    saveAllSettingsToFirebase(selectedWeightFactor, highPercentage, moderatePercentage);

                } catch (NumberFormatException e) {
                    Toast.makeText(AdminPanel.this, "Παρακαλώ εισάγετε έγκυρους αριθμούς", Toast.LENGTH_SHORT).show();
                }
            }
        });

        builder.setNegativeButton("Ακύρωση", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        builder.show();
    }

    private void loadCurrentWeightFactorAndThresholds
            (android.widget.Spinner spinner, EditText customEditText,
             TextInputEditText highEditText, TextInputEditText moderateEditText) {
        weightFactorRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                // Load Weight Factor
                if (snapshot.child("weightFactor").exists()) {
                    String currentValue = snapshot.child("weightFactor").getValue(String.class);

                    // Set spinner to current value
                    String[] options = {"5%", "10%", "15%", "20%", "Προσαρμοσμένο"};
                    for (int i = 0; i < options.length - 1; i++) {
                        if (options[i].equals(currentValue)) {
                            spinner.setSelection(i);
                            break;
                        }
                    }
                    // If not in preset options, set to custom
                    boolean isCustom = true;
                    for (int i = 0; i < options.length - 1; i++) {
                        if (options[i].equals(currentValue)) {
                            isCustom = false;
                            break;
                        }
                    }
                    if (isCustom) {
                        spinner.setSelection(4);
                        customEditText.setVisibility(View.VISIBLE);
                        customEditText.setText(currentValue.replace("%", ""));
                    }
                } else {
                    spinner.setSelection(2); // Default to 15%
                }

                // Load High Threshold
                if (snapshot.child("highMatchThreshold").exists()) {
                    String value = snapshot.child("highMatchThreshold").getValue().toString();
                    highEditText.setText(value.replace("%", ""));
                } else {
                    highEditText.setText("70"); // Default
                }

                // Load Moderate Threshold
                if (snapshot.child("moderateMatchThreshold").exists()) {
                    String value = snapshot.child("moderateMatchThreshold").getValue().toString();
                    moderateEditText.setText(value.replace("%", ""));
                } else {
                    moderateEditText.setText("40"); // Default
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(AdminPanel.this, "Σφάλμα φόρτωσης δεδομένων", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateLivePreview
            (android.widget.Spinner weightFactorSpinner, EditText customWeightFactorEditText,
             TextInputEditText highEditText, TextInputEditText moderateEditText, TextView livePreviewTextView) {
        try {
            // Get weight factor
            int weightFactor;
            int spinnerPosition = weightFactorSpinner.getSelectedItemPosition();
            if (spinnerPosition == 4) { // Custom
                String customValue = customWeightFactorEditText.getText().toString().trim();
                if (customValue.isEmpty()) return;
                weightFactor = Integer.parseInt(customValue);
            } else {
                String[] options = {"5%", "10%", "15%", "20%", "Προσαρμοσμένο"};
                weightFactor = Integer.parseInt(options[spinnerPosition].replace("%", ""));
            }

            // Get thresholds
            String highText = highEditText.getText().toString().trim();
            String moderateText = moderateEditText.getText().toString().trim();

            if (highText.isEmpty() || moderateText.isEmpty()) return;

            int highThreshold = Integer.parseInt(highText);
            int moderateThreshold = Integer.parseInt(moderateText);

            // Update live preview
            String preview = String.format("Χαμηλή: %d%%-%d%%, Μέτρια: %d%%-%d%%, Υψηλή: %d%%+",
                    weightFactor, moderateThreshold - 1,
                    moderateThreshold, highThreshold - 1,
                    highThreshold);
            livePreviewTextView.setText(preview);

        } catch (NumberFormatException e) {
            // Ignore invalid input during typing
        }
    }

    private void saveAllSettingsToFirebase(String weightFactor, int highThreshold, int moderateThreshold) {
        // Create a simple, clean structure
        HashMap<String, Object> allSettings = new HashMap<>();
        allSettings.put("weightFactor", weightFactor);
        allSettings.put("highMatchThreshold", highThreshold + "%");
        allSettings.put("moderateMatchThreshold", moderateThreshold + "%");

        // Save everything at once - clean and simple
        weightFactorRef.updateChildren(allSettings)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(AdminPanel.this,
                            "Όλες οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!\n" +
                                    "Παράγοντας Βαρύτητας: " + weightFactor + "\n" +
                                    "Υψηλή: " + highThreshold + "%\n" +
                                    "Μέτρια: " + moderateThreshold + "%",
                            Toast.LENGTH_LONG).show();

                    android.util.Log.d("AdminPanel", "All settings saved - WeightFactor: " + weightFactor +
                            ", High: " + highThreshold + "%, Moderate: " + moderateThreshold + "%");
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(AdminPanel.this, "Σφάλμα αποθήκευσης ρυθμίσεων", Toast.LENGTH_SHORT).show();
                    android.util.Log.e("AdminPanel", "Error saving settings: " + e.getMessage());
                });
    }
}