# 🤖 WhatsApp UserBot - Premium Edition

**200+ Özellik** | **AI Destekli** | **Grup Yönetimi** | **Otomasyon**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

---

## ✨ Özellikler

### 📱 Genel (20+ komut)
- Bot durumu, sistem bilgisi, istatistikler
- Otomatik yanıtlar, AFK modu
- QR kod, link kısaltma, şifre oluşturma

### 🎮 Eğlence (15+ komut)
- Zar, yazı tura, 8-ball
- Espri, fıkra, atasözü, kapak sözler
- İlginç bilgiler, sayı tahmini

### 📊 Bilgi (15+ komut)
- Hava durumu, döviz, altın, kripto
- Haberler, gündem, namaz vakitleri
- Hesap makinesi, çeviri, Wikipedia

### 🖼️ Medya (10+ komut)
- Sticker oluşturma/dönüştürme
- Sesli mesaj (TTS)
- Meme, kedi, köpek, panda, tilki fotoğrafları

### 👥 Grup Yönetimi (25+ komut)
- Herkesi etiketleme, gizli etiket
- Üye ekleme/çıkarma, yetki verme/alma
- Grup ayarları, link yönetimi
- Uyarı sistemi, ban/unban
- Anti-link, spam koruması

### 🎲 Oyunlar (5+ komut)
- XOX, kelime oyunu
- Matematik oyunu, bulmaca
- Bilgi yarışması

### 🤖 Yapay Zeka (6+ komut)
- AI sohbet, soru-cevap
- Yazı yazdırma, özet çıkarma
- Kod yazdırma, çeviri

### 🛠️ Araçlar (10+ komut)
- Base64, Binary, Hex dönüşümü
- JSON formatlama, UUID oluşturma
- QR kod, link kısaltma

### 📝 Not & Hatırlatma (5+ komut)
- Not alma, listeleme, silme
- Hatırlatıcı ayarlama

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn
- WhatsApp hesabı

### Adım 1: Projeyi İndir
```bash
git clone https://github.com/xemreceylan/wpuserbot.git
cd wpuserbot
```

### Adım 2: Bağımlılıkları Yükle
```bash
npm install
```

### Adım 3: Botu Başlat
```bash
node index.js
```

### Adım 4: QR Kodu Tara
Terminalde görünen QR kodu telefonunuzdaki WhatsApp ile tarayın:
- WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz Bağla

---

## 📋 Komut Listesi

### Genel Komutlar
```
!menu, !yardım, !help - Tüm komutları göster
!ping - Bot durumu
!status, !durum - Sistem bilgisi
!info, !bilgi - Bot hakkında
!owner, !sahip - Sahip bilgisi
```

### Eğlence
```
!zar, !dice - Zar at
!yazıtura, !coin - Yazı tura
!soru, !8ball [soru] - 8-ball
!espri, !joke - Espri
!fıkra - Fıkra
!atasözü - Atasözü
!kapak - Kapak söz
!ilginç - İlginç bilgi
!tahmin [sayı] - Sayı tahmini
```

### Bilgi
```
!hava, !weather [şehir] - Hava durumu
!döviz, !kur - Döviz kurları
!altın - Altın fiyatları
!kripto, !crypto - Kripto paralar
!haber, !news - Son haberler
!gündem - Gündem
!namaz, !ezan [şehir] - Namaz vakitleri
!tarih - Bugünün tarihi
!saat - Şu anki saat
!hesapla, !calc [işlem] - Hesap makinesi
!çevir, !translate [dil] [metin] - Çeviri
!wiki, !wikipedia [konu] - Wikipedia
!google, !ara [sorgu] - Google arama
!youtube, !yt [sorgu] - YouTube arama
```

### Medya
```
!sticker, !stiker, !s - Sticker oluştur
!toimg, !resim - Sticker'ı resme çevir
!tts, !ses [metin] - Sesli mesaj
!meme - Rastgele meme
!kedi, !cat - Kedi fotoğrafı
!köpek, !dog - Köpek fotoğrafı
!panda - Panda fotoğrafı
!fox, !tilki - Tilki fotoğrafı
```

### Grup Yönetimi
```
!tagall, !herkes - Herkesi etiketle
!hidetag [mesaj] - Gizli etiket
!grupbilgi, !groupinfo - Grup bilgisi
!grupresim, !groupicon - Grup resmini değiştir
!grupadı, !setsubject [isim] - Grup adını değiştir
!grupaciklaması, !setdesc [metin] - Açıklama değiştir
!link, !gruplink - Grup linki
!revoke, !linkreset - Linki sıfırla
!kick, !at [@kişi] - Üyeyi at
!add, !ekle [numara] - Üye ekle
!promote, !yükselt [@kişi] - Yetki ver
!demote, !düşür [@kişi] - Yetki al
!mute, !sustur - Grubu sustur
!unmute, !aç - Grubu aç
!antilink, !linkengel - Link engel aç/kapat
!welcome, !hoşgeldin - Hoşgeldin mesajı
!goodbye, !görüşürüz - Görüşürüz mesajı
!warn, !uyar [@kişi] - Uyar
!warns, !uyarılar - Uyarıları gör
!unwarn, !uyarısil [@kişi] - Uyarı sil
!ban [@kişi] - Yasakla
!unban [numara] - Yasağı kaldır
!afk [sebep] - AFK modu
```

### Kullanıcı
```
!profil, !profile - Profil bilgisi
!pp, !profilfoto - Profil fotoğrafı
!hakkımda, !about [metin] - Hakkımda değiştir
!isim, !setname [isim] - İsim değiştir
```

