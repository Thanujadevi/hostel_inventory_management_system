// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBax8RiBqKS8RhLJyn8Bk3vPcAMkuVySA",
  authDomain: "hostelinventorysystem.firebaseapp.com",
  projectId: "hostelinventorysystem",
  storageBucket: "hostelinventorysystem.firebasestorage.app",
  messagingSenderId: "858918376702",
  appId: "1:858918376702:web:2d7472bee9e24c870801af",
  measurementId: "G-GZTHR8ZWNC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;