// src/screens/ReceiptsScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

import { styles } from '../styles/AppStyles';
import { 
    IconSearch, 
    IconEdit3, 
    IconTrash2, 
    IconChevronDown, 
    IconChevronUp, 
    EmptyState,
    SortButton
} from '../components/Common';

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

const ReceiptItem = ({ receipt, onDeleteReceipt, onEditReceipt, onDetailReceipt }) => {
    const { bg, text } = getCategoryColor(receipt.category);
    const hasItems = receipt.items && receipt.items.length > 0;

    return (
        <TouchableOpacity 
            style={[styles.receiptItem, { borderLeftColor: '#4F46E5' }]}
            onPress={() => onDetailReceipt(receipt)}
        >
            <View style={styles.receiptDetailContainer}>
                <View style={styles.receiptIconBox}>
                    <Text style={styles.receiptIconBoxText}>{receipt.imageUrl && receipt.imageUrl !== 'Manuel Giriş' ? '📸' : hasItems ? '🛒' : '🏷️'}</Text>
                </View>
                <View style={styles.receiptTextContainer}>
                    <Text style={styles.receiptTitle} numberOfLines={1}>{receipt.title}</Text>
                    <View style={[styles.categoryTag, { backgroundColor: bg }]}>
                        <Text style={[styles.categoryTagText, { color: text }]}>{receipt.category || 'Belirlenmemiş'}</Text>
                    </View>
                    <Text style={styles.receiptDate}>Tarih: {receipt.date}</Text>
                    {hasItems && ( 
                        <Text style={styles.receiptDate}>({receipt.items.length} Kalem Detayı Var)</Text> 
                    )}
                </View>
            </View>

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
        </TouchableOpacity>
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


export const ReceiptsScreen = ({ receipts, onDeleteReceipt, onEditReceipt, onDetailReceipt }) => {
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
            (receipt.amount && receipt.amount.toString().includes(searchText.replace(',', '.'))) ||
            (receipt.items && receipt.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase())))
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
    
    return (
        <View style={styles.screenWrapper}>
            <Text style={styles.screenTitle}>Fiş Listesi ve Özet</Text>

            {receipts.length > 0 && (
                <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>Harcama Özeti</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                        {categorySummary.map((item) => <SummaryItem key={item.category} item={item} />)}
                    </ScrollView>
                </View>
            )}

            <View style={styles.searchSortCard}>
                <View style={styles.searchContainer}>
                    <IconSearch />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Başlık, Kategori, Tutar veya Ürün Ara..."
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

            <View>
                {sortedAndFilteredReceipts.length === 0 && receipts.length > 0 ?
                (
                    <EmptyState 
                        title="Filtreye Uyan Fiş Bulunamadı"
                        subtitle="Arama kriterlerinizi değiştirmeyi deneyin."
                        icon={() => <Text style={{fontSize: 40, color: '#A5B4FC'}}>🔍</Text>}
                    />
                ) : sortedAndFilteredReceipts.length === 0 ?
                (
                    <EmptyState 
                        title="Henüz Hiç Fiş Kaydetmediniz"
                        subtitle="Başlamak için 'Yeni Fiş' sekmesini kullanın."
                        icon={() => <Text style={{fontSize: 40, color: '#A5B4FC'}}>🧾</Text>}
                    />
                ) : (
                    sortedAndFilteredReceipts.map((receipt) => (
                        <ReceiptItem 
                            key={receipt.id} 
                            receipt={receipt} 
                            onDeleteReceipt={onDeleteReceipt}
                            onEditReceipt={onEditReceipt}
                            onDetailReceipt={onDetailReceipt}
                        />
                    ))
                )}
            </View>
        </View>
    );
};
export default ReceiptsScreen;