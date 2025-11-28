package com.example.myhealth;

import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
public class MapSickness extends AppCompatActivity implements OnMapReadyCallback,
        GoogleMap.OnMarkerClickListener {

    private GoogleMap mMap;
    private DatabaseReference database = FirebaseDatabase.getInstance().getReference("Results");
    private HashMap<String, Map<String, Integer>> locationAilmentsMap = new HashMap<>();
    private HashMap<String, LatLng> locationDetailsMap = new HashMap<>();
    private HashMap<String, Marker> markerMap = new HashMap<>();
    private HashMap<String, List<AilmentInfo>> locationDetailedAilmentsMap = new HashMap<>();

    // NESTED CLASS FOR AILMENT INFORMATION
    public static class AilmentInfo {
        public String name;
        public double matchPercentage;
        public String confidenceLevel;

        public AilmentInfo(String name, double matchPercentage, String confidenceLevel) {
            this.name = name;
            this.matchPercentage = matchPercentage;
            this.confidenceLevel = confidenceLevel;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_map_sickness);

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }
    }

    private void addMarkersFromDatabase() {
        database.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if (dataSnapshot.exists()) {
                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                        // Get location data - same structure as before
                        Double latValue = snapshot.child("Location Details").
                                child("latitude").getValue(Double.class);
                        Double lngValue = snapshot.child("Location Details").
                                child("longitude").getValue(Double.class);
                        String locationTitle = snapshot.child("Location Details").
                                child("city").getValue(String.class);

                        if (latValue == null || lngValue == null || locationTitle == null) {
                            Log.w("MapSickness",
                                    "Skipping entry with missing location data for key: "
                                            + snapshot.getKey());
                            continue;
                        }

                        double latitude = latValue;
                        double longitude = lngValue;
                        LatLng location = new LatLng(latitude, longitude);
                        locationDetailsMap.put(locationTitle, location);

                        // Get detailed ailment information - NEW STRUCTURE
                        List<AilmentInfo> detailedAilments = locationDetailedAilmentsMap.getOrDefault(locationTitle, new ArrayList<>());
                        Map<String, Integer> ailmentCounts = locationAilmentsMap.getOrDefault(locationTitle, new HashMap<>());

                        if (snapshot.child("DetailedAilments").exists()) {
                            // NEW: Ailments are now keyed by ailment name, not numeric indices
                            for (DataSnapshot ailmentSnapshot : snapshot.child("DetailedAilments").getChildren()) {
                                String ailmentName = ailmentSnapshot.getKey(); // This is now the ailment name
                                Double matchPercentage = ailmentSnapshot.child("matchPercentage").getValue(Double.class);
                                String confidenceLevel = ailmentSnapshot.child("confidenceLevel").getValue(String.class);

                                if (ailmentName != null && matchPercentage != null) {
                                    // Add to detailed list
                                    detailedAilments.add(new AilmentInfo(
                                            ailmentName,
                                            matchPercentage,
                                            confidenceLevel != null ? confidenceLevel : "Unknown"
                                    ));

                                    // Keep count for marker title
                                    ailmentCounts.put(ailmentName, ailmentCounts.getOrDefault(ailmentName, 0) + 1);
                                }
                            }
                        }

                        locationDetailedAilmentsMap.put(locationTitle, detailedAilments);
                        locationAilmentsMap.put(locationTitle, ailmentCounts);

                        // Add/update marker with better title
                        Marker marker;
                        String markerTitle = locationTitle + " (" + ailmentCounts.size() + " τύποι παθήσεων)";

                        if (markerMap.containsKey(locationTitle)) {
                            marker = markerMap.get(locationTitle);
                            marker.setPosition(location);
                            marker.setTitle(markerTitle);
                        } else {
                            marker = mMap.addMarker(new MarkerOptions()
                                    .position(location)
                                    .title(markerTitle));
                            markerMap.put(locationTitle, marker);
                        }
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
                Log.e("MapSickness", "Database error: " + databaseError.getMessage());
            }
        });
    }

    @Override
    public void onMapReady(@NonNull GoogleMap googleMap) {
        mMap = googleMap;
        mMap.setMaxZoomPreference(13.0f);

        // Add simple UI controls
        mMap.getUiSettings().setZoomControlsEnabled(true);
        mMap.getUiSettings().setCompassEnabled(true);

        addMarkersFromDatabase();
        mMap.setOnMarkerClickListener(this);
    }

    @Override
    public boolean onMarkerClick(Marker marker) {
        String locationTitle = marker.getTitle().split(" \\(")[0];
        List<AilmentInfo> detailedAilments = locationDetailedAilmentsMap.get(locationTitle);

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("📍 Παθήσεις για " + locationTitle);
        if (detailedAilments != null && !detailedAilments.isEmpty()) {
            StringBuilder ailmentsStr = new StringBuilder();
            ailmentsStr.append("📊 Αναφορές Παθήσεων:\n\n");
            // Group by ailment name and show simplified details
            Map<String, List<AilmentInfo>> groupedAilments = new HashMap<>();
            for (AilmentInfo info : detailedAilments) {
                if (!groupedAilments.containsKey(info.name)) {
                    groupedAilments.put(info.name, new ArrayList<>());
                }
                groupedAilments.get(info.name).add(info);
            }

            for (Map.Entry<String, List<AilmentInfo>> entry : groupedAilments.entrySet()) {
                String ailmentName = entry.getKey();
                List<AilmentInfo> instances = entry.getValue();

                // Calculate average match percentage
                double avgPercentage = 0.0;
                for (AilmentInfo info : instances) {
                    avgPercentage += info.matchPercentage;
                }
                avgPercentage = avgPercentage / instances.size();

                ailmentsStr.append("• ").append(ailmentName)
                        .append(" (").append(instances.size()).append(" περιστατικά")
                        .append(" - ").append(String.format("%.0f%%", avgPercentage)).append(")\n");
            }

            // Add confidence summary
            ailmentsStr.append("\n📈 Επίπεδα Εμπιστοσύνης:\n");
            Map<String, Integer> confidenceCounts = new HashMap<>();
            for (AilmentInfo info : detailedAilments) {
                confidenceCounts.put(info.confidenceLevel,
                        confidenceCounts.getOrDefault(info.confidenceLevel, 0) + 1);
            }

            for (Map.Entry<String, Integer> entry : confidenceCounts.entrySet()) {
                ailmentsStr.append("• ").append(entry.getKey()).append(": ")
                        .append(entry.getValue()).append(" περιστατικά\n");
            }

            builder.setMessage(ailmentsStr.toString());
        } else {
            builder.setMessage("Δεν βρέθηκαν παθήσεις για αυτή την τοποθεσία.");
        }

        builder.setPositiveButton("OK", (dialog, which) -> {
            dialog.dismiss();
            mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(marker.getPosition(), 11.0f));

        });

        AlertDialog dialog = builder.create();
        dialog.show();
        return true;
    }
}