import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore'; 


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



// Firebase Uygulamasını Başlat
let app = null;
let auth = null;
let db = null;

const isConfigValid = Object.keys(firebaseConfig).length > 0;

if (isConfigValid) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        setLogLevel('debug');
        console.log("Firebase ve Firestore başarıyla başlatıldı.");

    } catch (e) {
        console.error("Firebase Servislerini Başlatma Hatası:", e.message);
    }
} else {
    console.error("HATA: Firebase yapılandırması (__firebase_config) global değişkeni boş veya hatalı. Servisler başlatılamadı.");
}



export { 
    auth, 
    db, 
    signInWithCustomToken, 
    signInAnonymously, 
    onAuthStateChanged,
    generateUUID 
};