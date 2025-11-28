package com.example.myhealth;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class Statistics extends AppCompatActivity {
    protected TextView totalEntries, entriesLastWeek, regionMostEntries, regionLeastEntries,txvMoreStatistics;
    DatabaseReference database = FirebaseDatabase.getInstance().getReference("Results");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_statistics);

        initViews();
        checkRealtime();
        setupMoreStatisticsButton();
    }

    private void initViews() {
        totalEntries = findViewById(R.id.total_entries);
        entriesLastWeek = findViewById(R.id.entries_last_week);
        regionMostEntries = findViewById(R.id.region_most_entries);
        regionLeastEntries = findViewById(R.id.region_least_entries);
        txvMoreStatistics = findViewById(R.id.tv_more_statistics);
    }


    private void setupMoreStatisticsButton() {
        txvMoreStatistics.setOnClickListener(v -> {
            String statisticsUrl = "https://myhealth-4533b.web.app/";
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(statisticsUrl));
                startActivity(Intent.createChooser(browserIntent, "Open with"));
            } catch (Exception e) {
                // Handle case where no browser is available
                e.printStackTrace();
            }
        });
    }

    private void checkRealtime() {
        Query query = database;
        query.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                int totalEntriesCount = (int) snapshot.getChildrenCount();
                SimpleDateFormat sdf = new SimpleDateFormat
                        ("dd/MM/yyyy", Locale.getDefault());
                Calendar calendar = Calendar.getInstance();
                Date today = calendar.getTime();
                calendar.add(Calendar.DAY_OF_YEAR, -7);
                Date oneWeekAgo = calendar.getTime();

                int lastWeekCount = 0;
                HashMap<String, Integer> locationCountMap = new HashMap<>();

                for (DataSnapshot childSnapshot : snapshot.getChildren()) {
                    // NEW STRUCTURE: Check for SelectedDate directly under the result
                    if (childSnapshot.hasChild("SelectedDate")) {
                        String dateString = childSnapshot.child("SelectedDate")
                                .getValue(String.class);
                        try {
                            Date date = sdf.parse(dateString);
                            if (date != null && date.after(oneWeekAgo) && date.before(today)) {
                                lastWeekCount++;
                            }
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }
                    }

                    // NEW STRUCTURE: Location is now under "Location Details/city"
                    DataSnapshot locationDetails = childSnapshot.child("Location Details");
                    if (locationDetails.hasChild("city")) {
                        String location = locationDetails.child("city").getValue(String.class);
                        if (location != null && !location.isEmpty()) {
                            Integer count = locationCountMap.get(location);
                            if (count == null) {
                                count = 0;
                            }
                            locationCountMap.put(location, count + 1);
                        }
                    }
                }

                // Finding the location with the most and least entries
                String mostFrequentLocation = null;
                int maxCount = 0;
                String leastFrequentLocation = null;
                int minCount = Integer.MAX_VALUE;

                for (Map.Entry<String, Integer> entry : locationCountMap.entrySet()) {
                    if (entry.getValue() > maxCount) {
                        maxCount = entry.getValue();
                        mostFrequentLocation = entry.getKey();
                    }
                    if (entry.getValue() < minCount) {
                        minCount = entry.getValue();
                        leastFrequentLocation = entry.getKey();
                    }
                }

                // Update UI with Greek text (properly encoded)
                totalEntries.setText
                        ("Συνολικές Καταχωρήσεις: " + "\n" + totalEntriesCount);
                entriesLastWeek.setText
                        ("Καταχωρήσεις την τελευταία εβδομάδα: " + "\n" + lastWeekCount);

                if (mostFrequentLocation != null && leastFrequentLocation != null && minCount > 0) {
                    regionMostEntries.setText
                            ("Περιοχή με τις περισσότερες καταχωρήσεις: " + "\n"
                                    + mostFrequentLocation + " (" + maxCount + ")");
                    regionLeastEntries.setText
                            ("Περιοχή με τις λιγότερες καταχωρήσεις: " + "\n"
                                    + leastFrequentLocation + " (" + minCount + ")");
                } else {
                    regionMostEntries.setText("Δεν υπάρχουν καταχωρήσεις τοποθεσίας");
                    regionLeastEntries.setText("Δεν υπάρχουν καταχωρήσεις τοποθεσίας");
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                // Handle error case
            }
        });
    }
}