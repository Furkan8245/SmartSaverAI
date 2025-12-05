import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';

// Importlar
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, setLogLevel } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions'; 

// Yapılandırma ve Sabitler
// Burası doğru yolu göstermeli ve yinelenen import olmamalı
import { getFirebaseConfig, CATEGORIES } from './src/config/firebaseConfig'; 

// Hata giderme: Stil dosyasını default import olarak alıyoruz. 
// AppStyles.js'de "export default styles;" olduğundan emin olun.
// styles'ı AppStyles.js'den import ettiğimiz varsayımıyla (styles objesi olarak)
import { styles } from './src/styles/AppStyles';
import { TabButton, IconAlertTriangle } from './src/components/Common';
import { EditReceiptModal, ReceiptDetailModal } from './src/components/Modals';
import { CameraScreen } from './src/screens/CameraScreen';
import { ReceiptsScreen } from './src/screens/ReceiptsScreen';

// --- FİREBASE SETUP ---

// KRİTİK DÜZELTME: getFirebaseConfig çağrısından doğru değerleri alıyoruz.
const fullConfig = getFirebaseConfig(); 
// initializeApp'e gönderilecek olan sadece Firebase ayarlarıdır
const appConfig = fullConfig.config; 
// Firestore path'leri için gerekli olan appId'yi alıyoruz
const appId = fullConfig.appId;

// initializeFirebase'ı artık instance'ları döndürecek şekilde güncelliyoruz.
const initializeFirebase = (config, setGlobalError) => {
    // Canvas global değişkenleri kullanıldığında config'in boş gelme ihtimaline karşı kontrol
    const firebaseConfig = typeof __firebase_config !== 'undefined' 
        ? JSON.parse(__firebase_config) 
        : config;

    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) { // config undefined/boşsa
        setGlobalError("Firebase yapılandırması eksik. Uygulama Mock modunda çalışıyor.");
        return { app: null, auth: null, db: null, functions: null };
    }
    
    let app;
    if (getApps().length === 0) {
        try {
            app = initializeApp(firebaseConfig);
        } catch (e) {
            console.error("Firebase başlatma hatası:", e);
            setGlobalError(`Firebase başlatılamadı: ${e.message}`);
            return { app: null, auth: null, db: null, functions: null };
        }
    } else {
        app = getApp();
    }
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);

    // Hata ayıklama için Firestore Log Seviyesi
    setLogLevel('debug'); 

    // Instance'ları geri döndür
    return { app, auth, db, functions };
};

// --- ANA BİLEŞEN ---

