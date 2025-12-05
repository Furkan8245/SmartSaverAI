import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { styles } from '../styles/AppStyles';
// Hata Düzeltme: CATEGORIES'i merkezi yapılandırma dosyasından doğru şekilde alıyoruz.
import { CATEGORIES } from '../config/firebaseConfig'; 

// --- Icons ---
export const IconPlus = () => <Text style={{fontSize: 16}}>➕</Text>;
export const IconTrash2 = () => <Text style={{fontSize: 16}}>🗑️</Text>;
export const IconEdit3 = () => <Text style={{fontSize: 16}}>✏️</Text>;
export const IconSearch = () => <Text style={{fontSize: 16}}>🔍</Text>;
export const IconChevronDown = () => <Text style={{fontSize: 10}}>▼</Text>;
export const IconChevronUp = () => <Text style={{fontSize: 10}}>▲</Text>;
export const IconAlertTriangle = () => <Text style={{fontSize: 20}}>⚠️</Text>;
export const IconX = () => <Text style={{fontSize: 16, color: '#DC2626'}} >❌</Text>; 
export const IconCamera = () => <Text style={{fontSize: 16}}>📸</Text>;
export const IconImage = () => <Text style={{fontSize: 16}}>🖼️</Text>;

// --- Components ---

export const CategorySelect = ({ value, onChange, placeholder = 'Kategori Seçin' }) => {
    // CATEGORIES'in undefined olmadığı varsayımıyla devam ediyoruz
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = CATEGORIES.find(c => c.value === value)?.label || placeholder;
    
    return (
        <View style={{zIndex: isOpen ? 10 : 1}}> 
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={styles.dropdownButtonText}>{selectedLabel}</Text>
                {/* İkon */}
                {isOpen ? <IconChevronUp /> : <IconChevronDown />}
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.dropdownMenu}>
                    {CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                                onChange(category.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={styles.dropdownItemText}>{category.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

export const TabButton = ({ title, icon: Icon, isActive, onPress }) => (
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

// Boş Durum Bileşeni
export const EmptyState = ({ title, subtitle, icon: Icon }) => (
    <View style={styles.emptyStateContainer}>
        <Icon />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    </View>
);

export const SortButton = ({ label, sortKey, currentSortKey, sortOrder, onClick }) => {
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
            {isActive && (isAsc ? <IconChevronUp /> : <IconChevronDown />)}
        </TouchableOpacity>
    );
};