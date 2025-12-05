// src/screens/CameraScreen.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import * as FileSystem from 'expo-file-system';

import * as ImageManipulator from 'expo-image-manipulator';

import { httpsCallable, getFunctions } from 'firebase/functions'; // Firebase Functions

import { getApp } from 'firebase/app'; 


import { styles } from '../styles/AppStyles';
import { CATEGORIES } from '../config/firebaseConfig'; // <-- YOL DÜZELTİLDİ: ../constants/Config yerine ../config/firebaseConfig kullanıldı.
import { 
    IconPlus, 
    IconCamera, 
    IconImage, 
    CategorySelect 
} from '../components/Common';

// Helper fonksiyon: Firebase Functions instance'ı döner
const getFunctionsInstance = () => {
    try {
        const app = getApp();
        return getFunctions(app);
    } catch (e) {
        console.error("Firebase App veya Functions başlatılamadı:", e);
        return null;
    }
}


export const CameraScreen = ({ onAddReceipt, allReceipts }) => {
    const [title, setTitle] = useState('');
    const [categoryValue, setCategoryValue] = useState(''); 
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [isLoading, setIsLoading] = useState(false);
    
    const [itemName, setItemName] = useState(''); 
    const [itemPrice, setItemPrice] = useState(''); 
    const [currentItems, setCurrentItems] = useState([]);
    
    const [isImageProcessed, setIsImageProcessed] = useState(false);
    const [imageUrl, setImageUrl] = useState(null); 

    
    // Hata kontrolü eklendi: CATEGORIES'in varlığını kontrol et
    const categoryLabel = CATEGORIES && CATEGORIES.find(c => c.value === categoryValue)?.label || 'Kategori Seçin';
    
    // YENİ: Cloud Function ile Gemini API Çağrısı
    const handleSimulateProductRecognition = useCallback(async () => {
        if (!imageUrl) {
            Alert.alert("Hata", "Lütfen önce fotoğraf çekin veya galeriden seçin.");
            return;
        }
        
        setIsLoading(true);
        let base64Image = null;
        let mimeType = 'image/jpeg';
        
        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                imageUrl,
                [{ resize: { width: 1000 } }], 
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (manipResult.base64) {
                 base64Image = manipResult.base64;
                 mimeType = 'image/jpeg';
            } else {
                 base64Image = await FileSystem.readAsStringAsync(imageUrl, {
                     encoding: FileSystem.EncodingType.Base64,
                 });
            }
        } catch (e) {
            console.error("Görüntü işleme hatası:", e);
            Alert.alert("Hata", "Görüntü işlenemedi.");
            setIsLoading(false);
            return;
        }

        try {
            const functionsInstance = getFunctionsInstance();
            if (!functionsInstance) {
                Alert.alert("Hata", "Firebase Functions başlatılamadı. Mock/Hata modunda.");
                setIsLoading(false);
                return;
            }

            // HATA DÜZELTME: Fonksiyon adını Cloud Functions'ta daha sık kullanılan
            // veya genel bir isim olan 'processImage' olarak güncelliyoruz.
            // Gerçek fonksiyon adınız farklıysa bu kısmı değiştirmeniz gerekebilir.
            const processReceipt = httpsCallable(functionsInstance, 'processImage'); 
            const result = await processReceipt({ base64Image, mimeType });
            const { items: recognizedItems, error } = result.data;

            setIsLoading(false);
            setIsImageProcessed(true);

            if (error) {
                Alert.alert("Tanıma Başarısız", error);
                setItemName('');
                setItemPrice('');
                return;
            }

            if (recognizedItems && recognizedItems.length > 0) {
                const itemsWithIds = recognizedItems.map((item, index) => ({
                     ...item,
                     id: Date.now() + index + Math.random().toString(36).substring(7) 
                }));
                setCurrentItems(itemsWithIds);
                
                Alert.alert("AI Tanıma Başarılı", `${recognizedItems.length} ürün başarıyla listeye eklendi. Listeyi kontrol edip kaydedebilirsiniz.`);
                
                if (itemsWithIds[0]) {
                     setItemName(itemsWithIds[0].name);
                     setItemPrice(itemsWithIds[0].price.toString());
                }

            } else {
                Alert.alert("Ürün Bulunamadı", "Yapay zeka bu makbuzda okunaklı bir ürün kalemi bulamadı. Lütfen manuel deneyin.");
            }

        } catch (e) {
            // Log'da gördüğümüz [FirebaseError: not-found] hatası bu alana düşer.
            console.error("Cloud Function Çağrı Hatası:", e);
            setIsLoading(false);
            Alert.alert("Hata", `API çağrısında hata oluştu: ${e.message}. Cloud Function adını kontrol edin.`);
        }
    }, [imageUrl]);
    
    // İzinleri Kontrol Etme
    const requestPermissions = useCallback(async () => {
        if (Platform.OS !== 'web') {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            // ImagePicker.MediaTypeOptions uyarısı için:
            // Bu uyarıya rağmen şimdilik kodu değiştirmeden bırakıyoruz, çünkü fonksiyonun kendisi hala çalışıyor.
            
            if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
                Alert.alert(
                    "İzin Gerekli", 
                    "Uygulamanın fotoğraflarınıza erişim izni ve kamera izni olması gerekiyor!"
                );
                return false;
            }
        }
        return true;
    }, []);

    // Fotoğraf Çekme
    const handleTakePhoto = async () => {
        if (!(await requestPermissions())) return;

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUrl(result.assets[0].uri);
            setIsImageProcessed(false);
        }
    };
    
    // Galeriden Fotoğraf Seçme
    const handlePickImage = async () => {
        if (!(await requestPermissions())) return;

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUrl(result.assets[0].uri);
            setIsImageProcessed(false);
        }
    };
    
    // Toplam Tutar Hesaplama
    const totalAmount = useMemo(() => {
        return currentItems.reduce((sum, item) => sum + item.price, 0);
    }, [currentItems]);

    // Ürünü listeye ekle
    const handleAddItem = () => {
        const cleanedPrice = parseFloat(itemPrice.toString().replace(/,/g, '.'));
        if (!itemName || isNaN(cleanedPrice) || cleanedPrice <= 0) {
            Alert.alert("Hata", "Lütfen geçerli bir ürün adı ve fiyatı girin.");
            return;
        }

        setCurrentItems(prev => [...prev, { 
            name: itemName.trim(), 
            price: cleanedPrice, 
            id: Date.now() + Math.random().toString(36).substring(7) 
        }]);
        setItemName('');
        setItemPrice('');
    };

    // Ürünü listeden çıkar
    const handleRemoveItem = (id) => {
        setCurrentItems(prev => prev.filter(item => item.id !== id));
    };
    
    // Geçmiş Fiyat Sorgusu
    const previousPrices = useMemo(() => {
        if (!itemName || !allReceipts || allReceipts.length === 0) return [];
        
        const query = itemName.trim().toLowerCase();
        
        const historyWithDate = allReceipts
             .flatMap(receipt => (receipt.items || []).map(item => ({...item, receiptDate: receipt.date})))
             .filter(item => item.name && item.name.toLowerCase().includes(query))
             .sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime());
             
        return historyWithDate.slice(0, 5).map(item => ({
            price: item.price.toFixed(2), 
            date: item.receiptDate 
        }));
        
    }, [itemName, allReceipts]);

    // Fişi Kaydet
    const handleAdd = async () => {
        if (!title || categoryValue === '' || currentItems.length === 0) {
            Alert.alert("Hata", "Lütfen fiş başlığını, kategoriyi girin ve en az bir ürün ekleyin.");
            return;
        }


        // CATEGORIES'in varlığını kontrol edin
        const finalCategoryLabel = CATEGORIES 
            ? CATEGORIES.find(c => c.value === categoryValue)?.label || 'Bilinmeyen Kategori'
            : 'Bilinmeyen Kategori'; // Fallback

        const newReceipt = {
            title,
            amount: totalAmount, 
            category: finalCategoryLabel, // Düzeltilmiş veya fallback değer
            categoryValue: categoryValue, 
            date: date || new Date().toISOString().slice(0, 10),
            imageUrl: imageUrl || 'Manuel Giriş', 
            createdAt: new Date().toISOString(),
            items: currentItems.map(({ id, ...rest }) => rest), 
        };

        setIsLoading(true);
        try {
             await onAddReceipt(newReceipt); 
             setTitle('');
             setItemName('');
             setItemPrice('');
             setCategoryValue('');
             setDate(new Date().toISOString().slice(0, 10));
             setCurrentItems([]); 
             setIsImageProcessed(false); 
             setImageUrl(null);
        } catch (error) {
            // Hata runFirestoreOperation içinde ele alındı
        } finally {
             setIsLoading(false);
        }
    };
    
    // Yardımcı Bileşen: Eklenmiş Ürün Satırı
    const CurrentItem = ({ item, onRemove }) => (
        <View style={styles.currentItemRow}>
            <Text style={styles.currentItemText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.currentItemPrice}>{item.price.toFixed(2)} TL</Text>
            <TouchableOpacity onPress={() => onRemove(item.id)}>
                <Text style={{fontSize: 16, color: '#DC2626'}} >❌</Text>
            </TouchableOpacity>
        </View>
    );
    
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Yeni Fiş Kaydet (Akıllı Giriş)</Text>

                {/* Fiş Tarama Simülasyonu -> Ürün Tanıma Simülasyonu */}
                <View style={styles.imageUploadSection}>
                    <Text style={styles.imageUploadTitle}>
                        📸 Ürün Görseli Yükleme
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.imagePlaceholder, imageUrl && styles.imagePlaceholderProcessed]}
                        onPress={() => imageUrl ? handleSimulateProductRecognition() : handlePickImage()}
                    >
                        {imageUrl ? (
                            <View>
                                 <Text style={{fontSize: 30}}>🖼️</Text>
                                 <Text style={styles.imagePlaceholderText}>Görsel Yüklendi. Tanımak İçin Tıkla!</Text>
                            </View>
                        ) : (
                            <View style={{alignItems: 'center'}}>
                                <Text style={{fontSize: 30}}>📷/🖼️</Text>
                                <Text style={styles.imagePlaceholderText}>Fotoğraf Çek veya Galeriden Seç</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary, styles.flex1]}
                            onPress={handleTakePhoto}
                        >
                            <Text style={[styles.buttonText, {color: '#4B5563'}]}><IconCamera /> Fotoğraf Çek</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary, styles.flex1]}
                            onPress={handlePickImage}
                        >
                            <Text style={[styles.buttonText, {color: '#4B5563'}]}><IconImage /> Galeriden Seç</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button, 
                            styles.processButton, 
                            { marginTop: 10 },
                            isLoading || !imageUrl ? styles.addItemButtonDisabled : styles.processButton 
                        ]}
                        onPress={handleSimulateProductRecognition}
                        disabled={isLoading || !imageUrl}
                    >
                        {isLoading ? (
                            <Text style={[styles.buttonText, styles.processButtonText]}>🤖 Yükleniyor...</Text>
                        ) : (
                            <Text style={[styles.buttonText, styles.processButtonText]}>
                                🤖 Görüntüyü İşle ve Ürün Adını Doldur
                            </Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.manualEntryHint}>
                        {isImageProcessed ? `Tanınan ürün: ${itemName}` : imageUrl ? 'Görüntüyü işlemek için yukarıdaki butona tıklayın.' : 'Kamera veya Galeriden görsel yükleyin.'}
                    </Text>
                </View>

                <View style={styles.divider} /> 

                <View style={styles.spaceY4}>
                    <View>
                        <Text style={styles.label}>Fiş Başlığı</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Haftalık Market Alışverişi"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Kategori Seçimi</Text>
                            <CategorySelect
                                value={categoryValue}
                                onChange={setCategoryValue}
                            />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Fiş Tarihi</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />
                
                <View style={styles.mlFeatureBox}>
                    <Text style={styles.mlFeatureTitle}>🛒 Ürün Adı Girişi</Text>
                    <Text style={styles.mlFeatureText}>
                        Yukarıdaki **Ürün Tanıma** özelliği (kamera) kullanılırsa ürün ismi bu alana düşer.
                    </Text>
                    <Text style={styles.mlFeatureText}>
                        Bu alana herhangi bir ürün ismi **(örn: Süt, Yumurta, Muz, Peynir)** yazdığınız anda, uygulamanın geçmiş fiyatları anında getirerek size tasarruf imkanı sunduğunu test edebilirsiniz.
                    </Text>
                </View>

                <Text style={styles.sectionHeader}>Ürün Ekle ({currentItems.length} ürün, Toplam: {totalAmount.toFixed(2)} TL)</Text>
                
                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={[styles.label, {color: '#4F46E5', fontWeight: 'bold'}]}>
                            Ürün Adı (ML Sonucu Buraya Düşer)
                        </Text>
                        <TextInput
                            style={[styles.input, previousPrices.length > 0 && {borderColor: '#FDBA74', borderWidth: 2}]}
                            placeholder="Elma, Ekmek, Süt..."
                            value={itemName}
                            onChangeText={setItemName}
                        />
                    </View>
                    <View style={{ width: 100 }}>
                        <Text style={styles.label}>Fiyat (TL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            value={itemPrice}
                            onChangeText={(text) => setItemPrice(text.replace(/[^0-9.]/g, ''))}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.addItemButton, (!itemName || !itemPrice || isNaN(parseFloat(itemPrice)) || parseFloat(itemPrice) <= 0) ? styles.addItemButtonDisabled : styles.addItemButtonEnabled]}
                        onPress={handleAddItem}
                        disabled={!itemName || !itemPrice || isNaN(parseFloat(itemPrice)) || parseFloat(itemPrice) <= 0}
                    >
                        <IconPlus />
                    </TouchableOpacity>
                </View>
                
                {previousPrices.length > 0 && (
                    <View style={styles.historicalPrices}>
                        <Text style={styles.historicalPriceHeader}>
                            {itemName.trim()} için Geçmiş Fiyatlar ({previousPrices.length} Kayıt):
                        </Text>
                        {previousPrices.map((p, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.historicalPriceRow}
                                onPress={() => setItemPrice(p.price)}
                            >
                                <Text style={styles.historicalPriceText}>
                                    {p.price} TL ({p.date})
                                </Text>
                                <Text style={styles.historicalPriceAction}>Kullan</Text>
                            </TouchableOpacity>
                        ))}
                        <Text style={styles.historicalPriceHint}>
                            Yukarıdaki fiyatlardan birine dokunarak mevcut fiyat alanına otomatik doldurabilirsiniz.
                        </Text>
                    </View>
                )}

                <ScrollView style={styles.itemsListContainer}>
                    {currentItems.map((item) => (
                        <CurrentItem key={item.id} item={item} onRemove={handleRemoveItem} />
                    ))}
                    {currentItems.length === 0 && (
                        <Text style={styles.emptyListText}>Henüz fiş kalemi eklenmedi. Lütfen ürünleri tek tek ekleyin veya "Görüntüyü İşle"yi kullanın.</Text>
                    )}
                </ScrollView>

                <TouchableOpacity 
                    style={[
                        styles.saveButton, 
                        (isLoading || !title || categoryValue === '' || currentItems.length === 0) ? styles.saveButtonDisabled : styles.saveButtonEnabled
                    ]} 
                    onPress={handleAdd}
                    disabled={isLoading || !title || categoryValue === '' || currentItems.length === 0}
                >
                    {isLoading ? (
                        <Text style={styles.loadingTextButton}>⏳</Text>
                    ) : (
                        <Text style={styles.saveButtonText}><IconPlus /> Fişi Kaydet ({totalAmount.toFixed(2)} TL)</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default CameraScreen;