// functions/index.js (veya .ts)

const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');

// Cloud Function Environment Variable'dan API Anahtarını al
// Daha güvenli yöntem Secret Manager kullanmaktır.
const GEMINI_API_KEY = functions.config().gemini.api_key; 
// veya Secret Manager'dan alınıyorsa:
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// React Native tarafından çağrılacak HTTP Cloud Function
exports.processReceiptImage = functions.https.onCall(async (data, context) => {
    // 1. Yetkilendirme Kontrolü: Kullanıcının oturumu açık olmalı
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bu işleme yetkiniz yok.');
    }

    const { base64Image } = data;

    if (!base64Image) {
        throw new functions.https.HttpsError('invalid-argument', 'Görüntü verisi eksik.');
    }

    try {
        // 2. Multimodal API Çağrısı (Görüntü ve Metin)
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg', // Ya da dinamik olarak gelen tür
            },
        };

        const prompt = "Bu makbuzdaki temel ürünleri ve tahmini fiyatlarını (TL cinsinden) listeleyebilir misin? Sadece ürün adı ve fiyatı içeren, başlıklar hariç, her ürünü yeni bir satırda 'Ürün Adı:Fiyat' formatında listele. Eğer ürün bulamazsan sadece 'Hata: Ürün Bulunamadı' yaz. Örnek çıktı formatı: 'Süt:32.50\nEkmek:15.00\nYumurta:45.00'";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Görüntü işleme yeteneği olan model
            contents: [imagePart, { text: prompt }],
        });

        const text = response.text.trim();
        
        // 3. Basitleştirilmiş Yanıt İşleme
        const lines = text.split('\n');
        const items = [];
        
        // Hata durumunu kontrol et
        if (text.startsWith('Hata:')) {
             return { error: text.replace('Hata: ', '') };
        }
        
        for (const line of lines) {
            const [name, price] = line.split(':');
            if (name && price) {
                // Fiyatı temizle ve ondalık sayıya çevir
                const cleanedPrice = parseFloat(price.trim().replace(/[^0-9.]/g, ''));
                if (!isNaN(cleanedPrice) && cleanedPrice > 0) {
                     items.push({ 
                         name: name.trim(), 
                         price: cleanedPrice 
                     });
                }
            }
        }
        
        return { items };

    } catch (error) {
        console.error("Gemini API hatası:", error);
        throw new functions.https.HttpsError('internal', 'AI işleme sırasında bir hata oluştu.');
    }
});