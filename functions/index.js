if (process.env.FUNCTIONS_EMULATOR === 'true' && require('fs').existsSync('.env')) {
    require('dotenv').config();
}

const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');

let GEMINI_API_KEY;

if (process.env.FUNCTIONS_EMULATOR === 'true') {
    GEMINI_API_KEY = process.env.GEMINI_API_KEY;
} else {
    try {
        GEMINI_API_KEY = functions.config().gemini.api_key;
    } catch (e) {
        console.error("KRİTİK HATA: functions.config() okunamadı.");
    }
}

if (!GEMINI_API_KEY) {
    console.error("KRİTİK HATA: GEMINI API Anahtarı bulunamadı.");
    throw new Error('API anahtarı eksik.'); 
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

exports.processReceiptImage = functions.runWith({ timeoutSeconds: 300, memory: '1GB' }).https.onCall(async (data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bu işleme yetkiniz yok.');
    }

    const { base64Image } = data;

    if (!base64Image) {
        throw new functions.https.HttpsError('invalid-argument', 'Görüntü verisi eksik.');
    }

    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };

        const prompt = "Bu makbuzdaki temel ürünleri ve tahmini fiyatlarını (TL cinsinden) listeleyebilir misin? Sadece ürün adı ve fiyatı içeren, başlıklar hariç, her ürünü yeni bir satırda 'Ürün Adı:Fiyat' formatında listele. Eğer ürün bulamazsan sadece 'Hata: Ürün Bulunamadı' yaz. Örnek çıktı formatı: 'Süt:32.50\nEkmek:15.00\nYumurta:45.00'";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [imagePart, { text: prompt }],
        });

        const text = response.text.trim();
        const lines = text.split('\n');
        const items = [];
        
        if (text.startsWith('Hata:')) {
            return { error: text.replace('Hata: ', '') };
        }
        
        for (const line of lines) {
            const [name, price] = line.split(':');
            if (name && price) {
                const cleanedPrice = parseFloat(price.trim().replace(/[^0-9.]/g, ''));
                if (!isNaN(cleanedPrice) && cleanedPrice > 0) {
                     items.push({ 
                         name: name.trim(), 
                         price: cleanedPrice 
                     });
                }
            }
        }
        
        if (items.length === 0) {
            return { error: 'Makbuz üzerinde okunaklı bir ürün kalemi bulunamadı.' };
        }
        
        return { items };

    } catch (error) {
        console.error("Gemini API çağrısı sırasında genel hata veya işleme hatası:", error.stack || error.message);
        throw new functions.https.HttpsError('internal', 'AI işleme sırasında beklenmeyen bir hata oluştu.', error.message);
    }
});