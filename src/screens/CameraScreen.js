import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
// Hatalı Picker paketi kaldırıldı. Yerine standart bileşenler kullanılıyor.

// Sabit Kategori Listesi
const CATEGORIES = [
    { label: 'Kategori Seçin', value: '' },
    { label: 'Gıda & Market', value: 'GidaMarket' },
    { label: 'Ulaşım', value: 'Ulasim' },
    { label: 'Fatura & Aidat', value: 'Fatura' },
    { label: 'Eğlence', value: 'Eglence' },
    { label: 'Giyim', value: 'Giyim' },
    { label: 'Diğer', value: 'Diger' },
];

// Prop olarak: { onSaveReceipt }
const CameraScreen = ({ onSaveReceipt }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(''); 
    const [isPickerVisible, setIsPickerVisible] = useState(false); // Yeni Modal durumu
    const [isLoading, setIsLoading] = useState(false);
    
    // Kategorinin görünen adını bul
    const selectedCategoryLabel = CATEGORIES.find(c => c.value === category)?.label || CATEGORIES[0].label;

    // Rastgele bir görsel URL'si
    const placeholderImageUrl = "https://placehold.co/150x150/FF6F61/ffffff?text=Fiş+Görseli";

    const handleSave = async () => {
        if (!title || !amount || !category) {
            Alert.alert("Eksik Bilgi", "Lütfen fiş başlığını, tutarı ve **kategoriyi** girin.");
            return;
        }

        const newReceipt = {
            id: Date.now(), // Basit ID 
            title: title,
            amount: parseFloat(amount),
            date: date,
            category: selectedCategoryLabel, // Kategori adını kaydet
            imageUrl: placeholderImageUrl,
            timestamp: new Date().toISOString(),
        };

        setIsLoading(true);

        try {
            onSaveReceipt(newReceipt);
            
            // Alanları temizle
            setTitle('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory(''); 

            Alert.alert("Başarılı", "Fiş başarıyla kaydedildi!");

        } catch (error) {
            console.error("Fiş kaydetme hatası:", error);
            Alert.alert("Hata", "Fiş kaydedilirken bir sorun oluştu.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Kategori Seçim Modal'ı
    const CategoryModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isPickerVisible}
            onRequestClose={() => setIsPickerVisible(false)}
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
                                    setCategory(item.value);
                                    setIsPickerVisible(false);
                                }}
                            >
                                <Text style={modalStyles.optionText}>{item.label}</Text>
                                {item.value === category && <Text style={modalStyles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={[modalStyles.button, modalStyles.buttonClose]}
                        onPress={() => setIsPickerVisible(false)}
                    >
                        <Text style={modalStyles.textStyle}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <CategoryModal />
            <Text style={styles.header}>Yeni Fiş Kaydı</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fiş Başlığı (Örn: Market Alışverişi)</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Başlık girin"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Kategori Seçimi</Text>
                {/* Core bileşenlerle simüle edilmiş Picker */}
                <TouchableOpacity 
                    style={styles.pickerDisplay}
                    onPress={() => setIsPickerVisible(true)}
                >
                    <Text style={category ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                        {selectedCategoryLabel}
                    </Text>
                    <Text style={styles.pickerIcon}>▼</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tutar (TL)</Text>
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))} // Sadece sayı ve nokta kabul et
                    keyboardType="numeric"
                    placeholder="0.00"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarih</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    keyboardType="numeric"
                />
            </View>
            
            <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Kamera/Görsel Yükleme Alanı (Geliştirme Aşamasında)</Text>
            </View>

            <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleSave} 
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>{isLoading ? 'Kaydediliyor...' : 'Fişi Kaydet'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        minHeight: '100%',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    pickerDisplay: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerTextSelected: {
        fontSize: 16,
        color: '#333',
    },
    pickerTextPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    pickerIcon: {
        fontSize: 12,
        color: '#666',
    },
    imagePlaceholder: {
        height: 150,
        backgroundColor: '#eee',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#ccc',
        marginBottom: 20,
    },
    placeholderText: {
        color: '#999',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FF6F61', 
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#f7a6a0',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Modal arka plan karartma
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


export default CameraScreen;