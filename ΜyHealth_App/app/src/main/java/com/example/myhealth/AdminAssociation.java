package com.example.myhealth;

import android.content.DialogInterface;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AdminAssociation extends AppCompatActivity {

    private static final String ASSOCIATION_REF = "Admin Association";
    private static final String AILMENT_REF = "Admin Ailment";
    private static final String SYMPTOMS_REF = "Admin Symptoms";

    private final DatabaseReference refAssociation = FirebaseDatabase.getInstance().getReference(ASSOCIATION_REF);
    private final DatabaseReference refAilment = FirebaseDatabase.getInstance().getReference(AILMENT_REF);
    private final DatabaseReference refSypmtoms = FirebaseDatabase.getInstance().getReference(SYMPTOMS_REF);

    private RecyclerView recyclerAssotioanAilmentCount, recyclerAddBtn;
    private MyAssociatonAdapter adapter, addingAdapter;
    private MyAssociationArrayAdapter arrayAdapter;
    private RecyclerView.LayoutManager layoutManager, addinglayoutManager;
    private Button btnAdd, btnEdit, btnDelete, btnAddSymptoms, btnCancelSymptoms, btnSaveSymptoms, btnCancelList;
    private ConstraintLayout firestSetOfButons, secondSetOfButons, thirdSetOfButons;

    private List<String> associationList = new ArrayList<>();
    private List<String> associationShownList = new ArrayList<>();
    private List<String> ailmentList = new ArrayList<>();
    private List<String> filteredAilmentList = new ArrayList<>();

    private List<String> symptomsList = new ArrayList<>();
    private List<String> symptomsSelectedList = new ArrayList<>();
    private List<String> oldSymptomsSelectedList;
    private String clickedItemSetOne, clickedItemSetTwo;
    private ListView listViewSymptoms;
    // Flag to indicate if currently viewing full ailment list or filtered
    private byte btnAddSymptomsChoice = 0;
    private TextView textAssociaton, textAssociaton2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_assotiaton);

        initViews();
        loadAssociationData();

        btnAdd.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                filterAilments();
                addingAdapter = new MyAssociatonAdapter(filteredAilmentList);
                recyclerAddBtn.setAdapter(addingAdapter);
                recyclerAddBtn.setVisibility(View.VISIBLE);
                ChangeTexts();
                btnEdit.setEnabled(false);
                btnDelete.setEnabled(false);
                addingAdapter.setOnItemClickListener
                        (new MyAssociatonAdapter.OnItemClickListener() {
                    @Override
                    public void onItemClick(int position2) {
                        clickedItemSetTwo = filteredAilmentList.get(position2);
                        Toast.makeText(AdminAssociation.this,
                                "Clicked item: " + clickedItemSetTwo,
                                Toast.LENGTH_SHORT).show();
                        secondSetOfButons.setVisibility(View.VISIBLE);
                        btnAddSymptomsChoice = 0;

                    }
                }
                );
            }
        });
        btnEdit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Αρχικοποίηση του addingAdapter πριν την κλήση της μεθόδου setOnItemClickListener
                List<String> list = new ArrayList<>();
                list.add(clickedItemSetOne);
                addingAdapter = new MyAssociatonAdapter(list);
                recyclerAddBtn.setAdapter(addingAdapter);
                recyclerAddBtn.setVisibility(View.VISIBLE);
                btnAddSymptomsChoice = 1;
                ChangeTexts();
                addingAdapter.setOnItemClickListener(new MyAssociatonAdapter.OnItemClickListener() {
                    @Override
                    public void onItemClick(int position2) {
                        clickedItemSetOne = list.get(position2);
                        Toast.makeText(AdminAssociation.this, "Clicked item: " + clickedItemSetOne, Toast.LENGTH_SHORT).show();
                        secondSetOfButons.setVisibility(View.VISIBLE);
                    }
                });
            }
        });
        btnDelete.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Δημιουργία ενός διαλόγου επιβεβαίωσης
                AlertDialog dialog = new AlertDialog.Builder(AdminAssociation.this)
                        .setTitle("Διαγραφή συσχέτισης")
                        .setMessage("Είστε βέβαιος για τη διαγραφή της συσχέτισης " + clickedItemSetOne + " ;")
                        .setPositiveButton("Ναι", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                // Αν ο χρήστης πατήσει "Ναι", διαγράψτε τη συσχέτιση
                                DatabaseReference ref = FirebaseDatabase.getInstance().getReference("Admin Association").child(clickedItemSetOne);
                                ref.removeValue();
                                loadAssociationData();
                                Toast.makeText(AdminAssociation.this, "Η συσχέτιση διαγράφηκε επιτυχώς", Toast.LENGTH_SHORT).show();
                            }
                        })
                        .setNegativeButton("Όχι", null)
                        .show();
                Button positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
                positiveButton.setTextColor(Color.parseColor("#FF0000")); // Κόκκινο χρώμα

                // Αλλαγή του χρώματος του κουμπιού "Όχι"
                Button negativeButton = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
                negativeButton.setTextColor(Color.parseColor("#0000FF")); // Μπλε χρώμα

            }
        });


        btnAddSymptoms.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                loadSymptomsData();
                if (btnAddSymptomsChoice == 0) {
                    arrayAdapter = new MyAssociationArrayAdapter(AdminAssociation.this, symptomsList);
                    listViewSymptoms.setAdapter(arrayAdapter);
                    listViewSymptoms.setVisibility(View.VISIBLE);

                    listViewSymptoms.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                        @Override
                        public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                            CheckedTextView v = (CheckedTextView) view;
                            boolean currentCheck = v.isChecked();
                            String selectedItem = symptomsList.get(position);
                            thirdSetOfButons.setVisibility(View.VISIBLE);
                            if (currentCheck) {
                                symptomsSelectedList.add(selectedItem);
                                // If the item is already selected, remove it from the selected items list
                            } else {
                                // If the item is not selected, add it to the selected items list
                                symptomsSelectedList.remove(selectedItem);
                            }
                            // Update the TextView with the selected items
                            //   selectedItemsTextView.setText("Επιλεγμένα συμπτώματα: " + symptomsSelectedList);
                        }
                    });
                }
                else if (btnAddSymptomsChoice == 1) {
                    DatabaseReference refSymptoms = FirebaseDatabase.getInstance().getReference(ASSOCIATION_REF).child(clickedItemSetOne);
                    refSymptoms.addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot dataSnapshot) {
                            symptomsSelectedList.clear();

                            if (oldSymptomsSelectedList != null) {
                                oldSymptomsSelectedList.clear();
                            } else {
                                oldSymptomsSelectedList = new ArrayList<>();
                            }

                            Set<String> selectedSymptomNames = new HashSet<>();

                            for (DataSnapshot symptomSnapshot : dataSnapshot.getChildren()) {
                                String fullEntry = symptomSnapshot.getValue(String.class);
                                if (fullEntry == null || fullEntry.trim().isEmpty()) continue;

                                symptomsSelectedList.add(fullEntry); // e.g., "Πόνος|5"

                                // Extract just the symptom name
                                String symptomName = fullEntry.contains("|")
                                        ? fullEntry.split("\\|")[0].trim()
                                        : fullEntry.trim();

                                selectedSymptomNames.add(symptomName);
                            }

                            oldSymptomsSelectedList = new ArrayList<>(symptomsSelectedList);

                            arrayAdapter = new MyAssociationArrayAdapter(AdminAssociation.this, symptomsList);
                            listViewSymptoms.setAdapter(arrayAdapter);
                            listViewSymptoms.setVisibility(View.VISIBLE);

                            // Highlight the selected symptoms
                            for (int i = 0; i < symptomsList.size(); i++) {
                                String symptom = symptomsList.get(i);
                                if (selectedSymptomNames.contains(symptom)) {
                                    listViewSymptoms.setItemChecked(i, true);
                                }
                            }

                            arrayAdapter.notifyDataSetChanged();
                            thirdSetOfButons.setVisibility(View.VISIBLE);

                            listViewSymptoms.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                                @Override
                                public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                                    CheckedTextView v = (CheckedTextView) view;
                                    boolean currentCheck = v.isChecked();
                                    String selectedItem = symptomsList.get(position);
                                    thirdSetOfButons.setVisibility(View.VISIBLE);

                                    if (currentCheck) {
                                        // Use default value if added manually
                                        symptomsSelectedList.add(selectedItem + "|1");
                                    } else {
                                        // Remove both "symptom" and any "symptom|value" match
                                        symptomsSelectedList.removeIf(s -> s.equals(selectedItem) || s.startsWith(selectedItem + "|"));
                                    }
                                }
                            });
                        }

                        @Override
                        public void onCancelled(DatabaseError databaseError) {
                            Toast.makeText(AdminAssociation.this, "Σφάλμα φόρτωσης συμπτωμάτων: " + databaseError.getMessage(), Toast.LENGTH_SHORT).show();
                        }
                    });
                }
            }
        });
        btnCancelSymptoms.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                visibilityCheck();
            }
        });
        btnSaveSymptoms.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (btnAddSymptomsChoice == 0) {
                    if (!symptomsSelectedList.isEmpty()) {
                        Map<String, Integer> noPrefillMap = new LinkedHashMap<>();
                        for (String symptom : symptomsSelectedList) {
                            noPrefillMap.put(symptom, 1); // default value
                        }
                        showSymptomInputDialog(noPrefillMap, clickedItemSetTwo);
                    } else {
                        Toast.makeText(AdminAssociation.this, "Δεν έγινε επιτυχήμενη καταχώριση των συμπτωμάτων", Toast.LENGTH_SHORT).show();
                    }
                } else if (btnAddSymptomsChoice == 1) {
                    if (!oldSymptomsSelectedList.equals(symptomsSelectedList)) {
                        Map<String, Integer> prefilledMap = new LinkedHashMap<>();

                        for (String item : symptomsSelectedList) {
                            if (item == null || item.trim().isEmpty()) continue;

                            if (item.contains("|")) {
                                String[] parts = item.split("\\|");
                                String symptom = parts[0].trim();
                                String value = parts.length > 1 ? parts[1].trim() : "1";
                                try {
                                    prefilledMap.put(symptom, Integer.parseInt(value));
                                } catch (NumberFormatException e) {
                                    prefilledMap.put(symptom, 1);
                                }
                            } else {
                                prefilledMap.put(item.trim(), 1);
                            }
                        }

                        showSymptomInputDialog(prefilledMap, clickedItemSetOne);
                    } else {
                        Toast.makeText(AdminAssociation.this, "Δεν έγινε επιτυχήμενη καταχώριση των συμπτωμάτων", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
        btnCancelList.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                thirdSetOfButons.setVisibility(View.INVISIBLE);
                symptomsSelectedList.clear();
                listViewSymptoms.setVisibility(View.INVISIBLE);

            }
        });

    }

    private void initViews() {

        recyclerAssotioanAilmentCount = findViewById(R.id.adminAilmentCount);
        btnAdd = findViewById(R.id.btnAdd);
        btnEdit = findViewById(R.id.btnEdit);
        btnDelete = findViewById(R.id.btnDelete);
        textAssociaton = findViewById(R.id.textAssotiaton);
        textAssociaton2 = findViewById(R.id.textAssotiaton2);
        layoutManager = new LinearLayoutManager(this);
        recyclerAssotioanAilmentCount.setLayoutManager(layoutManager);
        firestSetOfButons = findViewById(R.id.firstSetOfButtons);
        //adding recycler

        recyclerAddBtn = findViewById(R.id.recyclerAddButton);
        addinglayoutManager = new LinearLayoutManager(this);
        recyclerAddBtn.setLayoutManager(addinglayoutManager);
        secondSetOfButons = findViewById(R.id.secondSetOfButtons);

        //adding arraylist
        btnAddSymptoms = findViewById(R.id.btnAddSymptoms);
        btnCancelSymptoms = findViewById(R.id.btnCancelSymptoms);
        listViewSymptoms = findViewById(R.id.listViewSymptoms);
        listViewSymptoms.setChoiceMode(ListView.CHOICE_MODE_MULTIPLE);

        //save symptoms
        thirdSetOfButons = findViewById(R.id.thirdSetOfButtons);
        btnSaveSymptoms = findViewById(R.id.btnSaveList);
        btnCancelList = findViewById(R.id.btnCancelList);
    }

    //Reading data from Admin Association
    private void loadAssociationData() {
        refAssociation.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                associationList.clear();
                associationShownList.clear();

                for (DataSnapshot associationSnapshot : dataSnapshot.getChildren()) {
                    Object value = associationSnapshot.getValue();
                    String key = associationSnapshot.getKey();

                    if (value instanceof List) {
                        List<String> ailmentList = (List<String>) value;
                        associationShownList.add(key);

                        for (String item : ailmentList) {
                            if (item == null || item.trim().isEmpty()) {
                                Log.w("loadAssociationData", "Skipped null or empty item in list");
                                continue;
                            }

                            if (item.contains("|")) {
                                String[] parts = item.split("\\|");
                                String symptom = parts[0].trim();
                                String numberPart = parts.length > 1 ? parts[1].trim() : "";
                                associationList.add(symptom + " (" + numberPart + ")");
                            } else {
                                associationList.add(item.trim());
                            }
                        }

                    } else if (value instanceof String) {
                        String ailment = (String) value;

                        if (ailment == null || ailment.trim().isEmpty()) {
                            Log.w("loadAssociationData", "Skipped null or empty ailment string");
                            continue;
                        }

                        if (ailment.contains("|")) {
                            String[] parts = ailment.split("\\|");
                            String symptom = parts[0].trim();
                            String numberPart = parts.length > 1 ? parts[1].trim() : "";
                            associationList.add(symptom + " (" + numberPart + ")");
                        } else {
                            associationList.add(ailment.trim());
                        }
                    }
                }

                loadAilmentData(); // continue with next logic
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                Toast.makeText(AdminAssociation.this, "Σφάλμα φόρτωσης δεδομένων συσχέτισης: " + databaseError.getMessage(), Toast.LENGTH_SHORT).show();
                Log.e("loadAssociationData", "Firebase load cancelled: " + databaseError.getMessage());
            }
        });
    }

    // reading from Admin Ailment
    private void loadAilmentData() {
        refAilment.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                ailmentList.clear();
                //reading from inside the admin ailment
                for (DataSnapshot ailmentSnapshot : dataSnapshot.getChildren()) {
                    String ailment = ailmentSnapshot.getValue(String.class);
                    ailmentList.add(ailment);
                   /* if (!associationShownList.contains(ailment)){
                        ailmentList.add(ailment);
                    }*/
                }
                // permissible add btn
                if (associationShownList.size() == ailmentList.size()) {
                    btnAdd.setEnabled(false);
                    textAssociaton.setText("Επιλέξτε μια συσχέτιση για τροποποίηση.");
                    Toast.makeText(AdminAssociation.this, "Δεν υπάρχουν παθήσεις για να προσθέσετε συσχέτιση", Toast.LENGTH_LONG).show();
                } else {
                    btnAdd.setEnabled(true);
                    textAssociaton.setText("Επιλέξτε μια συσχέτιση για τροποποίηση ή πατήστε το κουμπί για να προσθέσετε μια.");
                }

                //create and upgrade Recycler
                adapter = new MyAssociatonAdapter(associationShownList);
                recyclerAssotioanAilmentCount.setAdapter(adapter);
                adapter.setOnItemClickListener(new MyAssociatonAdapter.OnItemClickListener() {
                    @Override
                    public void onItemClick(int position) {
                        clickedItemSetOne = associationShownList.get(position);
                        Toast.makeText(AdminAssociation.this, "Clicked item: " + clickedItemSetOne, Toast.LENGTH_SHORT).show();

                        // Ενεργοποίηση των κουμπιών
                        btnEdit.setEnabled(true);
                        btnDelete.setEnabled(true);
                    }
                });
                adapter.notifyDataSetChanged();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                Toast.makeText(AdminAssociation.this, "Σφάλμα φόρτωσης δεδομένων: " + databaseError.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    //not ailments added yet
    private void filterAilments() {
        filteredAilmentList.clear();
        for (String ailment : ailmentList) {
            if (!associationShownList.contains(ailment)) {
                filteredAilmentList.add(ailment);
            }
        }

        // Ενημέρωση recyclerAddBtn με φιλτραρισμένη λίστα


    }

    // reading from Admin Symptoms
    private void loadSymptomsData() {
        refSypmtoms.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                symptomsList.clear();
                //reading from inside the Firebase
                for (DataSnapshot symptomsSnapshot : dataSnapshot.getChildren()) {
                    String symptoms = symptomsSnapshot.getValue(String.class);
                    symptomsList.add(symptoms);
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                Toast.makeText(AdminAssociation.this, "Σφάλμα φόρτωσης δεδομένων συσχέτισης: " + databaseError.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void ChangeTexts() {
        if (btnAddSymptomsChoice == 0) {
            btnAddSymptoms.setText("Προσθήκη συμπτωμάτων");
            btnSaveSymptoms.setText("Καταχώριση συμπτωμάτων");
            btnEdit.setEnabled(false);
            btnDelete.setEnabled(false);
            textAssociaton2.setText("Επιλέξτε την πάθηση που θα προσθέσετε συμπτώματα.");

        } else if (btnAddSymptomsChoice == 1) {
            btnAddSymptoms.setText("Επεξεργασια Συμπτωματων");
            btnSaveSymptoms.setText("Επαναληπτική καταχώριση συμπτωμάτων");
            textAssociaton2.setText("Διαλέξτε την πάθηση της οποίας τα συμπτώματα θέλετε να αλλάξετε.");
            btnAdd.setEnabled(false);
            btnEdit.setEnabled(false);
            btnDelete.setEnabled(false);
        }
    }

    private void visibilityCheck() {
        recyclerAddBtn.setVisibility(View.INVISIBLE);
        secondSetOfButons.setVisibility(View.INVISIBLE);
        thirdSetOfButons.setVisibility(View.INVISIBLE);
        listViewSymptoms.setVisibility(View.INVISIBLE);
        textAssociaton2.setText("");
        loadAssociationData();

    }
    private void showSymptomInputDialog(Map<String, Integer> symptomsWithValues, String firebasePathKey) {
        ScrollView scrollView = new ScrollView(AdminAssociation.this);
        LinearLayout container = new LinearLayout(AdminAssociation.this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setPadding(40, 40, 40, 40);

        Map<String, EditText> symptomInputMap = new HashMap<>();

        for (Map.Entry<String, Integer> entry : symptomsWithValues.entrySet()) {
            String symptom = entry.getKey();
            int prefill = entry.getValue();

            TextView symptomLabel = new TextView(AdminAssociation.this);
            symptomLabel.setText(symptom);
            symptomLabel.setTextSize(16);
            symptomLabel.setPadding(0, 12, 0, 4);

            EditText numberInput = new EditText(AdminAssociation.this);
            numberInput.setHint("Αριθμός (1-99)");
            numberInput.setInputType(InputType.TYPE_CLASS_NUMBER);
            numberInput.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            numberInput.setText(String.valueOf(prefill)); // pre-fill value

            symptomInputMap.put(symptom, numberInput);
            container.addView(symptomLabel);
            container.addView(numberInput);
        }

        scrollView.addView(container);

        AlertDialog.Builder builder = new AlertDialog.Builder(AdminAssociation.this)
                .setTitle("Επιβεβαίωση Συμπτωμάτων")
                .setView(scrollView)
                .setPositiveButton("ΑΠΟΘΗΚΕΥΣΗ", null)
                .setNegativeButton("ΑΚΥΡΩΣΗ", null);

        AlertDialog dialog = builder.create();
        dialog.show();

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            List<String> formattedList = new ArrayList<>();
            int totalSum = 0;

            for (Map.Entry<String, EditText> entry : symptomInputMap.entrySet()) {
                String symptom = entry.getKey();
                EditText input = entry.getValue();

                String numberText = input.getText().toString().trim();
                try {
                    int number = Integer.parseInt(numberText);
                    if (number >= 1 && number <= 99) {
                        totalSum += number;
                        formattedList.add(symptom + "|" + number);
                    }
                } catch (NumberFormatException e) {
                    Log.w("DialogInput", "Invalid number for: " + symptom + " → " + numberText);
                }
            }

            if (totalSum > 99) {
                Toast.makeText(AdminAssociation.this,
                        "Το συνολικό άθροισμα δεν μπορεί να ξεπερνά το 99"
                        , Toast.LENGTH_LONG).show();
                return;
            }

            if (!formattedList.isEmpty()) {
                DatabaseReference refSelectedItems = FirebaseDatabase.getInstance()
                        .getReference("Admin Association")
                        .child(firebasePathKey);

                refSelectedItems.setValue(formattedList);
                symptomsSelectedList.clear();
                Toast.makeText(AdminAssociation.this, "Τα επιλεγμένα συμπτώματα αποθηκεύτηκαν επιτυχώς", Toast.LENGTH_SHORT).show();
                visibilityCheck();
                dialog.dismiss();
            } else {
                Toast.makeText(AdminAssociation.this, "Δεν δόθηκαν έγκυρες τιμές για αποθήκευση", Toast.LENGTH_SHORT).show();
            }
        });
    }

}