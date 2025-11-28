package com.example.myhealth;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import java.util.List;


public class MyAssociatonAdapter extends RecyclerView.Adapter<MyAssociatonAdapter.MyViewHolder1> {
    private List<String> ailmentList;
    private OnItemClickListener mListener;

    // Click listener interface
    public interface OnItemClickListener {
        void onItemClick(int position);
    }

    // Setter for the listener
    public void setOnItemClickListener(OnItemClickListener listener) {
        mListener = listener;
    }

    // ViewHolder class
    public static class MyViewHolder1 extends RecyclerView.ViewHolder {
        public TextView textViewSymptom;
        public TextView textViewValue;

        public MyViewHolder1(View itemView, final OnItemClickListener listener) {
            super(itemView);
            textViewSymptom = itemView.findViewById(R.id.textSymptom);
            textViewValue = itemView.findViewById(R.id.textValue);

            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    int position = getAdapterPosition();
                    if (position != RecyclerView.NO_POSITION) {
                        listener.onItemClick(position);
                    }
                }
            });
        }
    }

    // Constructor for the adapter
    public MyAssociatonAdapter(List<String> myDataset) {
        ailmentList = myDataset;
    }

    @Override
    public MyViewHolder1 onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_association, parent, false);
        return new MyViewHolder1(view, mListener);
    }

    @Override
    public void onBindViewHolder(MyViewHolder1 holder, int position) {
        String item = ailmentList.get(position);

        if (item != null && item.contains("|")) {
            String[] parts = item.split("\\|");
            String symptom = parts[0].trim();
            String value = parts.length > 1 ? parts[1].trim() : "";

            holder.textViewSymptom.setText(symptom);
            holder.textViewValue.setText("Βαθμός: " + value);
        } else {
            holder.textViewSymptom.setText(item != null ? item.trim() : "");
            holder.textViewValue.setText(""); // Hide if no value
        }
    }

    @Override
    public int getItemCount() {
        return ailmentList.size();
    }

    public void setData(List<String> newList) {
        ailmentList = newList;
        notifyDataSetChanged();
    }
}
