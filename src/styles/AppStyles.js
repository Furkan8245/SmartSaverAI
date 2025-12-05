import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    // --- GENEL UYGULAMA YAPISI ---
    appContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Açık gri arka plan
    },
    mainContent: {
        flex: 1, // ScrollView'in içindeki içerik için esneklik
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 30 : 0, // Android'de güvenli alan
        paddingBottom: 20,
    },

    // --- YÜKLEME VE HATA EKRANLARI ---
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        fontSize: 30,
        color: '#4F46E5', // İndigo
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
    errorBanner: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FEE2E2', // Kırmızımsı arka plan
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444', // Kırmızı çizgi
        alignItems: 'flex-start',
    },
    errorTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    errorTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#B91C1C', // Koyu kırmızı
    },
    errorText: {
        fontSize: 14,
        color: '#B91C1C',
        marginTop: 4,
    },

    // --- ORTAK FORMU ELEMANLARI ---
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12, // React Native'de gap yoksa margin kullanın
        marginBottom: 10,
    },
    flex1: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    
    // Dropdown (CategorySelect) Stilleri
    dropdownButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#1F2937',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 8,
        maxHeight: 200, // Maksimum yükseklik
        overflow: 'hidden',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    dropdownItemLast: {
        borderBottomWidth: 0,
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
    },

    // --- ORTAK BUTON STİLLERİ ---
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    buttonPrimary: {
        backgroundColor: '#4F46E5', // İndigo
    },
    buttonSecondary: {
        backgroundColor: '#F3F4F6', // Açık gri
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    
    // --- SEKMELER (Footer) ---
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
    },
    userIdText: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    tabButtonActive: {
        backgroundColor: '#EEF2FF', // Açık indigo
    },
    tabButtonInactive: {
        backgroundColor: '#FFFFFF',
    },
    tabButtonText: {
        fontSize: 12,
        marginTop: 4,
        color: '#6B7280',
    },
    tabButtonTextActive: {
        color: '#4F46E5', // İndigo
        fontWeight: 'bold',
    },

    // --- RECEIPTSSCREEN (FİŞ LİSTESİ) ---
    receiptsScreenContainer: {
        paddingTop: 10,
    },
    // Arama ve Sıralama Çubuğu
    searchBarContainer: {
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchAndSortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
        marginRight: 10,
    },
    sortButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sortButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortButtonInactive: {
        backgroundColor: '#E5E7EB',
    },
    sortButtonActive: {
        backgroundColor: '#4F46E5', // İndigo
    },
    sortButtonText: {
        fontSize: 12,
        color: '#374151',
    },
    sortButtonTextActive: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
    },

    // Fiş Öğesi (ReceiptItem)
    receiptItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        alignItems: 'center',
    },
    receiptInfo: {
        flex: 1,
        marginRight: 10,
    },
    receiptTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    receiptDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    receiptAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#065F46', // Yeşil
    },
    receiptActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 10,
    },
    actionButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#F3F4F6',
    },
    categoryPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: 'bold',
    },

    // Boş Durum
    emptyStateContainer: {
        alignItems: 'center',
        padding: 40,
        marginTop: 50,
        backgroundColor: '#F9FAFB',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 15,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 5,
    },

    // --- CAMERASCREEN (YENİ FİŞ EKLEME) ---
    cameraScreenContainer: {
        paddingVertical: 10,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    imagePreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    placeholderText: {
        fontSize: 16,
        color: '#6B7280',
    },
    imageButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    imageButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    imageButtonText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    processButton: {
        backgroundColor: '#EF4444', // Kırmızı
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    processButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    processButtonDisabled: {
        backgroundColor: '#FCA5A5', // Açık kırmızı
    },
    
    // Geçici Ürün Ekleme (Manuel veya OCR sonrası)
    temporaryItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemsListContainer: {
        maxHeight: 250, // Ürün listesi için maksimum yükseklik
        marginBottom: 15,
    },
    tempItemInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        paddingHorizontal: 8,
        marginRight: 8,
        fontSize: 15,
        color: '#1F2937',
    },
    tempItemInputName: {
        flex: 2,
    },
    tempItemInputPrice: {
        flex: 1,
        textAlign: 'right',
    },
    removeItemButton: {
        padding: 5,
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DBEAFE', // Çok açık mavi
        padding: 8,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#93C5FD',
    },
    addItemButtonText: {
        color: '#1D4ED8', // Mavi
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    saveButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonEnabled: {
        backgroundColor: '#059669', // Zümrüt Yeşili
    },
    saveButtonDisabled: {
        backgroundColor: '#A7F3D0', // Açık Zümrüt Yeşili
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    emptyListText: {
        textAlign: 'center',
        color: '#6B7280',
        paddingVertical: 15,
        fontStyle: 'italic',
    },
    
    // --- MODALLAR (HEM EditReceiptModal HEM ReceiptDetailModal İÇİN) ---
    modalOverlay: {
        ...StyleSheet.absoluteFillObject, // Tüm ekranı kapla
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Yarı saydam arka plan
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100, // Diğer her şeyin üstünde olması için
    },
    modalContent: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%', // Ekranın %80'ini kapla
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalBody: {
        flexGrow: 0, // İçeriği sınırla, ScrollView içinde ScrollView'e izin verme
        marginBottom: 10,
    },

    // --- EditReceiptModal'a Özel Stiller (Sizin Parçanızdan Gelen) ---
    editmodal_input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 10, 
        fontSize: 15, 
        color: '#333',
        fontWeight: '500',
    },
    editmodal_pickerDisplay: {
        backgroundColor: '#f0f0f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editmodal_pickerTextSelected: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    editmodal_pickerIcon: {
        fontSize: 16,
        color: '#FF6F61', 
        fontWeight: 'bold',
    },
    editmodal_buttonUpdate: {
        backgroundColor: '#4CAF50', 
        padding: 14, 
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20, 
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    editmodal_buttonCancel: {
        backgroundColor: '#ffdddd', 
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#FF6F61',
    },
    editmodal_buttonTextCancel: {
        color: '#FF6F61',
        fontWeight: 'bold',
    },

    // --- ReceiptDetailModal'a Özel Stiller (Sizin Parçanızdan Gelen) ---
    detailModalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailModalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        maxHeight: '80%',
    },
    detailModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    detailModalInfo: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    detailModalInfoText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    detailModalTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#065F46',
        marginTop: 10,
    },
    detailItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        marginBottom: 5,
    },
    detailItemHeaderText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#4B5563',
    },
    detailItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailItemName: {
        flex: 3,
        fontSize: 15,
        color: '#1F2937',
    },
    detailItemPrice: {
        flex: 1.5,
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#065F46',
    },
    detailModalButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
    },
    // Düzenleme input'ları (Detail Modal)
    itemInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        paddingHorizontal: 8,
        marginHorizontal: 4,
        fontSize: 15,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    itemInputName: {
        flex: 3,
    },
    itemInputPrice: {
        flex: 1.5,
        textAlign: 'right',
    },
    // Yeni Ürün Ekleme butonu
    addNewItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DBEAFE', // Çok açık mavi
        padding: 8,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#93C5FD',
    },
    addNewItemButtonText: {
        color: '#1D4ED8', // Mavi
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    
});