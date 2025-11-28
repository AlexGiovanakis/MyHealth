package com.example.myhealth;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.List;

public class MyAssociationArrayAdapter extends ArrayAdapter<String> {
    public MyAssociationArrayAdapter(Context context, List<String> items) {
        super(context, 0, items);
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(android.R.layout.simple_list_item_multiple_choice, parent, false);
        }

        String item = getItem(position);
        TextView textView = (TextView) convertView.findViewById(android.R.id.text1);
        textView.setText(item);

        return convertView;
    }
}
