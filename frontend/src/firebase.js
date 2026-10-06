import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdmcpdqg1uMHqOIUPfxhUYFw_bu3XBYwE",
  authDomain: "hostelinventorymanagement.firebaseapp.com",
  projectId: "hostelinventorymanagement",
  storageBucket: "hostelinventorymanagement.firebasestorage.app",
  messagingSenderId: "105968816608",
  appId: "1:105968816608:web:21e002d911444bb35b9b85",
  measurementId: "G-8HQN7PTL3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();
export default app;
