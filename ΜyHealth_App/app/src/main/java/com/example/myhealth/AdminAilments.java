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

public class AdminAilments extends AppCompatActivity {
    private RecyclerView recyclerOfEditingAilments;
    private MyAilmentsAdapter adapter;
    private List<String> ailmetnsData = new ArrayList<>();
    private List<String> dataListKeys = new ArrayList<>();
    public String AdminAilmetns= "Admin Ailment";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_ailments);
        initViews();
        loadData();
        adapter = new MyAilmentsAdapter(ailmetnsData,dataListKeys,
                AdminAilments.this,AdminAilmetns,0);
        recyclerOfEditingAilments.setAdapter(adapter);
    }

    private void initViews() {
        recyclerOfEditingAilments= findViewById(R.id.recyclerOfEditingAilments);
        recyclerOfEditingAilments.setHasFixedSize(true);
        recyclerOfEditingAilments.setLayoutManager(new LinearLayoutManager(this));

    }
    private void loadData() {
        DatabaseReference refAilment = FirebaseDatabase.getInstance().getReference(AdminAilmetns);
        refAilment.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                ailmetnsData.clear();
                dataListKeys.clear();
                for (DataSnapshot postSnapshot : dataSnapshot.getChildren()) {
                    String data = postSnapshot.getValue(String.class);
                    String key = postSnapshot.getKey();
                    ailmetnsData.add(data);
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