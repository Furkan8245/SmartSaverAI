import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView,
    Platform,
    Alert
} from 'react-native';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- İKONLAR (Emoji karakterleri, <Text> içinde) ---
const IconPlus = () => <Text style={{fontSize: 16}}>➕</Text>;
const IconTrash2 = () => <Text style={{fontSize: 16}}>🗑️</Text>;
const IconEdit3 = () => <Text style={{fontSize: 16}}>✏️</Text>;
const IconSearch = () => <Text style={{fontSize: 16}}>🔍</Text>;
const IconChevronDown = () => <Text style={{fontSize: 10}}>▼</Text>;
const IconChevronUp = () => <Text style={{fontSize: 10}}>▲</Text>;
const IconAlertTriangle = () => <Text style={{fontSize: 20}}>⚠️</Text>;
const IconX = () => <Text style={{fontSize: 20}}>❌</Text>;

// === SABİT VERİLER VE KONFİGÜRASYON ===
const CATEGORIES = [
    { label: 'Kategori Seçin', value: '' },
    { label: 'Gıda & Market', value: 'GidaMarket' },
    { label: 'Ulaşım', value: 'Ulasim' },
    { label: 'Fatura & Aidat', value: 'Fatura' },
    { label: 'Eğlence', value: 'Eglence' },
    { label: 'Giyim', value: 'Giyim' },
    { label: 'Diğer', value: 'Diger' },
];

// Firebase Yapılandırması okunması (global / env kontrolü)
const firebaseConfig = (() => {
    try {
        // 1) global değişken olarak __firebase_config (bundler veya host tarafından sağlanmış olabilir)
        if (typeof __firebase_config !== 'undefined' && __firebase_config) {
            return typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
        }

        // 2) Browser window (debug)
        if (typeof window !== 'undefined' && window.__firebase_config) {
            return typeof window.__firebase_config === 'string' ? JSON.parse(window.__firebase_config) : window.__firebase_config;
        }

        // 3) process.env (CI veya node)
        if (typeof process !== 'undefined' && process.env && process.env.REACT_NATIVE_FIREBASE_CONFIG) {
            try {
                return JSON.parse(process.env.REACT_NATIVE_FIREBASE_CONFIG);
            } catch {
                return process.env.REACT_NATIVE_FIREBASE_CONFIG;
            }
        }

        return {}; // no config -> mock
    } catch (e) {
        console.error("Firebase config yüklenemedi:", e);
        return {};
    }
})();

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Firebase servis örnekleri (global set edilecek)
let authInstance = null;
let dbInstance = null;

const initializeFirebase = (config) => {
    if (!config || Object.keys(config).length === 0) return null;

    try {
        if (getApps().length === 0) {
            const app = initializeApp(config);
            authInstance = getAuth(app);
            dbInstance = getFirestore(app);
            return app;
        } else {
            const app = getApp();
            authInstance = getAuth(app);
            dbInstance = getFirestore(app);
            return app;
        }
    } catch (e) {
        console.error('Firebase başlatılamadı:', e);
        return null;
    }
};