const App = () => {
    // KRİTİK HATA KONTROLÜ: styles objesinin varlığını kontrol et
    if (!styles || typeof styles !== 'object' || Object.keys(styles).length === 0) {
        console.error("KRİTİK HATA: styles objesi yüklenemedi. 'AppStyles.js' dosyasını ve dışa aktarımını kontrol edin.");
        return (
            <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 20, color: 'red', textAlign: 'center' }}>
                    KRİTİK HATA: Stil Yüklenemedi!
                </Text>
                <Text style={{ fontSize: 14, color: '#333', textAlign: 'center', marginTop: 10 }}>
                    Lütfen './src/styles/AppStyles.js' dosyasındaki `styles` objesinin doğru bir şekilde (`export const styles = ...` ile) dışa aktarıldığından emin olun.
                </Text>
            </View>
        );
    }

    const [activeTab, setActiveTab] = useState('camera');
    const [receipts, setReceipts] = useState([]);
    const [globalError, setGlobalError] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [detailReceipt, setDetailReceipt] = useState(null);

    // Instance'ları State ile Yönetme
    const [authInstance, setAuthInstance] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [functionsInstance, setFunctionsInstance] = useState(null);


    // FIREBASE BAŞLANGIÇ VE YETKİLENDİRME
    useEffect(() => {
        // initializeFirebase'ı çağırıp instance'ları yerel olarak alıyoruz
        const { app, auth, db, functions } = initializeFirebase(appConfig, setGlobalError); 
        
        // Instance'ları state'e ayarla (bu, onSnapshot useEffect'ini tetikler)
        setAuthInstance(auth);
        setDbInstance(db);
        setFunctionsInstance(functions);
        
        // Mock Modu Kontrolü
        if (!app || !auth || !db) {
             setIsAuthReady(true);
             setUserId('mock-user');
             return;
        }

        // 1. Auth State Değişikliklerini Dinle
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Kullanıcı anonim de olsa, onAuthStateChanged tetiklenir ve user nesnesi gelir.
                // Eğer burada hala user yoksa, giriş başarısızdır veya henüz denememiştir.
                setUserId(null); 
            }
            setIsAuthReady(true); // Auth state'in belirlendiğini işaretle
        });

        // 2. Kullanıcıyı Oturum Aç
        const signInUser = async () => {
            // Global Canvas değişkenlerini kullanıyoruz
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
            
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Kimlik doğrulama hatası:", error);
                setGlobalError(`Kritik Auth Hatası: ${error.code}. Firebase ayarlarını (Auth ve Güvenlik Kurallarını) kontrol edin.`);
                // Auth başarısız olsa bile uygulamanın Mock modunda devam edebilmesi için
                setIsAuthReady(true);
                setUserId('mock-user');
            }
        };

        signInUser();
        return () => unsubscribe(); 
        
    }, []); // Bağımlılık dizisi boş. Sadece bir kez çalışır.

    // FIRESTORE VERİ DİNLEME (onSnapshot)
    useEffect(() => {
        // Bağımlılıklar: Auth'un hazır olması, userId'nin olması VE dbInstance'ın tanımlı olması.
        if (!isAuthReady || !userId || !dbInstance) return;
        
        // MOCK DATA
        if (userId === 'mock-user' && receipts.length === 0) {
            setReceipts([
                { id: 'mock-1', title: 'Market Alışverişi A', amount: 220.50, category: 'Gıda & Market', categoryValue: 'food_market', date: '2025-11-05', items: [{ name: "Süt (1L)", price: 32.50 }, { name: "Muz (Kg)", price: 55.75 }, { name: "Yumurta (10'lu)", price: 45.00 }, { name: "Ekmek (Tam Buğday)", price: 15.00 }] },
                { id: 'mock-2', title: 'Market Alışverişi B', amount: 180.00, category: 'Gıda & Market', categoryValue: 'food_market', date: '2025-10-20', items: [{ name: "Süt (1L)", price: 28.00 }, { name: "Muz (Kg)", price: 48.00 }, { name: "Yumurta (10'lu)", price: 40.00 }] },
                { id: 'mock-3', title: 'Market Alışverişi C', amount: 110.00, category: 'Gıda & Market', categoryValue: 'food_market', date: '2025-09-01', items: [{ name: "Muz (Kg)", price: 39.90 }, { name: "Peynir (Beyaz)", price: 70.10 }] },
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            return;
        }

        // Fiş koleksiyonuna referans oluşturma
        // Canvas global değişkeni olan __app_id'yi kullanıyoruz.
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : appId;
        if (!currentAppId) {
            setGlobalError("Kritik Hata: Uygulama ID'si (appId) bulunamadı.");
            return;
        }
        
        const receiptsCollectionRef = collection(dbInstance, 'artifacts', currentAppId, 'users', userId, 'receipts');
        const q = query(receiptsCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReceipts = 
                snapshot.docs.map(doc => {
                const data = doc.data();
                // CATEGORIES içindeki label'ı categoryValue'den bulup ekliyoruz
                const categoryLabel = CATEGORIES.find(c => c.value === data.categoryValue)?.label || data.category;
                
                return {
                    id: doc.id,
                    ...data,
                    // kategori etiketini güncel kategorilerle eşleştir
                    category: categoryLabel,
                    // Sayısal alanları güvenli bir şekilde dönüştür
                    amount: typeof data.amount === 'string' ? parseFloat(data.amount) || 0 : data.amount || 0,
                    items: data.items || [], 
                };
            });
            // Tarihe göre sıralama (en yeni fiş başta)
            fetchedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setReceipts(fetchedReceipts);
        }, (error) => {
            console.error("Fişleri alma hatası (onSnapshot):", error);
            setGlobalError("Veri senkronizasyonu başarısız oldu. Güvenlik kurallarınızı kontrol edin.");
        });

        return () => unsubscribe(); 
        
    }, [isAuthReady, userId, dbInstance]); // dbInstance bağımlılıklara eklendi

    
    // CRUD İŞLEVLERİ (CREATE, UPDATE, DELETE)
    const runFirestoreOperation = useCallback(async (operation, receipt, id) => {
        // Global Canvas değişkeni olan __app_id'yi kullanıyoruz.
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : appId;
        
        if (!isAuthReady || !userId || !dbInstance || !currentAppId) {
            console.error("Auth, userId, DB instance veya appId henüz hazır değil. İşlem iptal edildi.");
            
            // Mock modu kontrolü
            if (userId === 'mock-user') {
                const baseError = "Firebase bağlantısı yok. Uygulama Mock modunda çalışıyor.";
                if (!globalError || globalError.includes("Mock modunda")) { 
                    setGlobalError(baseError); 
                }
            
                if (operation === 'add') {
                    const newReceipt = { ...receipt, id: Date.now().toString(), userId: 'mock-user' };
                    setReceipts(prev => [newReceipt, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    Alert.alert("Başarılı", "Fiş Mock modunda eklendi.");
                } else if (operation === 'update') {
                    setReceipts(prev => prev.map(r => r.id === receipt.id ? receipt : r));
                    Alert.alert("Başarılı", "Fiş Mock modunda güncellendi.");
                } else if (operation === 'delete') {
                    setReceipts(prev => prev.filter(r => r.id !== id));
                    Alert.alert("Başarılı", "Fiş Mock modunda silindi.");
                }
            } else {
                 Alert.alert("Hata", "Uygulama sunucuya bağlanamıyor. Lütfen tekrar deneyin.");
            }
            return;
        }

        try {
            const receiptsCollectionRef = collection(dbInstance, 'artifacts', currentAppId, 'users', userId, 'receipts');
            if (operation === 'add') {
                // Kaydedilen verinin Category etiketini değil, Value'sunu kullan
                const categoryValue = CATEGORIES.find(c => c.label === receipt.category)?.value || receipt.categoryValue || 'other';
                await addDoc(receiptsCollectionRef, { 
                    ...receipt, 
                    amount: parseFloat(receipt.amount), 
                    userId: userId,
                    categoryValue: categoryValue, // Value'yu kaydet
                    category: receipt.category, // Label'ı da tutabiliriz
                });
                Alert.alert("Başarılı", "Fiş Firestore'a eklendi.");
            } else if (operation === 'update') {
                const receiptDocRef = doc(dbInstance, 'artifacts', currentAppId, 'users', userId, 'receipts', receipt.id);
                const { id: docId, ...dataToUpdate } = receipt;
                
                // Update işleminde de categoryValue'yu doğru kaydet
                const categoryValue = CATEGORIES.find(c => c.label === dataToUpdate.category)?.value || dataToUpdate.categoryValue || 'other';
                
                await updateDoc(receiptDocRef, { 
                    ...dataToUpdate, 
                    amount: parseFloat(dataToUpdate.amount), 
                    categoryValue: categoryValue 
                });
                Alert.alert("Başarılı", "Fiş Firestore'da güncellendi.");
            } else if (operation === 'delete') {
                const receiptDocRef = doc(dbInstance, 'artifacts', currentAppId, 'users', userId, 'receipts', id);
                await deleteDoc(receiptDocRef);
                Alert.alert("Başarılı", "Fiş Firestore'dan silindi.");
            }
        } catch (e) {
            console.error(`${operation} hatası:`, e);
            Alert.alert(
                `${operation === 'add' ? 'Ekleme' : operation === 'update' ? 'Güncelleme' : 'Silme'} Başarısız`,
                `${e.message}`
            );
        }
    }, [isAuthReady, userId, dbInstance, globalError]); // Bağımlılıkları güncelle

    // ... Diğer fonksiyonlar (handleAddReceipt, handleEditPress vb.) aynı kalır ...
    const handleAddReceipt = (receipt) => runFirestoreOperation('add', receipt);
    const handleEditPress = (receipt) => {
        // Düzenleme modalı açılırken categoryValue'yu set et
        const categoryValueFromLabel = CATEGORIES.find(c => c.label === receipt.category)?.value;

        setCurrentReceipt({
            ...receipt,
            amount: receipt.amount ? receipt.amount.toString() : '', 
            // categoryValue'yu, Firestore'dan gelen category label'ından bul
            categoryValue: categoryValueFromLabel || receipt.categoryValue || '', 
        });
        setIsEditModalVisible(true);
    };

    const handleDetailPress = (receipt) => {
        setDetailReceipt(receipt);
        setIsDetailModalVisible(true);
    };

    const handleUpdateReceipt = (receipt) => runFirestoreOperation('update', receipt);
    
    const handleDeleteReceipt = (id) => {
        Alert.alert(
            "Silme Onayı",
            "Bu fişi kalıcı olarak silmek istediğinizden emin misiniz?",
            [
                { text: "Hayır", style: "cancel" },
                { text: "Evet", onPress: () => runFirestoreOperation('delete', null, id) }
            ],
            { cancelable: true }
        );
    };

    // Yükleme ekranı
    if (!isAuthReady) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>⏳</Text>
                <Text style={styles.loadingTextSmall}>Veritabanına bağlanılıyor...</Text>
            </View>
        );
    }
    
    // Ana Uygulama Görünümü
    return (
        <View style={styles.appContainer}>
            
            {globalError && (
                <View style={styles.errorBanner}>
                    <IconAlertTriangle />
                    <View style={styles.errorTextContainer}>
                        <Text style={styles.errorTitle}>Uyarı!</Text>
                        <Text style={styles.errorText}>{globalError}</Text>
                        <Text style={styles.errorTextSmall}>Anonim modda bile çalışması için Firebase Auth'un etkin olduğundan emin olun.</Text>
                    </View>
                </View>
            )}
            
            <View style={styles.tabBar}>
                <TabButton 
                    title="Yeni Fiş" 
                    icon={() => <Text style={{fontSize: 16}}>➕</Text>}
                    isActive={activeTab === 'camera'}
                    onPress={() => setActiveTab('camera')}
                />
                <TabButton 
                    title={`Fişlerim (${receipts.length})`} 
                    icon={() => <Text style={{fontSize: 16}}>✏️</Text>} 
                    isActive={activeTab === 'receipts'}
                    onPress={() => setActiveTab('receipts')}
                />
            </View>

            <ScrollView contentContainerStyle={{flexGrow: 1}} style={styles.mainContent}>
                {activeTab === 'camera' && (
                    <CameraScreen 
                        onAddReceipt={handleAddReceipt} 
                        allReceipts={receipts}
                    />
                )}
                
                {activeTab === 'receipts' && (
                    <ReceiptsScreen 
                        receipts={receipts}
                        onDeleteReceipt={handleDeleteReceipt}
                        onEditReceipt={handleEditPress} 
                        onDetailReceipt={handleDetailPress} 
                    />
                )}
            </ScrollView>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Kullanıcı ID: <Text style={styles.userIdText}>{userId || 'Anonim'}</Text></Text>
            </View>

            <EditReceiptModal 
                isVisible={isEditModalVisible}
                setIsVisible={setIsEditModalVisible}
                currentReceipt={currentReceipt}
                setCurrentReceipt={setCurrentReceipt}
                onUpdateReceipt={handleUpdateReceipt}
            />
            
            <ReceiptDetailModal 
                isVisible={isDetailModalVisible}
                setIsVisible={setIsDetailModalVisible}
                receipt={detailReceipt}
                onUpdateReceipt={handleUpdateReceipt} 
            />
        </View>
    );
};

export default App;