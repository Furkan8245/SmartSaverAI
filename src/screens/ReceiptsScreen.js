import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, TextInput, Modal, ScrollView } from 'react-native';

// Sabit Kategori Listesi (CameraScreen ile senkronize olmalı)
const CATEGORIES = [
    { label: 'Kategori Seçin', value: '' },
    { label: 'Gıda & Market', value: 'GidaMarket' },
    { label: 'Ulaşım', value: 'Ulasim' },
    { label: 'Fatura & Aidat', value: 'Fatura' },
    { label: 'Eğlence', value: 'Eglence' },
    { label: 'Giyim', value: 'Giyim' },
    { label: 'Diğer', value: 'Diger' },
];

// Prop olarak: { receipts, onDeleteReceipt, onUpdateReceipt, globalError }
const ReceiptsScreen = ({ receipts, onDeleteReceipt, onUpdateReceipt, globalError }) => {
    const [searchText, setSearchText] = useState('');
    const [sortKey, setSortKey] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc'); 
    
    // Düzenleme Modal State'leri
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    // --- Düzenleme Modal İşlevleri ---
    const handleEditPress = (receipt) => {
        // Düzenleme için fişin tüm verilerini kopyala
        setCurrentReceipt({
            ...receipt,
            // Tutarın sayısal alanına uygun olarak string'e çevrilmesi
            amount: receipt.amount ? receipt.amount.toString() : '', 
            // Kategori label'dan value'ya dönüşüm (Düzenleme Modal'ı için gerekli)
            categoryValue: CATEGORIES.find(c => c.label === receipt.category)?.value || ''
        });
        setIsEditModalVisible(true);
    };

    const handleUpdate = () => {
        // Tutarın temizlenmiş ve sayıya dönüştürülmüş hali
        const cleanedAmount = parseFloat(currentReceipt.amount.replace(/,/g, '.'));
        
        if (!currentReceipt.title || !cleanedAmount || !currentReceipt.categoryValue) {
            Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun ve geçerli bir tutar girin.");
            return;
        }
        
        const updatedReceipt = {
            ...currentReceipt,
            amount: cleanedAmount,
            // Kaydedilecek kategori label'ını bul
            category: CATEGORIES.find(c => c.value === currentReceipt.categoryValue)?.label || 'Diğer',
        };

        onUpdateReceipt(updatedReceipt);
        setIsEditModalVisible(false);
        setCurrentReceipt(null);
    };
    
    // Fiş Silme İşlemi
    const confirmDelete = (id) => {
        Alert.alert(
            "Silme Onayı",
            "Bu fişi kalıcı olarak silmek istediğinizden emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                { text: "Sil", onPress: () => onDeleteReceipt(id), style: "destructive" },
            ]
        );
    };

    // -----------------------------------------------------------
    // Kategoriye Göre Harcama Özeti Hesaplama
    // -----------------------------------------------------------
    const categorySummary = useMemo(() => {
        const summary = receipts.reduce((acc, receipt) => {
            const categoryName = receipt.category || 'Belirlenmemiş';
            const amount = receipt.amount || 0;
            
            if (!acc[categoryName]) {
                acc[categoryName] = 0;
            }
            acc[categoryName] += amount;
            return acc;
        }, {});

        // Özeti en çok harcanandan en aza doğru sırala
        return Object.entries(summary)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total);

    }, [receipts]);

    // -----------------------------------------------------------

    // Fişleri filtreleme ve sıralama
    const sortedAndFilteredReceipts = useMemo(() => {
        let filtered = receipts.filter(receipt =>
            (receipt.title && receipt.title.toLowerCase().includes(searchText.toLowerCase())) ||
            (receipt.category && receipt.category.toLowerCase().includes(searchText.toLowerCase())) ||
            receipt.amount.toString().includes(searchText)
        );

        // Sıralama
        filtered.sort((a, b) => {
            let valA, valB;

            if (sortKey === 'amount') {
                valA = a.amount;
                valB = b.amount;
            } else { // 'date' veya varsayılan
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [receipts, searchText, sortKey, sortOrder]);
    
    // Sıralama durumunu değiştirme
    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };
    
    // Liste öğesi (Receipt Card)
    const renderReceipt = ({ item }) => (
        <View style={styles.receiptCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.receiptImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.receiptTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Yok'}</Text>
                </View>
                <Text style={styles.receiptDetail}>
                    <Text style={styles.label}>Tarih:</Text> {item.date}
                </Text>
                <Text style={styles.receiptAmount}>
                    {item.amount.toFixed(2)} TL
                </Text>
            </View>
            {/* Düzenleme ve Silme Butonları */}
            <View style={styles.actionButtons}>
                 <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.editButton}>
                    <Text style={styles.editText}>✍</Text> 
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>X</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Kategori Özetini Render Etme
    const renderSummaryItem = ({ item }) => (
        <View style={styles.summaryItem}>
            <Text style={styles.summaryCategory}>{item.category}</Text>
            <Text style={styles.summaryTotal}>{item.total.toFixed(2)} TL</Text>
        </View>
    );
    
    // --------------------------------------------------------------
    // Kategori Seçimi Modal Bileşeni
    // --------------------------------------------------------------
    const CategorySelectModal = ({ modalVisible, setModalVisible, selectedValue, onSelect }) => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <Text style={modalStyles.modalTitle}>Kategori Seçin</Text>
                    <FlatList
                        data={CATEGORIES.filter(c => c.value !== '')}
                        keyExtractor={item => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={modalStyles.option}
                                onPress={() => {
                                    onSelect(item.value);
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={modalStyles.optionText}>{item.label}</Text>
                                {item.value === selectedValue && <Text style={modalStyles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={[modalStyles.button, modalStyles.buttonClose]}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={modalStyles.textStyle}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Düzenleme Modal'ı
    const EditReceiptModal = () => {
        const [isCategorySelectVisible, setIsCategorySelectVisible] = useState(false);
        
        if (!currentReceipt) return null;
        
        // Görünen kategorinin label'ı
        const currentCategoryLabel = CATEGORIES.find(c => c.value === currentReceipt.categoryValue)?.label || 'Kategori Seçin';

        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={editModalStyles.centeredView}>
                    <ScrollView contentContainerStyle={editModalStyles.modalView}>
                        <Text style={editModalStyles.modalTitle}>Fiş Detaylarını Düzenle</Text>
                        
                        <View style={editModalStyles.inputGroup}>
                            <Text style={editModalStyles.label}>Fiş Başlığı</Text>
                            <TextInput
                                style={editModalStyles.input}
                                value={currentReceipt.title}
                                onChangeText={(text) => setCurrentReceipt({...currentReceipt, title: text})}
                                placeholder="Başlık girin"
                            />
                        </View>
                        
                        <View style={editModalStyles.inputGroup}>
                            <Text style={editModalStyles.label}>Kategori Seçimi</Text>
                            <TouchableOpacity 
                                style={editModalStyles.pickerDisplay}
                                onPress={() => setIsCategorySelectVisible(true)}
                            >
                                <Text style={editModalStyles.pickerTextSelected}>
                                    {currentCategoryLabel}
                                </Text>
                                <Text style={editModalStyles.pickerIcon}>▼</Text>
                            </TouchableOpacity>
                        </View>

                        {/* İKİ SÜTUNLU YATAY DÜZEN */}
                        <View style={editModalStyles.twoColumnRow}>
                            <View style={editModalStyles.halfInputGroup}>
                                <Text style={editModalStyles.label}>Tutar (TL)</Text>
                                <TextInput
                                    style={editModalStyles.input}
                                    value={currentReceipt.amount}
                                    onChangeText={(text) => setCurrentReceipt({...currentReceipt, amount: text.replace(/[^0-9.]/g, '')})}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                />
                            </View>

                            <View style={editModalStyles.halfInputGroup}>
                                <Text style={editModalStyles.label}>Tarih (Opsiyonel)</Text>
                                <TextInput
                                    style={editModalStyles.input}
                                    value={currentReceipt.date}
                                    onChangeText={(text) => setCurrentReceipt({...currentReceipt, date: text})}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>
                        {/* İKİ SÜTUNLU YATAY DÜZEN SONU */}


                        <TouchableOpacity
                            style={editModalStyles.buttonUpdate}
                            onPress={handleUpdate}
                        >
                            <Text style={editModalStyles.buttonText}>✓ KAYDET ve GÜNCELLE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={editModalStyles.buttonCancel}
                            onPress={() => setIsEditModalVisible(false)}
                        >
                            <Text style={editModalStyles.buttonTextCancel}>İptal Et</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <CategorySelectModal 
                        modalVisible={isCategorySelectVisible}
                        setModalVisible={setIsCategorySelectVisible}
                        selectedValue={currentReceipt.categoryValue}
                        onSelect={(value) => setCurrentReceipt({...currentReceipt, categoryValue: value})}
                    />
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <EditReceiptModal />
            
            {/* Global Hata Mesajı (Mock Modu Uyarısı) */}
            {globalError && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{globalError}</Text>
                    <Text style={styles.errorTextSmall}>(Veriler sayfa yenilenince kaybolur.)</Text>
                </View>
            )}

            <Text style={styles.header}>Fiş Listesi ({receipts.length})</Text>

            {/* Kategori Harcama Özeti */}
            {receipts.length > 0 && (
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Kategoriye Göre Toplam Gider</Text>
                    <FlatList
                        data={categorySummary}
                        renderItem={renderSummaryItem}
                        keyExtractor={item => item.category}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.summaryList}
                    />
                </View>
            )}

            {/* Arama Çubuğu */}
            <TextInput
                style={styles.searchInput}
                placeholder="Başlık, Kategori veya Tutar Ara..."
                value={searchText}
                onChangeText={setSearchText}
            />
            
            {/* Sıralama Kontrolleri */}
            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sırala:</Text>
                <TouchableOpacity onPress={() => toggleSort('date')} style={styles.sortButton}>
                    <Text style={styles.sortText}>Tarih {sortKey === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleSort('amount')} style={styles.sortButton}>
                    <Text style={styles.sortText}>Tutar {sortKey === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
                </TouchableOpacity>
            </View>

            {/* Liste */}
            {sortedAndFilteredReceipts.length === 0 && receipts.length > 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Arama kriterlerine uyan fiş bulunamadı.</Text>
                </View>
            ) : sortedAndFilteredReceipts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Hiç fişiniz yok. Kamera sekmesinden yeni fiş ekleyin.</Text>
                </View>
            ) : (
                <FlatList
                    data={sortedAndFilteredReceipts}
                    renderItem={renderReceipt}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorBanner: {
        backgroundColor: '#fff3cd', 
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: '#ffc107',
        marginVertical: 10,
    },
    errorText: {
        color: '#856404',
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorTextSmall: {
        color: '#856404',
        fontSize: 12,
    },
    searchInput: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    summaryContainer: {
        marginBottom: 15,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        paddingHorizontal: 15,
        marginBottom: 8,
    },
    summaryList: {
        paddingHorizontal: 10,
    },
    summaryItem: {
        backgroundColor: '#e6f7ff', 
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#91d5ff',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    summaryCategory: {
        fontSize: 12,
        fontWeight: '500',
        color: '#096dd9',
    },
    summaryTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF', 
        marginTop: 2,
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    sortLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginRight: 10,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    sortText: {
        fontSize: 14,
        color: '#333',
    },
    receiptCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    receiptImage: {
        width: 60,
        height: 60,
        borderRadius: 6,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    infoContainer: {
        flex: 1,
        marginRight: 10,
    },
    receiptTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    categoryBadge: {
        backgroundColor: '#FF6F61',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    receiptDetail: {
        fontSize: 12,
        color: '#777',
    },
    label: {
        fontWeight: 'bold',
    },
    receiptAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF', 
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'column',
        alignItems: 'center',
        marginLeft: 10,
    },
    editButton: {
        padding: 6,
        backgroundColor: '#e6e6fa',
        borderRadius: 20,
        marginBottom: 8,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editText: {
        color: '#800080', // Mor
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 6,
        backgroundColor: '#ffdddd',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: {
        color: '#FF6F61',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    }
});

// Kategori Seçim Modal Stilleri (EditModal için de kullanıldı)
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    },
    modalView: {
        width: '85%',
        maxHeight: '60%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    option: {
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    checkmark: {
        color: '#FF6F61',
        fontWeight: 'bold',
        fontSize: 18,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

// Düzenleme Modal'ı için Özel ve Şık Stiller
const editModalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        // GÜNCELLENDİ: Daha da küçültüldü ve ortalandı
        width: '80%', // Ekranın %80'i
        maxWidth: 380, // Maksimum genişlik 380 piksel
        maxHeight: '75%', // Dikeyde maksimum %75 yer kapla
        alignSelf: 'center', 
        
        backgroundColor: '#fff', 
        borderRadius: 15,
        padding: 25,
        // Şık gölge
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 15,
    },
    modalTitle: {
        fontSize: 22, // Başlık boyutu biraz küçültüldü
        fontWeight: '800', 
        color: '#333', 
        marginBottom: 20, // Boşluk küçültüldü
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#FF6F61', 
        paddingBottom: 8,
    },
    inputGroup: {
        marginBottom: 15, // Boşluk küçültüldü
    },
    twoColumnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15, // Boşluk küçültüldü
    },
    halfInputGroup: {
        width: '48%', 
    },
    label: {
        fontSize: 13, // Etiket boyutu küçültüldü
        color: '#333',
        marginBottom: 6,
        fontWeight: '700',
        textTransform: 'uppercase', 
    },
    input: {
        backgroundColor: '#f0f0f5', 
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10, // İç boşluk küçültüldü
        fontSize: 15, // Yazı boyutu küçültüldü
        color: '#333',
        fontWeight: '500',
    },
    pickerDisplay: {
        backgroundColor: '#f0f0f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12, // İç boşluk küçültüldü
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerTextSelected: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    pickerIcon: {
        fontSize: 16,
        color: '#FF6F61', 
        fontWeight: 'bold',
    },
    buttonUpdate: {
        backgroundColor: '#4CAF50', 
        padding: 14, // İç boşluk küçültüldü
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20, 
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonCancel: {
        backgroundColor: '#ffdddd', 
        padding: 14, // İç boşluk küçültüldü
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8, // Boşluk küçültüldü
        borderWidth: 1,
        borderColor: '#FF6F61',
    },
    buttonText: {
        color: 'white',
        fontSize: 16, // Yazı boyutu küçültüldü
        fontWeight: 'bold',
    },
    buttonTextCancel: {
        color: '#FF6F61',
        fontSize: 15, // Yazı boyutu küçültüldü
        fontWeight: '600',
    },
});

export default ReceiptsScreen;