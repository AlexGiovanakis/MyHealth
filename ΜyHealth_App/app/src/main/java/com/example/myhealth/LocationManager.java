package com.example.myhealth;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Looper;
import android.widget.TextView;

import androidx.core.app.ActivityCompat;

import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.SettingsClient;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

public class LocationManager {
    private Context context;
    private FusedLocationProviderClient locationClient;
    private TextView locationTextView;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;

    private static final int REQUEST_LOCATION_PERMISSION = 101; // Ορίζουμε την σταθερά για το αίτημα άδειας
    private static final int REQUEST_CHECK_SETTINGS = 102; // Κωδικός αιτήματος για τον έλεγχο ρυθμίσεων

    private double latitude;
    private double longitude ;
    public LocationManager(Context context, TextView locationTextView) {
        this.context = context;
        this.locationClient = LocationServices.getFusedLocationProviderClient(context);
        this.locationTextView = locationTextView;
        createLocationRequest();
        setupLocationCallback();
    }

    private void createLocationRequest() {
        locationRequest = LocationRequest.create();
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setInterval(10000);
        locationRequest.setFastestInterval(5000);
    }

    private void setupLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult != null && !locationResult.getLocations().isEmpty()) {
                    Location location = locationResult.getLocations().get(0);
                    updateLocationText(location);
                }
            }
        };
    }

    public void checkLocationSettingsAndStartUpdates() {
        if (ActivityCompat.checkSelfPermission(context,
                Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions((Activity) context,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, REQUEST_LOCATION_PERMISSION);
            return;
        }

        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest);

        SettingsClient client = LocationServices.getSettingsClient(context);
        client.checkLocationSettings(builder.build())
                .addOnSuccessListener(locationSettingsResponse -> startLocationUpdates())
                .addOnFailureListener(e -> {
                    if (e instanceof ResolvableApiException) {
                        try {
                            ResolvableApiException resolvable = (ResolvableApiException) e;
                            resolvable.startResolutionForResult((Activity) context,
                                    REQUEST_CHECK_SETTINGS);
                        } catch (IntentSender.SendIntentException sendEx) {
                            // Ignore the error.
                        }
                    }
                });
    }

    public void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
        }
    }

    public void stopLocationUpdates() {
        locationClient.removeLocationUpdates(locationCallback);
    }



    private void updateLocationText(Location location) {
        Geocoder geocoder = new Geocoder(context, Locale.getDefault());
        List<Address> addresses;
        try {
            addresses = geocoder.getFromLocation(location.getLatitude(),
                    location.getLongitude(), 1);
            if (addresses != null && !addresses.isEmpty()) {
                String city = addresses.get(0).getLocality();
                locationTextView.setText(city);

                longitude=location.getLongitude();
                latitude=location.getLatitude();
            }
        } catch (IOException e) {
            locationTextView.setText("Unknown location");
        }
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}