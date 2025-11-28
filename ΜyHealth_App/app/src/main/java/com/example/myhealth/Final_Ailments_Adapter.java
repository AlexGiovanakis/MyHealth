package com.example.myhealth;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;

public class Final_Ailments_Adapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_HEADER = 0;
    private static final int TYPE_AILMENT = 1;

    private List<Object> items; // Contains both headers (String) and ailment data (AilmentResult)
    private LayoutInflater mInflater;

    public Final_Ailments_Adapter(Context context) {
        this.mInflater = LayoutInflater.from(context);
        this.items = new ArrayList<>();
    }

    // Updates the data with grouped match levels
    public void updateData(List<AilmentResult> highMatch,
                           List<AilmentResult> moderateMatch, List<AilmentResult> lowMatch) {
        items.clear();

        // Add High Match section
        if (!highMatch.isEmpty()) {
            items.add("High Match");
            items.addAll(highMatch);
        }

        // Add Moderate Match section
        if (!moderateMatch.isEmpty()) {
            items.add("Moderate Match");
            items.addAll(moderateMatch);
        }

        // Add Low Match section
        if (!lowMatch.isEmpty()) {
            items.add("Low Match");
            items.addAll(lowMatch);
        }

        notifyDataSetChanged();
    }

    @Override
    public int getItemViewType(int position) {
        if (items.get(position) instanceof String) {
            return TYPE_HEADER;
        } else {
            return TYPE_AILMENT;
        }
    }

    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        if (viewType == TYPE_HEADER) {
            View view = mInflater.inflate(R.layout.header_match_level, parent, false);
            return new HeaderViewHolder(view);
        } else {
            View view = mInflater.inflate(R.layout.final_ailments, parent, false);
            return new AilmentViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof HeaderViewHolder) {
            HeaderViewHolder headerHolder = (HeaderViewHolder) holder;
            String headerText = (String) items.get(position);
            headerHolder.headerText.setText(headerText);
        } else if (holder instanceof AilmentViewHolder) {
            AilmentViewHolder ailmentHolder = (AilmentViewHolder) holder;
            AilmentResult result = (AilmentResult) items.get(position);

            ailmentHolder.myTextView.setText(result.ailmentName);
            ailmentHolder.textViewPercent.setText(String.format("%.2f%%", result.percentage));
            ailmentHolder.seekBar.setProgress((int) result.percentage);
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    // ViewHolder for headers
    public class HeaderViewHolder extends RecyclerView.ViewHolder {
        TextView headerText;

        HeaderViewHolder(View itemView) {
            super(itemView);
            headerText = itemView.findViewById(R.id.headerText);
        }
    }

    // ViewHolder for ailments (your existing ViewHolder)
    public class AilmentViewHolder extends RecyclerView.ViewHolder {
        TextView myTextView, textViewPercent;
        ProgressBar seekBar;

        AilmentViewHolder(View itemView) {
            super(itemView);
            myTextView = itemView.findViewById(R.id.textViewLabel);
            textViewPercent = itemView.findViewById(R.id.textViewPercentage);
            seekBar = itemView.findViewById(R.id.seekBar);
            seekBar.setOnTouchListener((v, event) -> true); // Disable user interaction with the seek bar
        }
    }

    // Method to get all ailment names for saving results
    public List<String> getAllAilmentNames() {
        List<String> ailmentNames = new ArrayList<>();
        for (Object item : items) {
            if (item instanceof AilmentResult) {
                AilmentResult result = (AilmentResult) item;
                ailmentNames.add(result.ailmentName);
            }
        }
        return ailmentNames;
    }

    // Data class to hold ailment results
    public static class AilmentResult {
        public String ailmentName;
        public double percentage;
        public int matchingSymptoms;

        public AilmentResult(String ailmentName, double percentage, int matchingSymptoms) {
            this.ailmentName = ailmentName;
            this.percentage = percentage;
            this.matchingSymptoms = matchingSymptoms;
        }
    }
}