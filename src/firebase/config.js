// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGjyFMRiLNfvDBVtNmyy15mb9yc0ThEq0",
  authDomain: "cuidado-animales.firebaseapp.com",
  projectId: "cuidado-animales",
  storageBucket: "cuidado-animales.firebasestorage.app",
  messagingSenderId: "25737436370",
  appId: "1:25737436370:web:814996058247ad43d1610b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app