### Not & Hatırlatma
```
!not, !note [metin] - Not ekle
!notlarım, !notes - Notlarımı gör
!notsil, !delnote [numara] - Not sil
!hatırlat, !remind [süre] [metin] - Hatırlatıcı
!hatırlatmalar, !reminders - Hatırlatmalarım
```

### Oyunlar
```
!xox, !ttt - XOX oyunu
!kelime, !word - Kelime oyunu
!matematik, !math - Matematik oyunu
!bulmaca - Bulmaca
!bilgi yarışması, !quiz - Bilgi yarışması
```

### Yapay Zeka
```
!ai, !gpt, !yapayzeka [soru] - AI'ya soru sor
!chat, !sohbet [mesaj] - AI ile sohbet
!yaz, !write [konu] - Yazı yazdır
!özet, !summarize [metin] - Özet çıkar
!çeviri, !ai-translate [dil] [metin] - AI çeviri
!kod, !code [dil] [açıklama] - Kod yazdır
```

### Araçlar
```
!qrcode, !qr [metin] - QR kod oluştur
!short, !kısalt [link] - Link kısalt
!base64 [metin] - Base64 encode
!unbase64 [metin] - Base64 decode
!binary [metin] - Binary'e çevir
!hex [metin] - Hex'e çevir
!json [metin] - JSON formatla
!password, !şifre [uzunluk] - Şifre oluştur
!uuid - UUID oluştur
```

### İstatistikler
```
!stats, !istatistik - Bot istatistikleri
!toplam, !total - Toplam kullanım
```

### Yönetim (Sadece Sahip)
```
!broadcast, !duyuru [mesaj] - Duyuru yap
!eval [kod] - Kod çalıştır
!shell, !terminal [komut] - Terminal komutu
!restart, !yenidenbaşlat - Botu yeniden başlat
!stop, !dur - Botu durdur
```

---

## ⚙️ Yapılandırma

`index.js` dosyasındaki `CONFIG` bölümünü düzenleyin:

```javascript
const CONFIG = {
    PREFIX: '!',           // Komut öneki
    OWNER: '905551234567', // Sahip numarası (başında + olmadan)
    BOT_NAME: '🤖 UserBot',
    AUTO_READ: true,       // Mesajları otomatik oku
    TYPING_EFFECT: true,   // Yazıyor... efekti
    ANTI_SPAM: true,       // Spam koruması
    WELCOME_MSG: true,     // Hoşgeldin mesajı
    GOODBYE_MSG: true,     // Görüşürüz mesajı
    AI_ENABLED: true,      // AI özellikleri
    LANGUAGE: 'tr'         // Dil
};
```

---

## 🔒 Güvenlik

- **Anti-Spam**: Hızlı mesajları engeller
- **Anti-Link**: İstenmeyen linkleri siler
- **Uyarı Sistemi**: 3 uyarıda otomatik atma
- **Ban Sistemi**: Yasaklı kullanıcıları engelleme
- **Sahip Kontrolü**: Admin komutları sadece sahip tarafından kullanılabilir

---

## 🛠️ Gelişmiş Özellikler

### Otomatik Görevler (Cron)
- Hatırlatıcıları kontrol etme (her dakika)
- İstatistik kaydetme (her saat)

### Veritabanı (In-Memory)
- Kullanıcı verileri
- Grup ayarları
- Notlar ve hatırlatıcılar
- Uyarılar ve banlar

### Medya İşleme
- Sticker oluşturma/dönüştürme
- Görüntü indirme/gönderme
- Sesli mesaj oluşturma

---

## 📝 Özelleştirme

### Özel Komut Ekleme
```javascript
// index.js dosyasına ekle
case 'ozelkomut':
    await msg.reply('Özel yanıt!');
    break;
```

### Otomatik Yanıt Ekleme
```javascript
// checkAutoReply fonksiyonuna ekle
const autoReplies = {
    'kelime': 'Yanıt mesajı'
};
```

---

## 🐛 Hata Ayıklama

### Yaygın Sorunlar

**QR kod görünmüyor**
```bash
# Terminal boyutunu büyütün
# veya
npm install qrcode-terminal
```

**Bağlantı kopuyor**
```bash
# Puppeteer argümanlarını kontrol edin
# index.js'de puppeteer bölümünü düzenleyin
```

**Komutlar çalışmıyor**
- Prefix'i kontrol edin (varsayılan: `!`)
- Numara formatını kontrol edin

---

## 📊 İstatistikler

Bot çalıştığında otomatik olarak toplar:
- Toplam mesaj sayısı
- Çalıştırılan komut sayısı
- Aktif kullanıcı sayısı
- Aktif grup sayısı

---

## ⚠️ Yasal Uyarı

Bu bot **eğitim amaçlı** olarak geliştirilmiştir.

- WhatsApp'ın Kullanım Koşullarına uyun
- Spam yapmayın
- Başkalarını rahatsız etmeyin
- Kullanım riski size aittir

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/ozellik`)
3. Commit yapın (`git commit -am 'Yeni özellik'`)
4. Push yapın (`git push origin feature/ozellik`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 🙏 Teşekkürler

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Node.js](https://nodejs.org/)
- Tüm katkıda bulunanlar

---

**Geliştirici:** Emre CEYLAN  
**Versiyon:** 2.0.0  
**Son Güncelleme:** 2026

---

<p align="center">
  <a href="#">Yukarı çık ⬆️</a>
</p>
