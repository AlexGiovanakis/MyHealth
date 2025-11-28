package com.example.myhealth;

import android.content.Context;
import android.content.DialogInterface;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MyAilmentsAdapter extends RecyclerView.Adapter<MyAilmentsAdapter.MyViewHolder> {

    private final List<String> dataList;
    private final List<String> dataListKeys;

    private final Context context;
    private final String databasereference;
    private final int pathfile;

    public MyAilmentsAdapter(List<String> dataList, List<String> dataListKeys,
                             Context context, String databasereference, int pathfile) {
        this.dataList = dataList;
        this.dataListKeys = dataListKeys;
        this.context = context;
        this.databasereference = databasereference;
        this.pathfile = pathfile;
    }

    @Override
    public MyAilmentsAdapter.MyViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.admin_list_items, parent, false);
        MyViewHolder vh = new MyViewHolder(v);
        return vh;
    }

    @Override
    public void onBindViewHolder(MyViewHolder holder, int position) {
        String data = dataList.get(position);
        holder.adminTitle.setText(data);
        String key = dataListKeys.get(position);
        holder.img_remove.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                DatabaseReference refAilment = FirebaseDatabase.getInstance()
                        .getReference(databasereference);
                refAilment.child(key).removeValue();
                DatabaseReference refAssociation = FirebaseDatabase.getInstance()
                        .getReference("Admin Association");
                if (pathfile == 0) {
                    refAssociation.child(data).removeValue();
                } else {
                    refAssociation.addValueEventListener(new ValueEventListener() {
                        @Override
                        public void onDataChange(@NonNull DataSnapshot snapshot) {
                            for (DataSnapshot ailmentSnapshot : snapshot.getChildren()) {
                                for (DataSnapshot symptomSnapshot : ailmentSnapshot.getChildren()) {
                                    if (symptomSnapshot.getValue().equals(data)) {
                                        symptomSnapshot.getRef().removeValue();
                                    }
                                }
                            }
                        }

                        @Override
                        public void onCancelled(@NonNull DatabaseError error) {

                        }
                    });
                    // Διαγραφή συμπτώματος από όλες τις συσχετίσεις
                }
                dataList.remove(position);
                notifyItemRemoved(position);
                notifyItemRangeChanged(position, dataList.size());
            }

        });

        holder.img_edit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Δημιουργία ενός διαλόγου για την εισαγωγή του νέου ονόματος
                AlertDialog.Builder builder = new AlertDialog.Builder(context);
                builder.setTitle("Επεξεργασία ονόματος");

                final EditText input = new EditText(context);
                input.setInputType(InputType.TYPE_CLASS_TEXT);
                input.setText(data);
                builder.setView(input);

                builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String newName = input.getText().toString();
                        // Ενημέρωση της βάσης δεδομένων Firebase
                        String key = dataListKeys.get(position);
                        DatabaseReference renaming = FirebaseDatabase.getInstance().getReference(databasereference);
                        renaming.child(key).setValue(newName);
                        DatabaseReference refAssociation = FirebaseDatabase.getInstance()
                                .getReference("Admin Association");
                        if (pathfile == 0) { //rename ailments from admin
                            refAssociation.child(data).addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(DataSnapshot dataSnapshot) {
                                    // Αντιγραφή των δεδομένων στο νέο κλειδί
                                    refAssociation.child(newName).setValue(dataSnapshot.getValue());
                                    // Διαγραφή του παλιού στοιχείου
                                    refAssociation.child(data).removeValue();
                                }
                                @Override
                                public void onCancelled(DatabaseError databaseError) {
                                    // Εδώ μπορείτε να χειριστείτε τυχόν σφάλματα
                                }
                            });
                        } else {//rename symptoms from admin
                            refAssociation.addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(@NonNull DataSnapshot snapshot) {
                                    for (DataSnapshot ailmentSnapshot : snapshot.getChildren()) {
                                        for (DataSnapshot symptomSnapshot : ailmentSnapshot.getChildren()) {
                                            if (symptomSnapshot.getValue().equals(data)) {
                                                Map<String, Object> updates = new HashMap<>();
                                                updates.put(symptomSnapshot.getKey(), newName);
                                                // Ενημέρωση της τιμής του παλιού Symptom με το newName
                                                ailmentSnapshot.getRef().updateChildren(updates);
                                            }
                                        }
                                    }
                                }

                                @Override
                                public void onCancelled(@NonNull DatabaseError error) {

                                }
                            });
                        }

                        // Ενημέρωση της λίστας και ενημέρωση του προσαρμογέα
                        dataList.set(position, newName);
                        notifyItemChanged(position);


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
        });
        // Εδώ μπορείτε να ορίσετε τις λειτουργίες του img_remove
    }

    @Override
    public int getItemCount() {

        return dataList.size();
    }

    public static class MyViewHolder extends RecyclerView.ViewHolder {
        public TextView adminTitle;
        public ImageView img_edit;
        public ImageView img_remove;

        public MyViewHolder(View v) {
            super(v);
            adminTitle = v.findViewById(R.id.adminTitle);
            img_edit = v.findViewById(R.id.img_edit);
            img_remove = v.findViewById(R.id.img_remove);
        }
    }
}
