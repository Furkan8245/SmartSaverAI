import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore'; 

// --- KATEGORİLER (Common.js'in ihtiyaç duyduğu) ---
// Bu kısım, Common.js'in CATEGORIES.find() hatasını çözmek için gereklidir.
export const CATEGORIES = [
    { value: 'food_market', label: 'Gıda & Market' },
    { value: 'transport', label: 'Ulaşım' },
    { value: 'bill_dues', label: 'Fatura & Aidat' },
    { value: 'entertainment', label: 'Eğlence' },
    { value: 'clothing', label: 'Giyim' },
    { value: 'other', label: 'Diğer' },
];

const generateUUID = () => {
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); 
    }
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

const firebaseConfig = {
  apiKey: "AIzaSyAA-Uf0NkwLLFSzD8MiZGUvTnKmaMit_Zk",
  authDomain: "smartsavurai.firebaseapp.com",
  projectId: "smartsavurai",
  storageBucket: "smartsavurai.firebasestorage.app",
  messagingSenderId: "945848720788",
  appId: "1:945848720788:web:0e9777cbdd287a62000381",
  measurementId: "G-KYECPYLDKT"
};

// Bu fonksiyon, App.jsx'in beklediği formatta (config, appId ve CATEGORIES ile birlikte) veri döndürür.
export const getFirebaseConfig = () => { 
    return { 
        config: firebaseConfig, 
        appId: firebaseConfig.appId, 
        CATEGORIES: CATEGORIES 
    };
};

let app = null;
let auth = null;
let db = null;

// Firebase'i burada başlatmıyoruz, bu sorumluluk App.jsx'e aittir. 
// Sadece dışa aktarılacak değişkenleri tanımlıyoruz.

export { 
    auth, 
    db, 
    signInWithCustomToken, 
    signInAnonymously, 
    onAuthStateChanged,
    generateUUID,
    // getFirebaseConfig zaten yukarıda export edildi
};