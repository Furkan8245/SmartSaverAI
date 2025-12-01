import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig'; // db nesnemizi import ediyoruz

/**
 * Yeni bir manuel harcama kaydını Firestore'a ekler.
 * @param {string} userId - Harcamayı yapan kullanıcı ID'si (şimdilik statik tutabiliriz)
 * @param {number} totalAmount - Harcamanın toplam tutarı
 * @param {string} description - Harcama açıklaması
 */
export const addManualTransaction = async (userId, totalAmount, description) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      userId: userId,
      total: totalAmount,
      description: description,
      timestamp: serverTimestamp(), // Sunucu saatiyle doğru zaman damgası
      source: 'manual', // Kaynağı belirliyoruz
      items: [], // Fişten gelen ürünler bu alana eklenecek
    });

    console.log("Harcama Firestore'a başarıyla eklendi, ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Harcama eklenirken hata oluştu: ", e);
    return false;
  }
};