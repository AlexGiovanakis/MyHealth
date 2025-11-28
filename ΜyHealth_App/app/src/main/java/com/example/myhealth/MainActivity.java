package com.example.myhealth;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.FirebaseError;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

public class MainActivity extends AppCompatActivity {
    DatabaseReference  database;
    private EditText uname, passwd;
    private TextView registerLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        database = FirebaseDatabase.getInstance().getReference();
        uname = findViewById(R.id.username);
        passwd = findViewById(R.id.password);
        registerLink = findViewById(R.id.register);
        registerLink.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {//an patisei to Register ton stelno sto RegisterActivity
                Intent I = new Intent(MainActivity.this, RegisterActivity.class);
                startActivity(I);
            }
        });
    }

    public void loginCheck (View view){
        Query query = database.child("Users").orderByChild("username").equalTo(uname.getText().toString());
        query.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(final DataSnapshot dataSnapshot) {
                boolean userFound = false;
                for (DataSnapshot data : dataSnapshot.getChildren()) {
                    User user = data.getValue(User.class);
                    if (user != null && user.getPassword().equals(passwd.getText().toString())) {
                        userFound = true;

                        User.setCurrentUser(user);

                        if(user.isAdmin()==true){
                            Intent intent= new Intent(MainActivity.this,AdminPanel.class);
                            startActivity(intent);
                            break;
                        } else{
                            Intent intent = new Intent(MainActivity.this, SubmitSymptoms.class);
                            startActivity(intent);
                            break;
                        }
                    }
                }
                if (!userFound) {
                    Toast.makeText(MainActivity.this, "Λάνθασμενο όνομα χρήστη ή κωδικός πρόσβασης", Toast.LENGTH_LONG).show();
                }
            }
            @Override
            public void onCancelled(final DatabaseError databaseError) {
            }
        });
    }
}