// === YARDIMCI BİLEŞENLER ===
const CategorySelect = ({ value, onChange, placeholder = 'Kategori Seçin' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = CATEGORIES.find(c => c.value === value)?.label || placeholder;

    return (
        <View style={{zIndex: 10}}>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={styles.dropdownButtonText}>{selectedLabel}</Text>
                <IconChevronDown />
            </TouchableOpacity>
            
            {isOpen && (
                <View style={styles.dropdownList}>
                    {CATEGORIES.filter(c => c.value !== '').map((item) => (
                        <TouchableOpacity
                            key={item.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                                onChange(item.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={styles.dropdownItemText}>{item.label}</Text>
                            {item.value === value && <Text style={styles.selectedCheck}>✓</Text>}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const EditReceiptModal = ({ isVisible, setIsVisible, currentReceipt, setCurrentReceipt, onUpdateReceipt }) => {
    if (!isVisible || !currentReceipt) return null;
    
    const currentCategoryLabel = CATEGORIES.find(c => c.value === currentReceipt.categoryValue)?.label || 'Kategori Seçin';

    const handleUpdate = () => {
        const cleanedAmount = parseFloat(currentReceipt.amount.toString().replace(/,/g, '.'));

        if (!currentReceipt.title || !cleanedAmount || isNaN(cleanedAmount) || currentReceipt.categoryValue === '') {
            Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun ve geçerli bir tutar girin.");
            return;
        }

        const updatedReceipt = {
            ...currentReceipt,
            amount: cleanedAmount,
            category: currentCategoryLabel,
        };

        onUpdateReceipt(updatedReceipt);
        setIsVisible(false);
        setCurrentReceipt(null);
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Fiş Detaylarını Düzenle</Text>
                    <TouchableOpacity onPress={() => { setIsVisible(false); setCurrentReceipt(null); }}>
                        <IconX />
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Fiş Başlığı</Text>
                        <TextInput
                            style={styles.input}
                            value={currentReceipt.title}
                            onChangeText={(text) => setCurrentReceipt({...currentReceipt, title: text})}
                            placeholder="Başlık girin"
                        />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Kategori Seçimi</Text>
                        <CategorySelect
                            value={currentReceipt.categoryValue}
                            onChange={(value) => setCurrentReceipt({...currentReceipt, categoryValue: value})}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Tutar (TL)</Text>
                            <TextInput
                                style={styles.input}
                                value={currentReceipt.amount.toString()}
                                onChangeText={(text) => setCurrentReceipt({...currentReceipt, amount: text.replace(/[^0-9.]/g, '')})}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.flex1}>
                            <Text style={styles.label}>Tarih</Text>
                            <TextInput
                                style={styles.input}
                                value={currentReceipt.date}
                                onChangeText={(text) => setCurrentReceipt({...currentReceipt, date: text})}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleUpdate}
                >
                    <Text style={styles.buttonText}>✓ KAYDET ve GÜNCELLE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={() => { setIsVisible(false); setCurrentReceipt(null); }}
                >
                    <Text style={[styles.buttonText, {color: '#4B5563'}]}>İptal Et</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// === FİREBASE SETUP VE ANA BİLEŞEN ===
const App = () => {
    const [activeTab, setActiveTab] = useState('camera');
    const [receipts, setReceipts] = useState([]);
    const [globalError, setGlobalError] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isMockMode, setIsMockMode] = useState(false);

    // Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    // --- FIREBASE BAŞLANGIÇ VE YETKİLENDİRME ---
    useEffect(() => {
        const hasFirebaseConfig = firebaseConfig && Object.keys(firebaseConfig).length > 0;

        if (!hasFirebaseConfig) {
            // No firebase config: set mock mode
            setIsMockMode(true);
            setGlobalError('Firebase yapılandırması bulunamadı. Uygulama mock modunda çalışıyor. Gerçek veri için config ekleyin.');
            setIsAuthReady(true);
            setUserId('mock-user');
            return;
        }

        const app = initializeFirebase(firebaseConfig);
        if (!app) {
            setIsMockMode(true);
            setGlobalError('Firebase başlatılamadı. Uygulama mock modunda çalışıyor. Lütfen config/bağlantınızı kontrol edin.');
            setIsAuthReady(true);
            setUserId('mock-user');
            return;
        }

        // set global instances (initializeFirebase already set them but be explicit)
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);

        let unsubAuth = null;
        try {
            unsubAuth = onAuthStateChanged(authInstance, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
                setIsAuthReady(true);
            });
        } catch (err) {
            // ignore it; we'll set auth ready later
            console.warn('onAuthStateChanged hatası:', err);
            setIsAuthReady(true);
        }

        const signInUser = async () => {
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }
            } catch (error) {
                console.error("Kimlik doğrulama hatası:", error);
                setGlobalError('Firebase Auth hatası. Uygulama mock moduna geçebilir.');
                // Fallback to mock mode so UI remains usable
                setIsMockMode(true);
                setIsAuthReady(true);
                setUserId('mock-user');
            }
        };

        signInUser();

        return () => {
            // cleanup auth state listener if present
            try {
                if (typeof unsubAuth === 'function') unsubAuth();
            } catch {}
        };
    }, []);

    // --- FIRESTORE VERİ DİNLEME (onSnapshot) ---
    useEffect(() => {
        // only listen when live firestore is available and not mock mode and user exists
        if (!isAuthReady || isMockMode || !dbInstance || !userId || userId === 'mock-user') return;

        const receiptsCollectionRef = collection(dbInstance, 'artifacts', appId, 'users', userId, 'receipts');
        // orderBy date desc for consistent sorting (date should exist on docs)
        const q = query(receiptsCollectionRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReceipts = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    amount: typeof data.amount === 'string' ? parseFloat(data.amount) || 0 : data.amount || 0,
                };
            });
            fetchedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setReceipts(fetchedReceipts);
        }, (error) => {
            console.error("Fişleri alma hatası (onSnapshot):", error);
            setGlobalError("Veri senkronizasyonu başarısız oldu. Güvenlik kurallarınızı kontrol edin.");
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, isMockMode]);

    // --- CRUD İŞLEVLERİ (CREATE, UPDATE, DELETE) ---
    const runFirestoreOperation = useCallback(async (operation, receipt, id) => {
        if (!isAuthReady) {
            throw new Error('Auth hazır değil');
        }

        // Mock fallback: no firebase or user is mock-user
        if (isMockMode || userId === 'mock-user' || !dbInstance) {
            if (!globalError || !globalError.includes('Mock')) {
                setGlobalError('Firebase bağlantısı sağlanamadı — uygulama yerel (mock) modunda çalışıyor.');
            }

            setReceipts(prev => {
                if (operation === 'add') {
                    const newItem = {
                        id: `mock-${Date.now()}`,
                        title: receipt.title || 'Yeni Fiş',
                        amount: Number(receipt.amount || 0),
                        date: receipt.date || new Date().toISOString().slice(0, 10),
                        categoryValue: receipt.categoryValue || '',
                        category: receipt.category || CATEGORIES.find(c => c.value === (receipt.categoryValue || ''))?.label || 'Belirlenmemiş',
                        createdAt: new Date().toISOString(),
                        userId: 'mock-user',
                        ...receipt
                    };
                    return [newItem, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }
                if (operation === 'update') {
                    return prev.map(r => r.id === receipt.id ? { ...r, ...receipt, amount: Number(receipt.amount) } : r);
                }
                if (operation === 'delete') {
                    return prev.filter(r => r.id !== id);
                }
                return prev;
            });
            return;
        }

        // Real Firestore operations
        try {
            const receiptsCollectionRef = collection(dbInstance, 'artifacts', appId, 'users', userId, 'receipts');
            if (operation === 'add') {
                await addDoc(receiptsCollectionRef, { ...receipt, amount: parseFloat(receipt.amount), userId });
            } else if (operation === 'update') {
                const receiptDocRef = doc(dbInstance, 'artifacts', appId, 'users', userId, 'receipts', receipt.id);
                const { id: docId, ...dataToUpdate } = receipt;
                await updateDoc(receiptDocRef, { ...dataToUpdate, amount: parseFloat(dataToUpdate.amount) });
            } else if (operation === 'delete') {
                const receiptDocRef = doc(dbInstance, 'artifacts', appId, 'users', userId, 'receipts', id);
                await deleteDoc(receiptDocRef);
            }
        } catch (e) {
            console.error(`${operation} hatası:`, e);
            // Show friendly alert
            Alert.alert(
                `${operation === 'add' ? 'Ekleme' : operation === 'update' ? 'Güncelleme' : 'Silme'} Başarısız`,
                `${e?.message || 'Bilinmeyen hata'}`
            );
            throw e;
        }
    }, [isAuthReady, userId, isMockMode, dbInstance, globalError]);

    const handleAddReceipt = (receipt) => runFirestoreOperation('add', receipt);
    const handleEditPress = (receipt) => {
        setCurrentReceipt({
            ...receipt,
            amount: receipt.amount ? receipt.amount.toString() : '', 
            categoryValue: CATEGORIES.find(c => c.label === receipt.category)?.value || '' 
        });
        setIsEditModalVisible(true);
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

    // Yükleniyor Ekranı
    if (!isAuthReady) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>⏳</Text>
                <Text style={styles.loadingTextSmall}>Veritabanına bağlanılıyor...</Text>
            </View>
        );
    }
    
    // Uygulama Ana Görünümü
    return (
        <View style={styles.appContainer}>
            
            {/* Global Hata Mesajı (Mock Modu Uyarısı) */}
            {globalError && (
                <View style={styles.errorBanner}>
                    <IconAlertTriangle />
                    <View style={styles.errorTextContainer}>
                        <Text style={styles.errorTitle}>Uyarı!</Text>
                        <Text style={styles.errorText}>{globalError}</Text>
                        <Text style={styles.errorTextSmall}>Anonymous modda bile çalışması için Firebase Auth'un etkin olduğundan emin olun.</Text>
                    </View>
                </View>
            )}
            
            {/* Sekme Navigasyonu */}
            <View style={styles.tabBar}>
                <TabButton 
                    title="Yeni Fiş" 
                    icon={IconPlus} 
                    isActive={activeTab === 'camera'}
                    onPress={() => setActiveTab('camera')}
                />
                <TabButton 
                    title={`Fişlerim (${receipts.length})`} 
                    icon={IconEdit3} 
                    isActive={activeTab === 'receipts'}
                    onPress={() => setActiveTab('receipts')}
                />
            </View>

            {/* Ana İçerik */}
            <ScrollView style={styles.mainContent}>
                {activeTab === 'camera' && (
                    <CameraScreen 
                        onAddReceipt={handleAddReceipt} 
                    />
                )}
                {activeTab === 'receipts' && (
                    <ReceiptsScreen 
                        receipts={receipts}
                        onDeleteReceipt={handleDeleteReceipt}
                        onEditReceipt={handleEditPress} 
                    />
                )}
            </ScrollView>
            
            {/* Footer ve Kullanıcı ID */}
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
        </View>
    );
};

// Basit Sekme Düğmesi
const TabButton = ({ title, icon: Icon, isActive, onPress }) => (
    <TouchableOpacity
        style={[
            styles.tabButton,
            isActive ? styles.tabButtonActive : styles.tabButtonInactive
        ]}
        onPress={onPress}
    >
        <Icon />
        <Text style={[styles.tabButtonText, isActive ? styles.tabButtonTextActive : {}]}>{title}</Text>
    </TouchableOpacity>
);

// === EKRAN BİLEŞENLERİ ===

const CameraScreen = ({ onAddReceipt }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryValue, setCategoryValue] = useState(''); 
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [isLoading, setIsLoading] = useState(false);
    
    const categoryLabel = CATEGORIES.find(c => c.value === categoryValue)?.label || 'Kategori Seçin';

    const handleAdd = async () => {
        const cleanedAmount = parseFloat(amount.toString().replace(/,/g, '.'));
        
        if (!title || !cleanedAmount || isNaN(cleanedAmount) || categoryValue === '') {
            Alert.alert("Hata", "Lütfen fiş başlığını, geçerli bir tutarı ve kategoriyi girin.");
            return;
        }

        const newReceipt = {
            title,
            amount: cleanedAmount,
            category: categoryLabel,
            categoryValue: categoryValue, 
            date: date || new Date().toISOString().slice(0, 10),
            imageUrl: 'Placeholder', 
            createdAt: new Date().toISOString(),
        };

        setIsLoading(true);
        try {
             await onAddReceipt(newReceipt);
             setTitle('');
             setAmount('');
             setCategoryValue('');
             setDate(new Date().toISOString().slice(0, 10));
        } catch (error) {
            // Hata runFirestoreOperation içinde ele alındı
        } finally {
             setIsLoading(false);
        }
    };
    
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Yeni Fiş Kaydet</Text>

            <View style={styles.cameraSection}>
                <View style={styles.receiptIconContainer}>
                    <Text style={styles.receiptIcon}>🧾</Text>
                </View>
                <TouchableOpacity 
                    style={styles.cameraButton}
                    onPress={() => Alert.alert("Bilgi", "Kamera/Yükleme işlevi bu simülasyonda devre dışı.")}
                >
                    <Text style={styles.cameraButtonText}>📸 Fiş Yükle</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.spaceY4}>
                <View>
                    <Text style={styles.label}>Fiş Başlığı</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Migros Market Alışverişi"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View>
                    <Text style={styles.label}>Kategori Seçimi</Text>
                    <CategorySelect
                        value={categoryValue}
                        onChange={setCategoryValue}
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Tutar (TL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            value={amount}
                            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Tarih</Text>
                        <TextInput
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity 
                style={[
                    styles.saveButton, 
                    (isLoading || !title || !amount || categoryValue === '') ? styles.saveButtonDisabled : styles.saveButtonEnabled
                ]} 
                onPress={handleAdd}
                disabled={isLoading || !title || !amount || categoryValue === ''}
            >
                {isLoading ? (
                    <Text style={styles.loadingTextButton}>⏳</Text>
                ) : (
                    <Text style={styles.saveButtonText}><IconPlus /> Fişi Kaydet</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const ReceiptsScreen = ({ receipts, onDeleteReceipt, onEditReceipt }) => {
    const [searchText, setSearchText] = useState('');
    const [sortKey, setSortKey] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc'); 
    
    const categorySummary = useMemo(() => {
        const summary = receipts.reduce((acc, receipt) => {
            const categoryName = receipt.category || 'Belirlenmemiş';
            const amount = receipt.amount || 0;
            if (!acc[categoryName]) { acc[categoryName] = 0; }
            acc[categoryName] += amount;
            return acc;
        }, {});

        const totalOverall = Object.values(summary).reduce((a, b) => a + b, 0);
        
        const summaryArray = Object.entries(summary)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total);

        return [{ category: 'TÜMÜ', total: totalOverall }, ...summaryArray];
    }, [receipts]);

    const sortedAndFilteredReceipts = useMemo(() => {
        let filtered = receipts.filter(receipt =>
            (receipt.title && receipt.title.toLowerCase().includes(searchText.toLowerCase())) ||
            (receipt.category && receipt.category.toLowerCase().includes(searchText.toLowerCase())) ||
            (receipt.amount && receipt.amount.toString().includes(searchText.replace(',', '.')))
        );

        filtered.sort((a, b) => {
            let valA, valB;
            if (sortKey === 'amount') {
                valA = a.amount;
                valB = b.amount;
            } else { 
                valA = sortKey === 'date' ? new Date(a.date).getTime() : a[sortKey] || '';
                valB = sortKey === 'date' ? new Date(b.date).getTime() : b[sortKey] || '';
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            } 
            else if (typeof valA === 'string' && typeof valB === 'string') {
                if (valA.localeCompare(valB) < 0) return sortOrder === 'asc' ? -1 : 1;
                if (valA.localeCompare(valB) > 0) return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return filtered;
    }, [receipts, searchText, sortKey, sortOrder]);
    
    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'date' ? 'desc' : 'asc'); 
        }
    };
    
    const getCategoryColor = (category) => {
        switch (category) {
            case 'Gıda & Market': return { bg: '#FFFBEB', text: '#B54708', border: '#FDBA74' };
            case 'Ulaşım': return { bg: '#ECFDF5', text: '#065F46', border: '#34D399' };
            case 'Fatura & Aidat': return { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' };
            case 'Eğlence': return { bg: '#F5F3FF', text: '#5B21B6', border: '#A78BFA' };
            case 'Giyim': return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' };
            default: return { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' };
        }
    };
    
    const ReceiptItem = ({ receipt }) => {
        const { bg, text } = getCategoryColor(receipt.category);
        return (
            <View style={[styles.receiptItem, { borderLeftColor: '#4F46E5' }]}>
                {/* Sol Kısım: Detaylar */}
                <View style={styles.receiptDetailContainer}>
                    <View style={styles.receiptIconBox}>
                        <Text style={styles.receiptIconBoxText}>🏷️</Text>
                    </View>
                    <View style={styles.receiptTextContainer}>
                        <Text style={styles.receiptTitle} numberOfLines={1}>{receipt.title}</Text>
                        <View style={[styles.categoryTag, { backgroundColor: bg }]}>
                            <Text style={[styles.categoryTagText, { color: text }]}>{receipt.category || 'Belirlenmemiş'}</Text>
                        </View>
                        <Text style={styles.receiptDate}>Tarih: {receipt.date}</Text>
                    </View>
                </View>

                {/* Sağ Kısım: Tutar ve Eylemler */}
                <View style={styles.receiptActionsContainer}>
                    <Text style={styles.receiptAmount}>{receipt.amount.toFixed(2)} TL</Text>
                    <View style={styles.receiptButtonRow}>
                        <TouchableOpacity 
                            style={styles.actionButtonEdit}
                            onPress={() => onEditReceipt(receipt)}
                        >
                            <IconEdit3 />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.actionButtonDelete}
                            onPress={() => onDeleteReceipt(receipt.id)}
                        >
                            <IconTrash2 />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };


    const SummaryItem = ({ item }) => (
        <View style={[styles.summaryItem, item.category === 'TÜMÜ' ? styles.summaryTotal : styles.summaryCategory]}>
            <Text style={item.category === 'TÜMÜ' ? styles.summaryTitleTotal : styles.summaryTitle}>
                {item.category}
            </Text>
            <Text style={item.category === 'TÜMÜ' ? styles.summaryAmountTotal : styles.summaryAmount}>
                {item.total.toFixed(2)} TL
            </Text>
        </View>
    );


    return (
        <View style={styles.screenWrapper}>
            <Text style={styles.screenTitle}>Fiş Listesi ve Özet</Text>

            {/* Özet Alanı */}
            {receipts.length > 0 && (
                <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>Harcama Özeti</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                        {categorySummary.map((item) => <SummaryItem key={item.category} item={item} />)}
                    </ScrollView>
                </View>
            )}

            {/* Arama ve Sıralama */}
            <View style={styles.searchSortCard}>
                <View style={styles.searchContainer}>
                    <IconSearch />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Başlık, Kategori veya Tutar Ara..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
                
                <View style={styles.sortContainer}>
                    <Text style={styles.sortLabel}>Sırala:</Text>
                    <SortButton 
                        label="Tarih" 
                        sortKey="date" 
                        currentSortKey={sortKey} 
                        sortOrder={sortOrder} 
                        onClick={toggleSort}
                    />
                    <SortButton 
                        label="Tutar" 
                        sortKey="amount" 
                        currentSortKey={sortKey} 
                        sortOrder={sortOrder} 
                        onClick={toggleSort}
                    />
                </View>
            </View>

            {/* Fiş Listesi */}
            <View>
                {sortedAndFilteredReceipts.length === 0 && receipts.length > 0 ? (
                    <EmptyState 
                        title="Filtreye Uyan Fiş Bulunamadı"
                        subtitle="Arama kriterlerinizi değiştirmeyi deneyin."
                        icon={() => <Text style={{fontSize: 40, color: '#A5B4FC'}}>🔍</Text>}
                    />
                ) : sortedAndFilteredReceipts.length === 0 ? (
                    <EmptyState 
                        title="Henüz Hiç Fiş Kaydetmediniz"
                        subtitle="Başlamak için 'Yeni Fiş' sekmesini kullanın."
                        icon={() => <Text style={{fontSize: 40, color: '#A5B4FC'}}>🧾</Text>}
                    />
                ) : (
                    sortedAndFilteredReceipts.map((receipt) => <ReceiptItem key={receipt.id} receipt={receipt} />)
                )}
            </View>
        </View>
    );
};

// Sıralama Düğmesi
const SortButton = ({ label, sortKey, currentSortKey, sortOrder, onClick }) => {
    const isActive = currentSortKey === sortKey;
    const isAsc = sortOrder === 'asc';
    
    return (
        <TouchableOpacity
            style={[
                styles.sortButton,
                isActive ? styles.sortButtonActive : styles.sortButtonInactive
            ]}
            onPress={() => onClick(sortKey)}
        >
            <Text style={isActive ? styles.sortButtonTextActive : styles.sortButtonText}>
                {label}
            </Text>
            {isActive && (
                isAsc ? <IconChevronUp /> : <IconChevronDown />
            )}
        </TouchableOpacity>
    );
};

// Boş Durum Bileşeni
const EmptyState = ({ title, subtitle, icon: Icon }) => (
    <View style={styles.emptyStateContainer}>
        <Icon />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    </View>
);

// === STİL TANIMLARI (StyleSheet) ===
const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        fontSize: 30,
        color: '#4F46E5',
        marginBottom: 8,
    },
    loadingTextSmall: {
        fontSize: 16,
        color: '#4B5563',
    },
    loadingTextButton: {
        fontSize: 20,
        color: 'white',
    },
    // Error Banner
    errorBanner: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        alignItems: 'flex-start',
    },
    errorTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    errorTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#B91C1C',
    },
    errorText: {
        fontSize: 13,
        color: '#B91C1C',
        marginTop: 4,
    },
    errorTextSmall: {
        fontSize: 11,
        color: '#B91C1C',
        opacity: 0.8,
        marginTop: 4,
    },
    // Tabs
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 4,
    },
    tabButtonActive: {
        borderBottomColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    tabButtonInactive: {
        borderBottomColor: 'transparent',
    },
    tabButtonText: {
        fontSize: 15,
        marginLeft: 6,
        color: '#6B7280',
    },
    tabButtonTextActive: {
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    mainContent: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#374151',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    cameraSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    receiptIconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    receiptIcon: {
        fontSize: 40,
        color: 'white',
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#4F46E5',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    cameraButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    spaceY4: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    input: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: 'white',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    flex1: {
        flex: 1,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#4B5563',
    },
    dropdownList: {
        position: 'absolute',
        top: 50,
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        maxHeight: 200,
        overflow: 'hidden',
    },
    dropdownItem: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedCheck: {
        color: '#4F46E5',
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        width: '100%',
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonEnabled: {
        backgroundColor: '#10B981',
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        padding: 8,
        backgroundColor: '#E5E7EB',
        borderTopWidth: 1,
        borderTopColor: '#D1D5DB',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#6B7280',
    },
    userIdText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        fontSize: 11,
        color: '#1F2937',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 12,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    modalBody: {
        maxHeight: 400,
        marginBottom: 16,
    },
    button: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonPrimary: {
        backgroundColor: '#10B981',
    },
    buttonSecondary: {
        backgroundColor: '#E5E7EB',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    screenWrapper: {
        alignSelf: 'center',
        width: '100%',
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#374151',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    summarySection: {
        marginBottom: 24,
    },
    summarySectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 12,
    },
    summaryScroll: {},
    summaryItem: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        minWidth: 140,
        borderTopWidth: 4,
    },
    summaryTotal: {
        backgroundColor: '#EEF2FF',
        borderTopColor: '#4F46E5',
    },
    summaryCategory: {
        backgroundColor: 'white',
        borderTopColor: '#D1D5DB',
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginBottom: 4,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    summaryTitleTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3730A3',
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    summaryAmountTotal: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3730A3',
    },
    searchSortCard: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    searchInput: {
        flex: 1,
        height: 40,
        marginLeft: 8,
        fontSize: 16,
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    sortLabel: {
        fontWeight: '500',
        color: '#4B5563',
        fontSize: 14,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 14,
    },
    sortButtonInactive: {
        backgroundColor: '#E5E7EB',
    },
    sortButtonActive: {
        backgroundColor: '#4F46E5',
    },
    sortButtonText: {
        color: '#374151',
        fontSize: 14,
    },
    sortButtonTextActive: {
        color: 'white',
        fontSize: 14,
    },
    receiptItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    receiptDetailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    receiptIconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    receiptIconBoxText: {
        fontSize: 24,
        color: 'white',
    },
    receiptTextContainer: {
        flex: 1,
    },
    receiptTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    receiptDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    receiptActionsContainer: {
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    receiptAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginBottom: 8,
    },
    receiptButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
    },
    actionButtonEdit: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FEF3C7',
    },
    actionButtonDelete: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        marginTop: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 12,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});

export default App;