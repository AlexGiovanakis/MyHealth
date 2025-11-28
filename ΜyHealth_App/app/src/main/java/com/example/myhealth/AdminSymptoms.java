package com.example.myhealth;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.List;

public class AdminSymptoms extends AppCompatActivity {
    private RecyclerView recyclerOfEditingSymptoms;
    private MyAilmentsAdapter adapter;
    private List<String> SymptomsData = new ArrayList<>();
    private List<String> dataListKeys = new ArrayList<>();
    public String AdminSymptoms = "Admin Symptoms";
    @Override

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_symptoms);
        initViews();
        loadData();
        adapter = new MyAilmentsAdapter(SymptomsData, dataListKeys,
                AdminSymptoms.this, AdminSymptoms, 1);
        recyclerOfEditingSymptoms.setAdapter(adapter);
    }

    private void initViews() {
        recyclerOfEditingSymptoms = findViewById(R.id.recyclerOfEditingSymptoms);
        recyclerOfEditingSymptoms.setHasFixedSize(true);
        recyclerOfEditingSymptoms.setLayoutManager(new LinearLayoutManager(this));

    }
    private void loadData() {
        DatabaseReference refSymptoms = FirebaseDatabase.getInstance().getReference(AdminSymptoms);
        refSymptoms.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                SymptomsData.clear();
                dataListKeys.clear();
                for (DataSnapshot postSnapshot : dataSnapshot.getChildren()) {
                    String data = postSnapshot.getValue(String.class);
                    String key = postSnapshot.getKey();
                    SymptomsData.add(data);
                    dataListKeys.add(key);
                }
                adapter.notifyDataSetChanged();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                // Εδώ μπορείτε να χειριστείτε τυχόν σφάλματα
            }
        });
    }
}