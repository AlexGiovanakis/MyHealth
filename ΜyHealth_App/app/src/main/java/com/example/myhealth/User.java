package com.example.myhealth;

import android.os.Parcel;
import android.os.Parcelable;

public class User implements Parcelable {

    // Instance variables (your existing fields)
    private String username;
    private String password;    // ← ADDED BACK
    private String dob;
    private String email;       // ← ADDED BACK
    private String gender;
    private boolean isAdmin;    // ← ADDED BACK

    // SINGLETON FUNCTIONALITY - ADD THESE
    private static User currentUser;

    /**
     * Set the current logged-in user
     * @param user The user object to store as current session
     */
    public static void setCurrentUser(User user) {
        currentUser = user;
    }

    /**
     * Get the current logged-in user
     * @return Current user object or null if no user logged in
     */
    public static User getCurrentUser() {
        return currentUser;
    }

    /**
     * Clear the current user session (logout)
     */
    public static void clearCurrentUser() {
        currentUser = null;
    }

    /**
     * Check if a user is currently logged in
     * @return true if user is logged in, false otherwise
     */
    public static boolean isUserLoggedIn() {
        return currentUser != null;
    }

    // EXISTING CONSTRUCTORS (your existing code)
    public User() {
        this.username = "";
        this.password = "";
        this.dob = "";
        this.email = "";
        this.gender = "";
        this.isAdmin = false;
    }

    public User(String username, String password, String dob, String email, String gender, boolean isAdmin) {
        this.username = username;
        this.password = password;
        this.dob = dob;
        this.email = email;
        this.gender = gender;
        this.isAdmin = isAdmin;
    }

    // EXISTING GETTERS/SETTERS (keep all your existing methods)
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    // EXISTING PARCELABLE IMPLEMENTATION (update for all fields)
    protected User(Parcel in) {
        username = in.readString();
        password = in.readString();
        dob = in.readString();
        email = in.readString();
        gender = in.readString();
        isAdmin = in.readByte() != 0;
    }

    public static final Creator<User> CREATOR = new Creator<User>() {
        @Override
        public User createFromParcel(Parcel in) {
            return new User(in);
        }

        @Override
        public User[] newArray(int size) {
            return new User[size];
        }
    };

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(username);
        dest.writeString(password);
        dest.writeString(dob);
        dest.writeString(email);
        dest.writeString(gender);
        dest.writeByte((byte) (isAdmin ? 1 : 0));
    }
}