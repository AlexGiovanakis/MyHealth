package com.example.myhealth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

public class RegisterActivity extends AppCompatActivity {

    EditText username, password, email, dob;
    DatePicker datePicker1;
    DatabaseReference database;
    RadioButton genderradioButton;
    RadioGroup radioGroup;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
        database = FirebaseDatabase.getInstance().getReference();
        datePicker1 = (DatePicker) findViewById(R.id.datePicker1);
        username = (EditText) findViewById(R.id.username);
        //dob=(EditText) findViewById(R.id.dob);
        password = (EditText) findViewById(R.id.password);
        email = (EditText) findViewById(R.id.email);
        radioGroup = (RadioGroup) findViewById(R.id.radioGroup);
    }

    public void profilSubmit(View view) {
        int selectedId = radioGroup.getCheckedRadioButtonId();
        genderradioButton = (RadioButton) findViewById(selectedId);
        String username1 = username.getText().toString();
        String password1 = password.getText().toString();
        String age1 = datePicker1.toString();
        String email1 = email.getText().toString();
        Boolean admin = false;
        if (username1.isEmpty() || password1.isEmpty() || age1.isEmpty() || email1.isEmpty()) {
            Toast.makeText(RegisterActivity.this, "Πρέπει να επιλέξετε όλα τα πεδία", Toast.LENGTH_LONG).show();
        } else if (selectedId == -1) {
            Toast.makeText(RegisterActivity.this, "Πρέπει επίσης να επιλέξετε το φύλο σας για να συνεχίσετε", Toast.LENGTH_LONG).show();
        } else {
            String dob = datePicker1.getDayOfMonth() + "/" + (datePicker1.getMonth() + 1) + "/" + datePicker1.getYear();
            User u = new User(username.getText().toString(), password.getText().toString(), dob, email.getText().toString(),
                    genderradioButton.getText().toString(), admin);
            database.child("Users").child(username.getText().toString()).setValue(u);
            User.setCurrentUser(u);
            Toast.makeText(RegisterActivity.this, "Καταχωρήθηκε χρήστης!", Toast.LENGTH_LONG).show();
            // Optional: Auto-navigate to SubmitSymptoms after registration
            Intent intent = new Intent(RegisterActivity.this, SubmitSymptoms.class);
            startActivity(intent);
            finish();
        }
    }

    public void profilCancel(View view) {
        Intent I = new Intent(RegisterActivity.this, MainActivity.class);
        startActivity(I);
        finish();
    }
}