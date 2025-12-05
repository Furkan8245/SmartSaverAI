import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
// Alert yerine console.error/log kullanıyoruz, çünkü React Native Canvas'ta alertler çalışmıyor.
// Gerçek bir RN uygulamasında burada özel bir Toast veya Modal bileşeni kullanılırdı.
// import { Alert } from 'react-native'; 
import { styles } from '../styles/AppStyles';
import { CATEGORIES } from '../constants/Config'; // Bu import'un Common.js'den geldiğini varsayıyoruz
import { IconX, IconEdit3, CategorySelect } from './Common'; // CategorySelect ve ikonlar

// --- 1. Düzenleme Modal Bileşeni (EditReceiptModal) ---
const EditReceiptModal = ({ isVisible, setIsVisible, currentReceipt, setCurrentReceipt, onUpdateReceipt }) => {
    if (!isVisible || !currentReceipt) return null;
    
    // Düzenleme sırasında categoryValue değişirse label'ı bulmak için
    const currentCategoryLabel = useMemo(() => {
        // CATEGORIES'i kontrol et, tanımlı değilse boş dizi kullan.
        return (CATEGORIES || []).find(c => c.value === currentReceipt.categoryValue)?.label || 'Kategori Seçin';
    }, [currentReceipt.categoryValue]);
    
    const handleUpdate = () => {
        // Tutar temizleme ve doğrulama
        let cleanedAmount;
        if (typeof currentReceipt.amount === 'string') {
            cleanedAmount = parseFloat(currentReceipt.amount.replace(/,/g, '.'));
        } else {
            cleanedAmount = parseFloat(currentReceipt.amount);
        }

        if (!currentReceipt.title || isNaN(cleanedAmount) || cleanedAmount <= 0 || currentReceipt.categoryValue === '') {
            console.error("HATA: Eksik Bilgi veya Geçersiz Tutar. Lütfen tüm alanları doldurun ve geçerli bir tutar girin.");
            // Gerçek RN uygulamasında: Toast.show(...)
            return;
        }
        
        const updatedReceipt = {
            ...currentReceipt,
            amount: cleanedAmount,
            category: currentCategoryLabel, // Kategori adı label'dan alınıyor
        };
        onUpdateReceipt(updatedReceipt);
        setIsVisible(false);
        setCurrentReceipt(null);
    };

    // React Native'deki Modal yerine basit View simülasyonu
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
                                // Eğer amount null veya undefined ise, boş string göster. Değilse stringe çevir.
                                value={currentReceipt.amount ? currentReceipt.amount.toString() : ''}
                                onChangeText={(text) => {
                                    // Sadece sayısal ve nokta karakterlerine izin ver
                                    const cleanedText = text.replace(/[^0-9.]/g, '');
                                    setCurrentReceipt({...currentReceipt, amount: cleanedText});
                                }}
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


// --- 2. Detay Görüntüleme/Kalem Düzenleme Modal Bileşeni (ReceiptDetailModal) ---
const ReceiptDetailModal = ({ isVisible, setIsVisible, receipt, onUpdateReceipt }) => {
    if (!isVisible || !receipt) return null;
    
    // State'ler
    const [editableItems, setEditableItems] = useState(receipt.items || []);
    const [isEditing, setIsEditing] = useState(false);

    // Fiş değiştiğinde state'i sıfırla ve kalemlere geçici ID ekle (useEffect yerine key kullanmak daha iyidir, ancak mevcut yapıyı koruyoruz)
    useEffect(() => {
        if (receipt) {
            // ID'si olmayan kalemlere geçici ID ekle. Bu ID sadece UI'da liste anahtarı olarak kullanılır.
            const itemsWithId = (receipt.items || []).map((item, index) => ({
                ...item, 
                // Geçici ID oluşturma: mevcut ID varsa onu kullan, yoksa benzersiz bir string oluştur
                id: item.id || Platform.OS + Date.now() + index + Math.random().toString(36).substring(2, 9)
            }));
            setEditableItems(itemsWithId);
            setIsEditing(false); // Modal açıldığında düzenleme kapalı başlasın
        }
    }, [receipt]); // Sadece receipt değiştiğinde çalışsın

    // Kalem verisini güncelleme
    const handleItemChange = (id, field, value) => {
        setEditableItems(prev => prev.map(item => {
            if (item.id === id) { 
                // Eğer alan 'price' ise sadece sayısal değerlere izin ver
                const cleanValue = field === 'price' ? value.replace(/[^0-9.]/g, '') : value;
                return { ...item, [field]: cleanValue };
            }
            return item;
        }));
    };
    
    // Toplam tutarı hesaplama
    const calculateTotal = (items) => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.price || '0');
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
    };

    // Kaydetme işlemi
    const handleSave = () => {
        // Geçerlilik kontrolü (ürün adı boş veya fiyat geçerli/pozitif olmalı)
        const hasInvalidItem = editableItems.some(item => {
            const price = parseFloat(item.price || '0');
            return !item.name.trim() || isNaN(price) || price <= 0;
        });
        
        if (hasInvalidItem) {
            console.error("HATA: Kaydedilemedi. Lütfen tüm ürün adlarını doldurun ve geçerli, pozitif fiyatlar girin.");
            // Gerçek RN uygulamasında: Toast.show(...)
            return;
        }

        const newTotal = calculateTotal(editableItems);
        const updatedReceipt = {
            ...receipt,
            // Geçici ID'leri kaldırarak ve yalnızca güncel alanları alarak kaydediyoruz
            items: editableItems.map(({ id, ...rest }) => ({
                name: rest.name, 
                price: parseFloat(rest.price).toFixed(2) // Fiyatı iki ondalık basamağa yuvarlayarak kaydet
            })), 
            amount: parseFloat(newTotal.toFixed(2)), // Yeni toplam tutarı kaydet (iki ondalık basamağa yuvarla)
        };

        onUpdateReceipt(updatedReceipt);
        setIsEditing(false);
        setIsVisible(false);
    };
    
    // Ürün Kalemi Satırı Bileşeni
    const DetailItemRow = ({ item, index }) => (
        <View style={styles.detailItemRow}>
            {isEditing ? (
                // Düzenleme Modu
                <>
                    <TextInput
                        style={[styles.itemInput, styles.itemInputName]}
                        value={item.name}
                        onChangeText={(text) => handleItemChange(item.id, 'name', text)}
                        placeholder="Ürün Adı"
                    />
                    <TextInput
                        style={[styles.itemInput, styles.itemInputPrice]}
                        value={item.price.toString()}
                        onChangeText={(text) => handleItemChange(item.id, 'price', text)}
                        keyboardType="numeric"
                        placeholder="Fiyat"
                    />
                    {/* SİLME BUTONU */}
                    <TouchableOpacity 
                        onPress={() => setEditableItems(prev => prev.filter(i => i.id !== item.id))}
                        style={styles.itemDeleteButton}
                    >
                         {/* IconX yerine Trash iconu daha uygun olabilir, ancak mevcut dosyada IconX kullanıldığı için korundu. */}
                         <Text style={{fontSize: 16, color: '#EF4444'}}>❌</Text> 
                    </TouchableOpacity>
                </>
            ) : (
                // Görüntüleme Modu
                <>
                    <Text style={styles.itemText} numberOfLines={1}>{index + 1}. {item.name}</Text>
                    <Text style={styles.itemPrice}>{parseFloat(item.price || 0).toFixed(2)} TL</Text>
                </>
            )}
        </View>
    );

    const handleCancelEdit = () => {
        // Düzenleme modundan çıkarken orijinal veriye dön
        const originalItemsWithId = (receipt.items || []).map((item, index) => ({
            ...item, 
            id: item.id || Platform.OS + Date.now() + index + Math.random().toString(36).substring(2, 9)
        }));
        setEditableItems(originalItemsWithId);
        setIsEditing(false);
    };
    
    // YENİ KALEM EKLEME
    const handleAddNewItem = () => {
        setEditableItems(prev => [
            ...prev,
            {
                id: Platform.OS + Date.now() + Math.random().toString(36).substring(2, 9),
                name: "",
                price: "0.00"
            }
        ]);
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{receipt.title} Fiş Detayı</Text>
                    <TouchableOpacity onPress={() => setIsVisible(false)}>
                        <IconX />
                    </TouchableOpacity>
                </View>
                
                {/* Özet Bilgiler */}
                <View style={styles.detailSummary}>
                    <Text style={styles.detailSummaryText}>
                        Kategori: <Text style={{fontWeight: 'bold', color: '#1F2937'}}>{receipt.category}</Text>
                    </Text>
                    <Text style={styles.detailSummaryText}>
                        Tarih: <Text style={{fontWeight: 'bold', color: '#1F2937'}}>{receipt.date}</Text>
                    </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>{isEditing ? 'YENİ TOPLAM' : 'TOPLAM TUTAR'}:</Text>
                    <Text style={styles.detailTotalAmount}>{calculateTotal(editableItems).toFixed(2)} TL</Text>
                </View>

                {/* Kalemler Listesi */}
                <ScrollView style={styles.modalBody}>
                    <View style={styles.itemsHeader}>
                        <Text style={styles.itemsHeaderLeft}>Ürün Adı</Text>
                        <Text style={styles.itemsHeaderRight}>Fiyat</Text>
                    </View>
                    {editableItems.map((item, index) => (
                        <DetailItemRow key={item.id} item={item} index={index} />
                    ))}
                    {editableItems.length === 0 && (
                        <Text style={styles.emptyListText}>Bu fişte kalem detayı yok.</Text>
                    )}
                
                    {isEditing && (
                        <TouchableOpacity style={styles.addItemButton} onPress={handleAddNewItem}>
                            <Text style={styles.addItemButtonText}>+ Yeni Ürün Ekle</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
                
                {/* Eylem Butonları */}
                <View style={styles.buttonRow}>
                    {isEditing ? (
                        // Kaydet/İptal Butonları
                        <>
                            <TouchableOpacity style={[styles.button, styles.buttonPrimary, {flex: 1, marginRight: 8}]} onPress={handleSave}>
                                <Text style={styles.buttonText}>✓ Değişiklikleri Kaydet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.buttonSecondary, {flex: 1}]} onPress={handleCancelEdit}>
                                <Text style={[styles.buttonText, {color: '#4B5563'}]}>İptal</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        // Düzenlemeyi Başlat Butonu
                        // Not: Fişte kalem detayı olmasa bile, kullanıcıya manuel ekleme şansı vermek için düzenlemeyi başlatabiliriz.
                        <TouchableOpacity 
                            style={[styles.button, styles.buttonSecondary, {flex: 1}]}
                            onPress={() => setIsEditing(true)}
                        >
                            <Text style={[styles.buttonText, {color: '#4B5563', textAlign: 'center'}]}><IconEdit3 /> Kalemleri Düzenle</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

export { EditReceiptModal, ReceiptDetailModal };