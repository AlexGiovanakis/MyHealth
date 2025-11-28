import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyDFaRFE_yM7cGguFEEF3BjxiR3mKSDKGsE",
  authDomain: "myhealth-4533b.firebaseapp.com",
  databaseURL: "https://myhealth-4533b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "myhealth-4533b",
  storageBucket: "myhealth-4533b.firebasestorage.app",
  messagingSenderId: "983315822733",
  appId: "1:983315822733:web:45b1ff4b96b44295d6cac4",
  measurementId: "G-093M21R57Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const resultsRef = ref(db, "/");

console.log("Listening for Firebase data...");

export function fetchData(path, callback) {
  const dataRef = ref(db, path);
  onValue(dataRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        callback(snapshot.val(), null);
      } else {
        console.log("No data available");
        callback(null, null);
      }
    } catch (error) {
      console.error('Data processing error:', error);
      callback(null, error);
    }
  },
    (error) => {
      console.error('Firebase error:', error);
      callback(null, error);
    }
  );
}
