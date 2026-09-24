import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOl0SgXqeH5yPYy1UFbfM-RzCxsKMCaAI",
  authDomain: "diska-bug-report.firebaseapp.com",
  projectId: "diska-bug-report",
  storageBucket: "diska-bug-report.firebasestorage.app",
  messagingSenderId: "588205450252",
  appId: "1:588205450252:web:b443ee7305cdb2ba313a29"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
