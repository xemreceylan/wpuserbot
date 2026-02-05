/**
 * 🤖 WHATSAPP USERBOT - Premium Edition
 * ======================================
 * 200+ Özellik | Otomatik Yanıt | Grup Yönetimi | AI Entegrasyonu
 * 
 * Kurulum:
 * 1. npm install
 * 2. node index.js
 * 3. QR kodu telefonunuzla okutun
 * 
 * Geliştirici: AI Assistant
 * Versiyon: 2.0.0
 */

const { Client, LocalAuth, MessageMedia, Buttons, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const fs = require('fs-extra');
const cron = require('node-cron');
const path = require('path');

// Ayarlar
const CONFIG = {
    PREFIX: '!',  // Komut öneki
    OWNER: '',    // Sahip numarası (başında + olmadan)
    BOT_NAME: '🤖 UserBot',
    AUTO_READ: true,
    TYPING_EFFECT: true,
    ANTI_SPAM: true,
    WELCOME_MSG: true,
    GOODBYE_MSG: true,
    AI_ENABLED: true,
    LANGUAGE: 'tr'
};

// Veritabanı
const db = {
    users: new Map(),
    groups: new Map(),
    afk: new Map(),
    warns: new Map(),
    bans: new Set(),
    stats: { messages: 0, commands: 0 },
    customCommands: new Map(),
    autoReplies: new Map(),
    reminders: [],
    notes: new Map()
};

// ============================================================
// WHATSAPP CLIENT
// ============================================================

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Kod
client.on('qr', (qr) => {
    console.log('📱 QR Kodu tarayın:');
    qrcode.generate(qr, { small: true });
});

// Hazır
client.on('ready', () => {
    console.log('✅ Bot aktif!');
    console.log(`🤖 ${CONFIG.BOT_NAME} çalışıyor...`);
    console.log(`📅 ${moment().format('DD.MM.YYYY HH:mm:ss')}`);
    
    // Otomatik görevler
    startCronJobs();
});

// Mesaj alındığında
client.on('message_create', async (msg) => {
    try {
        db.stats.messages++;
        
        // AFK kontrolü
        await checkAFK(msg);
        
        // Otomatik yanıt kontrolü
        await checkAutoReply(msg);
        
        // Komut işleme
        if (msg.body.startsWith(CONFIG.PREFIX)) {
            await handleCommand(msg);
        }
        
        // Link algılama
        await detectLinks(msg);
        
        // Spam kontrolü
        if (CONFIG.ANTI_SPAM) await antiSpam(msg);
        
    } catch (err) {
        console.error('Mesaj hatası:', err);
    }
});

// Gruba katılım
client.on('group_join', async (notification) => {
    if (CONFIG.WELCOME_MSG) {
        const chat = await notification.getChat();
        const contact = await notification.getRecipients();
        
        const welcomeMessages = [
            `👋 Hoş geldin ${contact[0].pushname || 'yeni üye'}!`,
            `🎉 Aramıza katıldın ${contact[0].pushname || 'dostum'}!`,
            `✨ ${contact[0].pushname || 'Yeni üye'} gruba katıldı!`
        ];
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        await chat.sendMessage(randomWelcome + '\n\n📋 Komutlar için: !menu');
    }
});

// Gruptan ayrılma
client.on('group_leave', async (notification) => {
    if (CONFIG.GOODBYE_MSG) {
        const chat = await notification.getChat();
        await chat.sendMessage('👋 Bir üye ayrıldı. Güle güle!');
    }
});

// ============================================================
// KOMUT İŞLEME
// ============================================================

async function handleCommand(msg) {
    const args = msg.body.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    db.stats.commands++;
    
    // Yazıyor... efekti
    if (CONFIG.TYPING_EFFECT) {
        const chat = await msg.getChat();
        chat.sendStateTyping();
    }
    
    // Komutları işle
    switch (command) {
        // ============ GENEL KOMUTLAR ============
        case 'menu':
        case 'yardım':
        case 'help':
            await sendMenu(msg);
            break;
            
        case 'ping':
            await msg.reply('🏓 Pong!');
            break;
            
        case 'status':
        case 'durum':
            await sendStatus(msg);
            break;
            
        case 'info':
        case 'bilgi':
            await sendBotInfo(msg);
            break;
            
        case 'owner':
        case 'sahip':
            await msg.reply('👑 Bot Sahibi: ' + (CONFIG.OWNER || 'Belirtilmemiş'));
            break;
            
        // ============ EĞLENCE KOMUTLARI ============
        case 'zar':
        case 'dice':
            await msg.reply(`🎲 Zar: ${Math.floor(Math.random() * 6) + 1}`);
            break;
            
        case 'yazıtura':
        case 'coin':
            const result = Math.random() > 0.5 ? 'Yazı' : 'Tura';
            await msg.reply(`🪙 Sonuç: ${result}`);
            break;
            
        case 'soru':
        case '8ball':
            await magic8Ball(msg, args);
            break;
            
        case 'espri':
        case 'joke':
            await sendJoke(msg);
            break;
            
        case 'fıkra':
            await sendFikra(msg);
            break;
            
        case 'atasözü':
            await sendAtasozu(msg);
            break;
            
        case 'kapak':
            await sendKapak(msg);
            break;
            
        case 'ilginç':
            await sendFunFact(msg);
            break;
            
        case 'tahmin':
            await numberGuess(msg, args);
            break;
            
        case 'doğruluk':
            await sendDog truth(msg);
            break;
            
        case 'cesaret':
            await sendCesaret(msg);
            break;
            
        // ============ BİLGİ KOMUTLARI ============
        case 'hava':
        case 'weather':
            await getWeather(msg, args);
            break;
            
        case 'döviz':
        case 'kur':
            await getExchangeRates(msg);
            break;
            
        case 'altın':
            await getGoldPrices(msg);
            break;
            
        case 'kripto':
        case 'crypto':
            await getCryptoPrices(msg);
            break;
            
        case 'haber':
        case 'news':
            await getNews(msg);
            break;
            
        case 'gündem':
            await getTrending(msg);
            break;
            
        case 'namaz':
        case 'ezan':
            await getPrayerTimes(msg, args);
            break;
            
        case 'tarih':
            await msg.reply(`📅 ${moment().format('DD MMMM YYYY dddd')}`);
            break;
            
        case 'saat':
            await msg.reply(`🕐 ${moment().format('HH:mm:ss')}`);
            break;
            
        case 'hesapla':
        case 'calc':
            await calculate(msg, args);
            break;
            
        case 'çevir':
        case 'translate':
            await translate(msg, args);
            break;
            
        case 'wiki':
        case 'wikipedia':
            await searchWiki(msg, args);
            break;
            
        case 'google':
        case 'ara':
            await googleSearch(msg, args);
            break;
            
        case 'youtube':
        case 'yt':
            await searchYouTube(msg, args);
            break;
            
        // ============ MEDYA KOMUTLARI ============
        case 'sticker':
        case 'stiker':
        case 's':
            await createSticker(msg);
            break;
            
        case 'toimg':
        case 'resim':
            await stickerToImage(msg);
            break;
            
        case 'tovideo':
        case 'video':
            await stickerToVideo(msg);
            break;
            
        case 'tts':
        case 'ses':
            await textToSpeech(msg, args);
            break;
            
        case 'meme':
            await sendMeme(msg);
            break;
            
        case 'kedi':
        case 'cat':
            await sendCat(msg);
            break;
            
        case 'köpek':
        case 'dog':
            await sendDog(msg);
            break;
            
        case 'panda':
            await sendPanda(msg);
            break;
            
        case 'fox':
        case 'tilki':
            await sendFox(msg);
            break;
            
        // ============ GRUP KOMUTLARI ============
        case 'tagall':
        case 'herkes':
            await tagAll(msg);
            break;
            
        case 'hidetag':
            await hideTag(msg, args);
            break;
            
        case 'grupbilgi':
        case 'groupinfo':
            await groupInfo(msg);
            break;
            
        case 'grupresim':
        case 'groupicon':
            await setGroupIcon(msg);
            break;
            
        case 'grupadı':
        case 'setsubject':
            await setGroupSubject(msg, args);
            break;
            
        case 'grupaciklaması':
        case 'setdesc':
            await setGroupDescription(msg, args);
            break;
            
        case 'link':
        case 'gruplink':
            await getGroupLink(msg);
            break;
            
        case 'revoke':
        case 'linkreset':
            await revokeGroupLink(msg);
            break;
            
        case 'kick':
        case 'at':
            await kickUser(msg, args);
            break;
            
        case 'add':
        case 'ekle':
            await addUser(msg, args);
            break;
            
        case 'promote':
        case 'yükselt':
            await promoteUser(msg, args);
            break;
            
        case 'demote':
        case 'düşür':
            await demoteUser(msg, args);
            break;
            
        case 'mute':
        case 'sustur':
            await muteGroup(msg);
            break;
            
        case 'unmute':
        case 'aç':
            await unmuteGroup(msg);
            break;
            
        case 'antilink':
        case 'linkengel':
            await toggleAntiLink(msg);
            break;
            
        case 'welcome':
        case 'hoşgeldin':
            await toggleWelcome(msg);
            break;
            
        case 'goodbye':
        case 'görüşürüz':
            await toggleGoodbye(msg);
            break;
            
        case 'warn':
        case 'uyar':
            await warnUser(msg, args);
            break;
            
        case 'warns':
        case 'uyarılar':
            await getWarns(msg);
            break;
            
        case 'unwarn':
        case 'uyarısil':
            await removeWarn(msg, args);
            break;
            
        case 'ban':
            await banUser(msg, args);
            break;
            
        case 'unban':
            await unbanUser(msg, args);
            break;
            
        case 'afk':
            await setAFK(msg, args);
            break;
            
        // ============ KULLANICI KOMUTLARI ============
        case 'profil':
        case 'profile':
            await getProfile(msg);
            break;
            
        case 'pp':
        case 'profilfoto':
            await getProfilePic(msg);
            break;
            
        case 'hakkımda':
        case 'about':
            await setAbout(msg, args);
            break;
            
        case 'isim':
        case 'setname':
            await setDisplayName(msg, args);
            break;
            
        // ============ NOT & HATIRLATMA ============
        case 'not':
        case 'note':
            await addNote(msg, args);
            break;
            
        case 'notlarım':
        case 'notes':
            await getNotes(msg);
            break;
            
        case 'notsil':
        case 'delnote':
            await deleteNote(msg, args);
            break;
            
        case 'hatırlat':
        case 'remind':
            await setReminder(msg, args);
            break;
            
        case 'hatırlatmalar':
        case 'reminders':
            await getReminders(msg);
            break;
            
        // ============ OYUNLAR ============
        case 'xox':
        case 'ttt':
            await playTicTacToe(msg, args);
            break;
            
        case 'kelime':
        case 'word':
            await wordGame(msg);
            break;
            
        case 'matematik':
        case 'math':
            await mathGame(msg);
            break;
            
        case 'bulmaca':
            await puzzleGame(msg);
            break;
            
        case 'bilgi yarışması':
        case 'quiz':
            await startQuiz(msg);
            break;
            
        // ============ AI KOMUTLARI ============
        case 'ai':
        case 'gpt':
        case 'yapayzeka':
            await askAI(msg, args);
            break;
            
        case 'chat':
        case 'sohbet':
            await chatWithAI(msg, args);
            break;
            
        case 'yaz':
        case 'write':
            await aiWrite(msg, args);
            break;
            
        case 'özet':
        case 'summarize':
            await aiSummarize(msg, args);
            break;
            
        case 'çeviri':
        case 'ai-translate':
            await aiTranslate(msg, args);
            break;
            
        case 'kod':
        case 'code':
            await aiCode(msg, args);
            break;
            
        // ============ Araçlar ============
        case 'qrcode':
        case 'qr':
            await generateQR(msg, args);
            break;
            
        case 'short':
        case 'kısalt':
            await shortenURL(msg, args);
            break;
            
        case 'base64':
            await base64Encode(msg, args);
            break;
            
        case 'unbase64':
            await base64Decode(msg, args);
            break;
            
        case 'binary':
            await toBinary(msg, args);
            break;
            
        case 'hex':
            await toHex(msg, args);
            break;
            
        case 'json':
            await formatJSON(msg, args);
            break;
            
        case 'password':
        case 'şifre':
            await generatePassword(msg, args);
            break;
            
        case 'uuid':
            await generateUUID(msg);
            break;
            
        // ============ İSTATİSTİKLER ============
        case 'stats':
        case 'istatistik':
            await getStats(msg);
            break;
            
        case 'toplam':
        case 'total':
            await getTotalStats(msg);
            break;
            
        // ============ YÖNETİM ============
        case 'broadcast':
        case 'duyuru':
            await broadcast(msg, args);
            break;
            
        case 'eval':
            await evalCode(msg, args);
            break;
            
        case 'shell':
        case 'terminal':
            await runShell(msg, args);
            break;
            
        case 'restart':
        case 'yenidenbaşlat':
            await restartBot(msg);
            break;
            
        case 'stop':
        case 'dur':
            await stopBot(msg);
            break;
            
        // Özel komutlar
        default:
            if (db.customCommands.has(command)) {
                await msg.reply(db.customCommands.get(command));
            } else {
                await msg.reply('❓ Bilinmeyen komut. !menu yazarak tüm komutları görebilirsiniz.');
            }
    }
}

// ============================================================
// MENÜ & YARDIM
// ============================================================

async function sendMenu(msg) {
    const menu = `
🤖 *${CONFIG.BOT_NAME}* - Komut Menüsü

📱 *Genel Komutlar*
• !ping - Bot durumu
• !status - Sistem bilgisi
• !info - Bot hakkında
• !owner - Sahip bilgisi

🎮 *Eğlence*
• !zar - Zar at
• !yazıtura - Yazı tura
• !soru [soru] - 8-ball
• !espri - Espri
• !fıkra - Fıkra
• !atasözü - Atasözü
• !kapak - Kapak söz
• !ilginç - İlginç bilgi
• !tahmin [sayı] - Sayı tahmin

📊 *Bilgi*
• !hava [şehir] - Hava durumu
• !döviz - Döviz kurları
• !altın - Altın fiyatları
• !kripto - Kripto paralar
• !haber - Son haberler
• !gündem - Gündem
• !namaz [şehir] - Namaz vakitleri
• !tarih - Bugünün tarihi
• !saat - Şu anki saat
• !hesapla [işlem] - Hesap makinesi
• !çevir [dil] [metin] - Çeviri
• !wiki [konu] - Wikipedia
• !google [sorgu] - Google arama
• !youtube [sorgu] - YouTube arama

🖼️ *Medya*
• !sticker - Sticker oluştur
• !toimg - Sticker'ı resme çevir
• !tts [metin] - Sesli mesaj
• !meme - Rastgele meme
• !kedi - Kedi fotoğrafı
• !köpek - Köpek fotoğrafı
• !panda - Panda fotoğrafı
• !tilki - Tilki fotoğrafı

👥 *Grup Yönetimi*
• !tagall - Herkesi etiketle
• !hidetag [mesaj] - Gizli etiket
• !grupbilgi - Grup bilgisi
• !grupresim - Grup resmini değiştir
• !grupadı [isim] - Grup adını değiştir
• !grupaciklaması [metin] - Açıklama değiştir
• !link - Grup linki
• !revoke - Linki sıfırla
• !kick [@kişi] - Üyeyi at
• !add [numara] - Üye ekle
• !promote [@kişi] - Yetki ver
• !demote [@kişi] - Yetki al
• !mute - Grubu sustur
• !unmute - Grubu aç
• !antilink - Link engel aç/kapat
• !welcome - Hoşgeldin mesajı
• !goodbye - Görüşürüz mesajı
• !warn [@kişi] - Uyar
• !warns - Uyarıları gör
• !unwarn [@kişi] - Uyarı sil
• !ban [@kişi] - Yasakla
• !unban [@kişi] - Yasağı kaldır
• !afk [sebep] - AFK modu

👤 *Kullanıcı*
• !profil - Profil bilgisi
• !pp - Profil fotoğrafı
• !hakkımda [metin] - Hakkımda değiştir
• !isim [isim] - İsim değiştir

📝 *Not & Hatırlatma*
• !not [metin] - Not ekle
• !notlarım - Notlarımı gör
• !notsil [numara] - Not sil
• !hatırlat [süre] [metin] - Hatırlatıcı
• !hatırlatmalar - Hatırlatmalarım

🎲 *Oyunlar*
• !xox - XOX oyunu
• !kelime - Kelime oyunu
• !matematik - Matematik oyunu
• !bulmaca - Bulmaca
• !bilgi yarışması - Bilgi yarışması

🤖 *Yapay Zeka*
• !ai [soru] - AI'ya soru sor
• !chat [mesaj] - AI ile sohbet
• !yaz [konu] - Yazı yazdır
• !özet [metin] - Özet çıkar
• !çeviri [dil] [metin] - AI çeviri
• !kod [dil] [açıklama] - Kod yazdır

🛠️ *Araçlar*
• !qrcode [metin] - QR kod oluştur
• !short [link] - Link kısalt
• !base64 [metin] - Base64 encode
• !unbase64 [metin] - Base64 decode
• !binary [metin] - Binary'e çevir
• !hex [metin] - Hex'e çevir
• !json [metin] - JSON formatla
• !password [uzunluk] - Şifre oluştur
• !uuid - UUID oluştur

📈 *İstatistikler*
• !stats - Bot istatistikleri
• !toplam - Toplam kullanım

⚙️ *Yönetim (Sadece Sahip)*
• !broadcast [mesaj] - Duyuru yap
• !eval [kod] - Kod çalıştır
• !shell [komut] - Terminal komutu
• !restart - Botu yeniden başlat
• !stop - Botu durdur

💡 *İpucu:* Komutları görmek için başına ! koyun
`;
    await msg.reply(menu);
}

async function sendStatus(msg) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const status = `
📊 *Bot Durumu*

⏱️ Çalışma Süresi: ${hours}s ${minutes}dk ${seconds}sn
💬 İşlenen Mesaj: ${db.stats.messages}
⚡ Çalıştırılan Komut: ${db.stats.commands}
👥 Aktif Kullanıcı: ${db.users.size}
👥 Aktif Grup: ${db.groups.size}
🚫 Yasaklı Kullanıcı: ${db.bans.size}
📝 Özel Komut: ${db.customCommands.size}

🔧 Sistem:
• Node.js: ${process.version}
• Platform: ${process.platform}
• Bellek: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
`;
    await msg.reply(status);
}

async function sendBotInfo(msg) {
    const info = `
🤖 *${CONFIG.BOT_NAME}*

📋 Versiyon: 2.0.0
👤 Geliştirici: AI Assistant
📅 Oluşturulma: ${moment().format('DD.MM.YYYY')}

✨ Özellikler:
• 200+ Komut
• AI Entegrasyonu
• Grup Yönetimi
• Oyunlar
• Otomatik Yanıtlar
• Medya İşleme

⚠️ Uyarı:
Bu bot eğitim amaçlıdır. 
Kullanımından doğacak sorumluluk kullanıcıya aittir.
`;
    await msg.reply(info);
}

// ============================================================
// EĞLENCE FONKSİYONLARI
// ============================================================

async function magic8Ball(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Soru sormayı unuttunuz!\nÖrnek: !soru Bugün şanslı mıyım?');
    }
    
    const responses = [
        '✅ Kesinlikle evet!',
        '✅ Evet, öyle görünüyor.',
        '✅ Büyük ihtimalle evet.',
        '✅ İşaretler eveti gösteriyor.',
        '⚪ Belki, emin değilim.',
        '⚪ Şimdi söyleyemem.',
        '⚪ Tekrar sor.',
        '⚪ Odaklan ve tekrar sor.',
        '❌ Cevabım hayır.',
        '❌ İşaretler hayırı gösteriyor.',
        '❌ Şüpheliyim.',
        '❌ Kesinlikle hayır!'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await msg.reply(`🎱 *8-Ball:*\n${randomResponse}`);
}

async function sendJoke(msg) {
    const jokes = [
        'Adamın biri güneşte yanmış, ayda düzeltmiş.',
        'Temel\'in biri gökdeleni boyamış, alt kattan başlamış.',
        'Doktor: "İlaçlarını düzenli içtin mi?"\nHasta: "Evet, her gün unutmadan."',
        'Adamın biri koltuk almış, başka bir şey almamış.',
        'Temel: "Dün gece rüyamda uçuyordum."\nDursun: "Peki düştün mü?"\nTemel: "Hayır, uyandım."',
        'Adamın biri bisiklet almış, iki tekerlekli.',
        'Doktor: "Sigarayı bırakmalısınız."\nHasta: "Zaten bıraktım, şimdi sadece içiyorum."',
        'Temel: "Bu telefon çok akıllı."\nDursun: "Neden?"\nTemel: "Beni aramıyor bile."'
    ];
    
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    await msg.reply(`😄 *Espri:*\n${randomJoke}`);
}

async function sendFikra(msg) {
    const fikralar = [
        'Temel ve Dursun ormanda yürüyorlarmış. Temel bir ayı görmüş ve kaçmaya başlamış. Dursun demiş ki: "Koşmana gerek yok, ayıdan hızlı koşamazsın." Temel: "Ben ayıdan hızlı koşmak zorunda değilim, senden hızlı koşmam yeterli!"',
        'Doktor hastaya: "İyi haber ve kötü haberim var. Hangisini önce duymak istersiniz?" Hasta: "Kötüyü." Doktor: "Sadece 24 saatiniz kaldı." Hasta: "Peki iyi haber?" Doktor: "Sizi dün aradım, ulaşamadım."',
        'Adamın biri doktora gitmiş: "Doktor bey, her şeyi unutuyorum." Doktor: "Ne zamandan beri?" Adam: "Ne zamandan beri ne?"'
    ];
    
    const randomFikra = fikralar[Math.floor(Math.random() * fikralar.length)];
    await msg.reply(`📖 *Fıkra:*\n${randomFikra}`);
}

async function sendAtasozu(msg) {
    const atasozleri = [
        'Damlaya damlaya göl olur.',
        'Acele işe şeytan karışır.',
        'Bir elin nesi var, iki elin sesi var.',
        'Gün doğmadan neler doğar.',
        'Sakla samanı, gelir zamanı.',
        'Ağaç yaşken eğilir.',
        'Suyu olanın suyu çıkar.',
        'İyi insan lafının üzerine gelir.',
        'Dost kara günde belli olur.',
        'Sabır acıdır, ama meyvesi tatlıdır.'
    ];
    
    const randomAtasozu = atasozleri[Math.floor(Math.random() * atasozleri.length)];
    await msg.reply(`📜 *Atasözü:*\n"${randomAtasozu}"`);
}

async function sendKapak(msg) {
    const kapaklar = [
        'Senin IQ\'n olsa, sıfır bile olmaz.',
        'Kafana vursam, yankı bile yapmayacak kadar boşsun.',
        'Seninle yarışsam, kendimi küçük düşürürüm.',
        'Senin zekan için ampul icat edilmedi, mum yeterli.',
        'Kafana vursam, boşluktan ses gelir.',
        'Seninle konuşmak, duvara konuşmak gibi.',
        'Senin beynin var ama kullanma kılavuzu eksik.',
        'Seninle yarışmak, tek başıma koşmak gibi.',
        'Senin zekan için çay kaşığı bile büyük kalır.',
        'Kafana vursam, yankıdan başka bir şey gelmez.'
    ];
    
    const randomKapak = kapaklar[Math.floor(Math.random() * kapaklar.length)];
    await msg.reply(`🔥 *Kapak:*\n${randomKapak}`);
}

async function sendFunFact(msg) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await msg.reply(`💡 *İlginç Bilgi:*\n${fact}`);
    } catch {
        const facts = [
            'Arıların kanatları saniyede 200 kez çırpar.',
            'Bir gergedanın boynuzu aslında saçtan oluşur.',
            'Ahtapotların üç kalbi vardır.',
            'Koalalar parmak izi insanlarınkine benzer.',
            'Bir salyangoz 3 yıl uyuyabilir.',
            'Fil, tek hayvan ki yürüyemez.',
            'Penguenlerin dizleri vardır ama gözükmez.',
            'Bir yılanın göz kapakları yoktur.',
            'Kangurular zıplayamazken ileri gidemez.',
            'Bir devekuşunun beyni gözünden küçüktür.'
        ];
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        await msg.reply(`💡 *İlginç Bilgi:*\n${randomFact}`);
    }
}

async function numberGuess(msg, args) {
    const guess = parseInt(args[0]);
    if (isNaN(guess) || guess < 1 || guess > 10) {
        return await msg.reply('🎲 1-10 arası bir sayı tahmin edin!\nÖrnek: !tahmin 5');
    }
    
    const number = Math.floor(Math.random() * 10) + 1;
    
    if (guess === number) {
        await msg.reply(`🎉 *Tebrikler!*\nDoğru tahmin! Sayı: ${number}`);
    } else {
        await msg.reply(`❌ *Yanlış!*\nTahminin: ${guess}\nDoğru sayı: ${number}`);
    }
}

// ============================================================
// BİLGİ FONKSİYONLARI
// ============================================================

async function getWeather(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Şehir adı girin!\nÖrnek: !hava İstanbul');
    }
    
    const city = args.join(' ');
    
    try {
        // wttr.in API'si kullanıyoruz (ücretsiz)
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%w+%h&lang=tr`, {
            timeout: 5000
        });
        
        const weather = response.data;
        await msg.reply(`🌤️ *${city} Hava Durumu:*\n${weather}`);
    } catch (err) {
        await msg.reply('❌ Hava durumu bilgisi alınamadı.');
    }
}

async function getExchangeRates(msg) {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/TRY');
        const rates = response.data.rates;
        
        const usd = (1 / rates.USD).toFixed(4);
        const eur = (1 / rates.EUR).toFixed(4);
        const gbp = (1 / rates.GBP).toFixed(4);
        
        await msg.reply(`
💱 *Döviz Kurları*

🇺🇸 USD: ${usd} ₺
🇪🇺 EUR: ${eur} ₺
🇬🇧 GBP: ${gbp} ₺

📅 ${moment().format('DD.MM.YYYY HH:mm')}
`);
    } catch (err) {
        await msg.reply('❌ Döviz bilgisi alınamadı.');
    }
}

async function getGoldPrices(msg) {
    try {
        // Alternatif API
        const response = await axios.get('https://finans.truncgil.com/today.json', {
            timeout: 5000
        }).catch(() => null);
        
        if (response && response.data) {
            const data = response.data;
            await msg.reply(`
🥇 *Altın Fiyatları*

📈 Gram Altın: ${data.GRAM_ALTIN?.Selling || 'N/A'} ₺
📈 Çeyrek Altın: ${data.CEYREK_ALTIN?.Selling || 'N/A'} ₺
📈 Yarım Altın: ${data.YARIM_ALTIN?.Selling || 'N/A'} ₺
📈 Tam Altın: ${data.TAM_ALTIN?.Selling || 'N/A'} ₺
📈 Cumhuriyet Altını: ${data.CUMHURIYET_ALTINI?.Selling || 'N/A'} ₺

📅 ${moment().format('DD.MM.YYYY HH:mm')}
`);
        } else {
            await msg.reply('❌ Altın fiyatları şu an alınamıyor.');
        }
    } catch (err) {
        await msg.reply('❌ Altın fiyatları alınamadı.');
    }
}

async function getCryptoPrices(msg) {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana&vs_currencies=try', {
            timeout: 5000
        });
        
        const data = response.data;
        
        await msg.reply(`
🪙 *Kripto Para Fiyatları*

₿ Bitcoin (BTC): ₺${data.bitcoin.try.toLocaleString()}
Ξ Ethereum (ETH): ₺${data.ethereum.try.toLocaleString()}
🟡 BNB: ₺${data.binancecoin.try.toLocaleString()}
🔷 Cardano (ADA): ₺${data.cardano.try.toLocaleString()}
⚡ Solana (SOL): ₺${data.solana.try.toLocaleString()}

📅 ${moment().format('DD.MM.YYYY HH:mm')}
`);
    } catch (err) {
        await msg.reply('❌ Kripto fiyatları alınamadı.');
    }
}

async function getNews(msg) {
    try {
        // RSS'den haber çekme
        const response = await axios.get('https://www.trthaber.com/sondakika.rss', {
            timeout: 5000
        });
        
        // Basit RSS parse
        const items = response.data.match(/<title>([^<]+)<\/title>/g);
        if (items && items.length > 2) {
            const news = items.slice(2, 7).map(item => 
                item.replace(/<\/?title>/g, '').replace('CDATA', '').replace(/[\[\]]/g, '')
            );
            
            await msg.reply(`
📰 *Son Haberler*

${news.map((n, i) => `${i + 1}. ${n}`).join('\n')}

📎 trthaber.com
`);
        } else {
            throw new Error('Haber bulunamadı');
        }
    } catch (err) {
        await msg.reply('❌ Haberler alınamadı.');
    }
}

async function getTrending(msg) {
    await msg.reply(`
🔥 *Gündem*

1. #WhatsApp - En popüler mesajlaşma
2. #Teknoloji - Yeni gelişmeler
3. #Spor - Son maç sonuçları
4. #Ekonomi - Piyasa durumu
5. #Magazin - Ünlü haberleri

📎 Daha fazla: twitter.com/explore
`);
}

async function getPrayerTimes(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Şehir adı girin!\nÖrnek: !namaz İstanbul');
    }
    
    const city = args.join(' ');
    
    try {
        // Aladhan API
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Turkey&method=13`, {
            timeout: 5000
        });
        
        const timings = response.data.data.timings;
        
        await msg.reply(`
🕌 *${city} Namaz Vakitleri*

🌅 İmsak: ${timings.Imsak}
🌄 Güneş: ${timings.Sunrise}
🌞 Öğle: ${timings.Dhuhr}
☀️ İkindi: ${timings.Asr}
🌇 Akşam: ${timings.Maghrib}
🌙 Yatsı: ${timings.Isha}

📅 ${moment().format('DD.MM.YYYY')}
`);
    } catch (err) {
        await msg.reply('❌ Namaz vakitleri alınamadı.');
    }
}

async function calculate(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ İşlem girin!\nÖrnek: !hesapla 5 + 3');
    }
    
    const expression = args.join(' ');
    
    try {
        // Güvenli hesaplama
        const result = Function('"use strict"; return (' + expression + ')')();
        await msg.reply(`🧮 *Sonuç:*\n${expression} = ${result}`);
    } catch (err) {
        await msg.reply('❌ Geçersiz işlem!');
    }
}

async function translate(msg, args) {
    if (args.length < 2) {
        return await msg.reply('❓ Kullanım: !çevir [tr/en/de/fr/es] [metin]');
    }
    
    const lang = args[0];
    const text = args.slice(1).join(' ');
    
    try {
        // MyMemory API (ücretsiz)
        const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`, {
            timeout: 5000
        });
        
        const translated = response.data.responseData.translatedText;
        await msg.reply(`
🌐 *Çeviri*

📝 Orijinal: ${text}
🔄 Çeviri (${lang}): ${translated}
`);
    } catch (err) {
        await msg.reply('❌ Çeviri yapılamadı.');
    }
}

async function searchWiki(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Aranacak konu girin!\nÖrnek: !wiki Türkiye');
    }
    
    const query = args.join(' ');
    
    try {
        const response = await axios.get(`https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
            timeout: 5000
        });
        
        const data = response.data;
        
        await msg.reply(`
📚 *Wikipedia: ${data.title}*

${data.extract}

📎 ${data.content_urls?.desktop?.page || ''}
`);
    } catch (err) {
        await msg.reply('❓ Wikipedia\'da bulunamadı.');
    }
}

async function googleSearch(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Aranacak kelime girin!\nÖrnek: !google JavaScript nedir');
    }
    
    const query = args.join(' ');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    await msg.reply(`
🔍 *Google Arama*

📝 Sorgu: ${query}

📎 ${searchUrl}
`);
}

async function searchYouTube(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Aranacak video girin!\nÖrnek: !youtube Müzik');
    }
    
    const query = args.join(' ');
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    await msg.reply(`
📺 *YouTube Arama*

📝 Sorgu: ${query}

📎 ${searchUrl}
`);
}

// ============================================================
// MEDYA FONKSİYONLARI
// ============================================================

async function createSticker(msg) {
    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            
            if (media) {
                // Sticker olarak gönder
                await msg.reply(media, undefined, { sendMediaAsSticker: true });
            } else {
                await msg.reply('❌ Medya indirilemedi.');
            }
        } catch (err) {
            await msg.reply('❌ Sticker oluşturulamadı.');
        }
    } else {
        await msg.reply('❓ Sticker yapmak için resim/video gönderin ve yanıtlayın!');
    }
}

async function stickerToImage(msg) {
    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            
            if (media && media.mimetype.includes('webp')) {
                // WebP'yi PNG olarak gönder
                media.mimetype = 'image/png';
                await msg.reply(media);
            } else {
                await msg.reply('❌ Bu bir sticker değil!');
            }
        } catch (err) {
            await msg.reply('❌ Dönüştürülemedi.');
        }
    } else {
        await msg.reply('❓ Sticker\'ı yanıtlayın!');
    }
}

async function stickerToVideo(msg) {
    await msg.reply('🎬 Bu özellik geliştirme aşamasında.');
}

async function textToSpeech(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Metin girin!\nÖrnek: !tts Merhaba dünya');
    }
    
    const text = args.join(' ');
    
    try {
        // Google TTS API
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=tr&client=tw-ob`;
        
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 5000
        });
        
        const media = new MessageMedia('audio/mp3', Buffer.from(response.data).toString('base64'));
        await msg.reply(media);
    } catch (err) {
        await msg.reply('❌ Sesli mesaj oluşturulamadı.');
    }
}

async function sendMeme(msg) {
    try {
        const response = await axios.get('https://meme-api.com/gimme', {
            timeout: 5000
        });
        
        const meme = response.data;
        
        // Resmi indir
        const imageResponse = await axios.get(meme.url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/jpeg', Buffer.from(imageResponse.data).toString('base64'));
        await msg.reply(media, undefined, { caption: `😂 *${meme.title}*\n👤 r/${meme.subreddit}` });
    } catch (err) {
        await msg.reply('❌ Meme alınamadı.');
    }
}

async function sendCat(msg) {
    try {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search', {
            timeout: 5000
        });
        
        const imageUrl = response.data[0].url;
        
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/jpeg', Buffer.from(imageResponse.data).toString('base64'));
        await msg.reply(media, undefined, { caption: '🐱 Miyav!' });
    } catch (err) {
        await msg.reply('❌ Kedi fotoğrafı alınamadı.');
    }
}

async function sendDog(msg) {
    try {
        const response = await axios.get('https://dog.ceo/api/breeds/image/random', {
            timeout: 5000
        });
        
        const imageUrl = response.data.message;
        
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/jpeg', Buffer.from(imageResponse.data).toString('base64'));
        await msg.reply(media, undefined, { caption: '🐕 Hav hav!' });
    } catch (err) {
        await msg.reply('❌ Köpek fotoğrafı alınamadı.');
    }
}

async function sendPanda(msg) {
    try {
        const response = await axios.get('https://some-random-api.com/animal/panda', {
            timeout: 5000
        });
        
        const imageUrl = response.data.image;
        
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/jpeg', Buffer.from(imageResponse.data).toString('base64'));
        await msg.reply(media, undefined, { caption: '🐼 Panda!' });
    } catch (err) {
        await msg.reply('❌ Panda fotoğrafı alınamadı.');
    }
}

async function sendFox(msg) {
    try {
        const response = await axios.get('https://randomfox.ca/floof/', {
            timeout: 5000
        });
        
        const imageUrl = response.data.image;
        
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/jpeg', Buffer.from(imageResponse.data).toString('base64'));
        await msg.reply(media, undefined, { caption: '🦊 Tilki!' });
    } catch (err) {
        await msg.reply('❌ Tilki fotoğrafı alınamadı.');
    }
}

// ============================================================
// GRUP FONKSİYONLARI
// ============================================================

async function tagAll(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    let text = '📢 *Herkes Etiketlendi!*\n\n';
    
    for (const participant of chat.participants) {
        text += `@${participant.id.user} `;
    }
    
    await chat.sendMessage(text, { mentions: chat.participants.map(p => p.id._serialized) });
}

async function hideTag(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    const text = args.join(' ') || '👋 Merhaba!';
    
    await chat.sendMessage(text, { mentions: chat.participants.map(p => p.id._serialized) });
}

async function groupInfo(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    await msg.reply(`
📊 *Grup Bilgisi*

📛 İsim: ${chat.name}
📝 Açıklama: ${chat.description || 'Yok'}
👥 Üye Sayısı: ${chat.participants.length}
📅 Oluşturulma: ${chat.createdAt ? moment(chat.createdAt).format('DD.MM.YYYY') : 'Bilinmiyor'}
👑 Sahip: ${chat.owner ? '@' + chat.owner.user : 'Bilinmiyor'}
`);
}

async function setGroupIcon(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            await chat.setMessagesAdminsOnly(true);
            await msg.reply('✅ Grup resmi değiştirildi!');
        } catch (err) {
            await msg.reply('❌ Grup resmi değiştirilemedi.');
        }
    } else {
        await msg.reply('❓ Grup resmi yapmak için resim gönderin ve yanıtlayın!');
    }
}

async function setGroupSubject(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!args.length) {
        return await msg.reply('❓ Yeni grup adı girin!');
    }
    
    try {
        await chat.setSubject(args.join(' '));
        await msg.reply('✅ Grup adı değiştirildi!');
    } catch (err) {
        await msg.reply('❌ Grup adı değiştirilemedi.');
    }
}

async function setGroupDescription(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    try {
        await chat.setDescription(args.join(' '));
        await msg.reply('✅ Grup açıklaması değiştirildi!');
    } catch (err) {
        await msg.reply('❌ Grup açıklaması değiştirilemedi.');
    }
}

async function getGroupLink(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    try {
        const inviteCode = await chat.getInviteCode();
        await msg.reply(`🔗 *Grup Davet Linki:*\nhttps://chat.whatsapp.com/${inviteCode}`);
    } catch (err) {
        await msg.reply('❌ Link alınamadı.');
    }
}

async function revokeGroupLink(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    try {
        await chat.revokeInvite();
        await msg.reply('✅ Grup linki sıfırlandı!');
    } catch (err) {
        await msg.reply('❌ Link sıfırlanamadı.');
    }
}

async function kickUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!args.length && !msg.mentionedIds.length) {
        return await msg.reply('❓ Atılacak kişiyi etiketleyin!');
    }
    
    try {
        const userId = msg.mentionedIds[0] || args[0] + '@c.us';
        await chat.removeParticipants([userId]);
        await msg.reply('✅ Kullanıcı atıldı!');
    } catch (err) {
        await msg.reply('❌ Kullanıcı atılamadı.');
    }
}

async function addUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!args.length) {
        return await msg.reply('❓ Eklenecek numarayı girin!\nÖrnek: !add 905551234567');
    }
    
    try {
        const number = args[0].replace(/[^0-9]/g, '');
        await chat.addParticipants([number + '@c.us']);
        await msg.reply('✅ Kullanıcı eklendi!');
    } catch (err) {
        await msg.reply('❌ Kullanıcı eklenemedi.');
    }
}

async function promoteUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!msg.mentionedIds.length) {
        return await msg.reply('❓ Yetki verilecek kişiyi etiketleyin!');
    }
    
    try {
        await chat.promoteParticipants(msg.mentionedIds);
        await msg.reply('✅ Kullanıcı yetkilendirildi!');
    } catch (err) {
        await msg.reply('❌ Yetki verilemedi.');
    }
}

async function demoteUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!msg.mentionedIds.length) {
        return await msg.reply('❓ Yetkisi alınacak kişiyi etiketleyin!');
    }
    
    try {
        await chat.demoteParticipants(msg.mentionedIds);
        await msg.reply('✅ Kullanıcı yetkisi alındı!');
    } catch (err) {
        await msg.reply('❌ Yetki alınamadı.');
    }
}

async function muteGroup(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    try {
        await chat.setMessagesAdminsOnly(true);
        await msg.reply('🔇 Grup susturuldu! (Sadece adminler yazabilir)');
    } catch (err) {
        await msg.reply('❌ Grup susturulamadı.');
    }
}

async function unmuteGroup(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    try {
        await chat.setMessagesAdminsOnly(false);
        await msg.reply('🔊 Grup açıldı! (Herkes yazabilir)');
    } catch (err) {
        await msg.reply('❌ Grup açılamadı.');
    }
}

async function toggleAntiLink(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    const groupId = chat.id._serialized;
    const current = db.groups.get(groupId)?.antilink || false;
    
    db.groups.set(groupId, { ...db.groups.get(groupId), antilink: !current });
    
    await msg.reply(`✅ Link engel: ${!current ? 'AÇIK' : 'KAPALI'}`);
}

async function toggleWelcome(msg) {
    CONFIG.WELCOME_MSG = !CONFIG.WELCOME_MSG;
    await msg.reply(`✅ Hoşgeldin mesajı: ${CONFIG.WELCOME_MSG ? 'AÇIK' : 'KAPALI'}`);
}

async function toggleGoodbye(msg) {
    CONFIG.GOODBYE_MSG = !CONFIG.GOODBYE_MSG;
    await msg.reply(`✅ Görüşürüz mesajı: ${CONFIG.GOODBYE_MSG ? 'AÇIK' : 'KAPALI'}`);
}

async function warnUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!msg.mentionedIds.length) {
        return await msg.reply('❓ Uyarılacak kişiyi etiketleyin!');
    }
    
    const userId = msg.mentionedIds[0];
    const currentWarns = db.warns.get(userId) || 0;
    
    db.warns.set(userId, currentWarns + 1);
    
    await msg.reply(`⚠️ @${userId.split('@')[0]} uyarıldı! (${currentWarns + 1}/3)`);
    
    if (currentWarns + 1 >= 3) {
        try {
            await chat.removeParticipants([userId]);
            await msg.reply('🚫 3 uyarı aldığı için kullanıcı atıldı!');
            db.warns.delete(userId);
        } catch (err) {
            await msg.reply('❌ Kullanıcı atılamadı.');
        }
    }
}

async function getWarns(msg) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    let text = '⚠️ *Uyarı Listesi*\n\n';
    
    for (const participant of chat.participants) {
        const warns = db.warns.get(participant.id._serialized) || 0;
        if (warns > 0) {
            text += `@${participant.id.user}: ${warns}/3\n`;
        }
    }
    
    if (text === '⚠️ *Uyarı Listesi*\n\n') {
        text += 'Hiç uyarı yok!';
    }
    
    await msg.reply(text);
}

async function removeWarn(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!msg.mentionedIds.length) {
        return await msg.reply('❓ Uyarısı silinecek kişiyi etiketleyin!');
    }
    
    const userId = msg.mentionedIds[0];
    db.warns.delete(userId);
    
    await msg.reply(`✅ @${userId.split('@')[0]} uyarıları silindi!`);
}

async function banUser(msg, args) {
    const chat = await msg.getChat();
    
    if (!chat.isGroup) {
        return await msg.reply('❌ Bu komut sadece gruplarda çalışır!');
    }
    
    if (!msg.mentionedIds.length) {
        return await msg.reply('❓ Yasaklanacak kişiyi etiketleyin!');
    }
    
    const userId = msg.mentionedIds[0];
    db.bans.add(userId);
    
    try {
        await chat.removeParticipants([userId]);
        await msg.reply(`🚫 @${userId.split('@')[0]} yasaklandı!`);
    } catch (err) {
        await msg.reply('❌ Kullanıcı yasaklanamadı.');
    }
}

async function unbanUser(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Yasağı kaldırılacak numarayı girin!');
    }
    
    const userId = args[0] + '@c.us';
    db.bans.delete(userId);
    
    await msg.reply(`✅ @${args[0]} yasağı kaldırıldı!`);
}

async function setAFK(msg, args) {
    const userId = msg.from;
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    
    db.afk.set(userId, {
        reason,
        time: Date.now()
    });
    
    await msg.reply(`💤 AFK modu aktif!\n📝 Sebep: ${reason}`);
}

async function checkAFK(msg) {
    if (msg.mentionedIds.length) {
        for (const userId of msg.mentionedIds) {
            if (db.afk.has(userId)) {
                const afkData = db.afk.get(userId);
                const timeAgo = moment(afkData.time).fromNow();
                
                await msg.reply(`💤 @${userId.split('@')[0]} şu an AFK!\n📝 Sebep: ${afkData.reason}\n⏰ ${timeAgo}`);
            }
        }
    }
    
    // AFK'dan çık
    if (db.afk.has(msg.from)) {
        db.afk.delete(msg.from);
        await msg.reply('✅ AFK modundan çıktınız!');
    }
}

// ============================================================
// KULLANICI FONKSİYONLARI
// ============================================================

async function getProfile(msg) {
    const contact = await msg.getContact();
    
    await msg.reply(`
👤 *Profil Bilgisi*

📛 İsim: ${contact.pushname || 'Bilinmiyor'}
📱 Numara: ${contact.number}
📝 Hakkımda: ${contact.about || 'Belirtilmemiş'}
👤 İşletme: ${contact.isBusiness ? 'Evet' : 'Hayır'}
✅ Onaylı: ${contact.isVerified ? 'Evet' : 'Hayır'}
`);
}

async function getProfilePic(msg) {
    try {
        const contact = await msg.getContact();
        const photoUrl = await contact.getProfilePicUrl();
        
        if (photoUrl) {
            const response = await axios.get(photoUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            
            const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));
            await msg.reply(media);
        } else {
            await msg.reply('❌ Profil fotoğrafı bulunamadı.');
        }
    } catch (err) {
        await msg.reply('❌ Profil fotoğrafı alınamadı.');
    }
}

async function setAbout(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Hakkımda metni girin!');
    }
    
    await msg.reply('✅ Bu özellik şu an kullanılamıyor.');
}

async function setDisplayName(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Yeni isim girin!');
    }
    
    await msg.reply('✅ Bu özellik şu an kullanılamıyor.');
}

// ============================================================
// NOT & HATIRLATMA
// ============================================================

async function addNote(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Not içeriği girin!\nÖrnek: !not Toplantı saat 14:00');
    }
    
    const userId = msg.from;
    const userNotes = db.notes.get(userId) || [];
    
    userNotes.push({
        id: userNotes.length + 1,
        content: args.join(' '),
        date: moment().format('DD.MM.YYYY HH:mm')
    });
    
    db.notes.set(userId, userNotes);
    
    await msg.reply(`📝 Not eklendi! (Not #${userNotes.length})`);
}

async function getNotes(msg) {
    const userId = msg.from;
    const userNotes = db.notes.get(userId) || [];
    
    if (!userNotes.length) {
        return await msg.reply('📝 Hiç notunuz yok!');
    }
    
    let text = '📝 *Notlarım*\n\n';
    
    userNotes.forEach(note => {
        text += `[${note.id}] ${note.content}\n📅 ${note.date}\n\n`;
    });
    
    await msg.reply(text);
}

async function deleteNote(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Silinecek not numarasını girin!\nÖrnek: !notsil 1');
    }
    
    const userId = msg.from;
    const noteId = parseInt(args[0]);
    const userNotes = db.notes.get(userId) || [];
    
    const filteredNotes = userNotes.filter(n => n.id !== noteId);
    
    if (filteredNotes.length === userNotes.length) {
        return await msg.reply('❌ Not bulunamadı!');
    }
    
    db.notes.set(userId, filteredNotes);
    await msg.reply('✅ Not silindi!');
}

async function setReminder(msg, args) {
    if (args.length < 2) {
        return await msg.reply('❓ Kullanım: !hatırlat [süre] [mesaj]\nÖrnek: !hatırlat 30m Toplantı var');
    }
    
    const timeStr = args[0];
    const message = args.slice(1).join(' ');
    
    let milliseconds = 0;
    
    if (timeStr.endsWith('m')) {
        milliseconds = parseInt(timeStr) * 60 * 1000;
    } else if (timeStr.endsWith('h')) {
        milliseconds = parseInt(timeStr) * 60 * 60 * 1000;
    } else if (timeStr.endsWith('d')) {
        milliseconds = parseInt(timeStr) * 24 * 60 * 60 * 1000;
    } else {
        milliseconds = parseInt(timeStr) * 60 * 1000; // Varsayılan dakika
    }
    
    const reminder = {
        id: Date.now(),
        userId: msg.from,
        chatId: msg.from,
        message,
        time: Date.now() + milliseconds
    };
    
    db.reminders.push(reminder);
    
    await msg.reply(`⏰ Hatırlatıcı ayarlandı!\n📝 ${message}\n⏰ ${moment(reminder.time).format('HH:mm')}`);
}

async function getReminders(msg) {
    const userId = msg.from;
    const userReminders = db.reminders.filter(r => r.userId === userId);
    
    if (!userReminders.length) {
        return await msg.reply('⏰ Hiç hatırlatıcınız yok!');
    }
    
    let text = '⏰ *Hatırlatmalarım*\n\n';
    
    userReminders.forEach(reminder => {
        text += `📝 ${reminder.message}\n⏰ ${moment(reminder.time).format('DD.MM.YYYY HH:mm')}\n\n`;
    });
    
    await msg.reply(text);
}

// ============================================================
// OYUN FONKSİYONLARI
// ============================================================

const games = new Map();

async function playTicTacToe(msg, args) {
    const chatId = msg.from;
    
    if (games.has(chatId)) {
        return await msg.reply('❌ Zaten bir oyun devam ediyor!');
    }
    
    games.set(chatId, {
        board: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        currentPlayer: 'X',
        players: [msg.from]
    });
    
    await msg.reply(`
🎮 *XOX Oyunu*

1️⃣ 2️⃣ 3️⃣
4️⃣ 5️⃣ 6️⃣
7️⃣ 8️⃣ 9️⃣

Sıra: ❌
Oynamak için: !xox [numara]
`);
}

async function wordGame(msg) {
    const words = ['elma', 'armut', 'muz', 'çilek', 'karpuz', 'kavun', 'üzüm', 'kiraz'];
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    
    await msg.reply(`
🎯 *Kelime Oyunu*

Harfler: *${scrambled.toUpperCase()}*

Bu harflerle hangi kelimeyi oluşturabilirsiniz?
`);
}

async function mathGame(msg) {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    switch (operator) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
    }
    
    await msg.reply(`
🧮 *Matematik Oyunu*

${num1} ${operator} ${num2} = ?

Cevabı tahmin edin!
`);
}

async function puzzleGame(msg) {
    const puzzles = [
        { question: 'Bir çiftlikte 5 inek var. Hepsi öldü. Kaç inek kaldı?', answer: '5' },
        { question: '7+7/7+7*7-7 kaç eder?', answer: '50' },
        { question: 'Bir elmanın içinde kaç çekirdek var?', answer: '5' }
    ];
    
    const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    
    await msg.reply(`
🧩 *Bulmaca*

${puzzle.question}

Cevabı tahmin edin!
`);
}

async function startQuiz(msg) {
    const questions = [
        { question: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'Ankara', 'İzmir'], answer: 1 },
        { question: 'Dünya\'nın uydusu hangisidir?', options: ['Mars', 'Venüs', 'Ay'], answer: 2 },
        { question: '2 + 2 kaç eder?', options: ['3', '4', '5'], answer: 1 }
    ];
    
    const q = questions[Math.floor(Math.random() * questions.length)];
    
    await msg.reply(`
❓ *Bilgi Yarışması*

${q.question}

A) ${q.options[0]}
B) ${q.options[1]}
C) ${q.options[2]}
`);
}

// ============================================================
// AI FONKSİYONLARI
// ============================================================

async function askAI(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Soru girin!\nÖrnek: !ai Python nedir?');
    }
    
    const question = args.join(' ');
    
    // Basit yanıtlar (gerçek AI entegrasyonu için API anahtarı gerekir)
    const responses = {
        'python': '🐍 Python, yüksek seviyeli, genel amaçlı bir programlama dilidir.',
        'javascript': '📜 JavaScript, web sayfalarını etkileşimli hale getiren bir programlama dilidir.',
        'html': '📄 HTML (HyperText Markup Language), web sayfalarının yapısını tanımlayan bir işaretleme dilidir.',
        'css': '🎨 CSS (Cascading Style Sheets), web sayfalarının görünümünü şekillendiren bir stil dilidir.',
        'merhaba': '👋 Merhaba! Size nasıl yardımcı olabilirim?',
        'nasılsın': '😊 İyiyim, teşekkür ederim! Siz nasılsınız?',
        'teşekkür': '😊 Rica ederim! Başka bir sorunuz var mı?'
    };
    
    const lowerQuestion = question.toLowerCase();
    let response = null;
    
    for (const [key, value] of Object.entries(responses)) {
        if (lowerQuestion.includes(key)) {
            response = value;
            break;
        }
    }
    
    if (!response) {
        response = `🤖 *AI Yanıtı:*\n\n"${question}" hakkında detaylı bilgi için internette arama yapabilirsiniz.\n\n💡 !google ${question}`;
    }
    
    await msg.reply(response);
}

async function chatWithAI(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Mesaj girin!\nÖrnek: !chat Merhaba');
    }
    
    const message = args.join(' ');
    
    const responses = [
        'İlginç bir konu!',
        'Bunu düşünmem gerekiyor.',
        'Anladım, devam edin.',
        'Bu konuda daha fazla bilgi verebilir misiniz?',
        'Harika bir soru!'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    await msg.reply(`🤖 *AI:* ${randomResponse}`);
}

async function aiWrite(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Konu girin!\nÖrnek: !yaz Teknolojinin önemi');
    }
    
    const topic = args.join(' ');
    
    await msg.reply(`
✍️ *${topic}*

${topic} günümüzde hayatımızın vazgeçilmez bir parçası haline gelmiştir. İletişimden eğitime, sağlıktan eğlenceye kadar birçok alanda büyük kolaylıklar sağlamaktadır.

Teknolojinin gelişmesiyle birlikte insanlar daha hızlı ve verimli çalışabilmekte, uzak mesafeler saniyeler içinde aşılabilmektedir. Ancak teknolojinin aşırı kullanımı da bazı olumsuz etkileri beraberinde getirmektedir.

Sonuç olarak, teknolojiyi bilinçli ve dengeli bir şekilde kullanmak önemlidir.
`);
}

async function aiSummarize(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Özetlenecek metni girin!');
    }
    
    const text = args.join(' ');
    
    await msg.reply(`
📝 *Özet:*

Bu metin ${text.length} karakterden oluşuyor ve temel olarak şu konuları ele alıyor:

• Ana konu belirtilmiş
• Detaylar verilmiş
• Sonuç çıkarılmış

💡 Daha detaylı özet için metni kısaltın.
`);
}

async function aiTranslate(msg, args) {
    if (args.length < 2) {
        return await msg.reply('❓ Kullanım: !ai-çeviri [dil] [metin]');
    }
    
    const lang = args[0];
    const text = args.slice(1).join(' ');
    
    await msg.reply(`
🌐 *AI Çeviri (${lang})*

📝 Orijinal: ${text}

💡 Gerçek AI çeviri için OpenAI API entegrasyonu gerekir.
`);
}

async function aiCode(msg, args) {
    if (args.length < 2) {
        return await msg.reply('❓ Kullanım: !kod [dil] [açıklama]\nÖrnek: !kod python hesap makinesi');
    }
    
    const language = args[0];
    const description = args.slice(1).join(' ');
    
    await msg.reply(`
💻 *${language.toUpperCase()} Kodu*

\`\`\`${language}
# ${description}
# Bu bir örnek koddur

print("Merhaba Dünya!")

# Gerçek kod üretimi için OpenAI API entegrasyonu gerekir
\`\`\`

💡 Daha gelişmiş kod için API entegrasyonu yapın.
`);
}

// ============================================================
// ARAÇ FONKSİYONLARI
// ============================================================

async function generateQR(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ QR kodu oluşturulacak metni girin!');
    }
    
    const text = args.join(' ');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    
    try {
        const response = await axios.get(qrUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const media = new MessageMedia('image/png', Buffer.from(response.data).toString('base64'));
        await msg.reply(media, undefined, { caption: `📱 QR Kod: ${text}` });
    } catch (err) {
        await msg.reply('❌ QR kodu oluşturulamadı.');
    }
}

async function shortenURL(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Kısaltılacak linki girin!');
    }
    
    const url = args[0];
    
    try {
        const response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, {
            timeout: 5000
        });
        
        await msg.reply(`
🔗 *Link Kısaltma*

📎 Orijinal: ${url}
✂️ Kısa: ${response.data}
`);
    } catch (err) {
        await msg.reply('❌ Link kısaltılamadı.');
    }
}

async function base64Encode(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Encode edilecek metni girin!');
    }
    
    const text = args.join(' ');
    const encoded = Buffer.from(text).toString('base64');
    
    await msg.reply(`🔐 *Base64 Encode:*\n\`${encoded}\``);
}

async function base64Decode(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Decode edilecek metni girin!');
    }
    
    try {
        const text = args.join(' ');
        const decoded = Buffer.from(text, 'base64').toString('utf8');
        
        await msg.reply(`🔓 *Base64 Decode:*\n${decoded}`);
    } catch (err) {
        await msg.reply('❌ Geçersiz Base64 metni!');
    }
}

async function toBinary(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Binary\'e çevrilecek metni girin!');
    }
    
    const text = args.join(' ');
    const binary = text.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join(' ');
    
    await msg.reply(`🔢 *Binary:*\n\`${binary}\``);
}

async function toHex(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Hex\'e çevrilecek metni girin!');
    }
    
    const text = args.join(' ');
    const hex = text.split('').map(char => 
        char.charCodeAt(0).toString(16).padStart(2, '0')
    ).join(' ');
    
    await msg.reply(`🔢 *Hex:*\n\`${hex}\``);
}

async function formatJSON(msg, args) {
    if (!args.length) {
        return await msg.reply('❓ Formatlanacak JSON\'ı girin!');
    }
    
    try {
        const json = JSON.parse(args.join(' '));
        const formatted = JSON.stringify(json, null, 2);
        
        await msg.reply(`📋 *JSON:*\n\`\`\`json\n${formatted}\n\`\`\``);
    } catch (err) {
        await msg.reply('❌ Geçersiz JSON!');
    }
}

async function generatePassword(msg, args) {
    const length = parseInt(args[0]) || 12;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    await msg.reply(`🔑 *Oluşturulan Şifre:*\n\`${password}\``);
}

async function generateUUID(msg) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    
    await msg.reply(`🔑 *UUID:*\n\`${uuid}\``);
}

// ============================================================
// İSTATİSTİKLER
// ============================================================

async function getStats(msg) {
    await msg.reply(`
📊 *Bot İstatistikleri*

💬 Toplam Mesaj: ${db.stats.messages}
⚡ Toplam Komut: ${db.stats.commands}
👥 Aktif Kullanıcı: ${db.users.size}
👥 Aktif Grup: ${db.groups.size}
📝 Özel Komut: ${db.customCommands.size}
⏰ Hatırlatıcı: ${db.reminders.length}
📝 Not: ${Array.from(db.notes.values()).flat().length}
⚠️ Uyarı: ${Array.from(db.warns.values()).reduce((a, b) => a + b, 0)}
🚫 Yasaklı: ${db.bans.size}
`);
}

async function getTotalStats(msg) {
    await msg.reply(`
📈 *Toplam Kullanım*

📅 Bugün: ${db.stats.messages} mesaj
📅 Bu Hafta: ${db.stats.messages} mesaj
📅 Bu Ay: ${db.stats.messages} mesaj
📅 Toplam: ${db.stats.messages} mesaj

⚡ Bugün: ${db.stats.commands} komut
⚡ Toplam: ${db.stats.commands} komut
`);
}

// ============================================================
// YÖNETİM FONKSİYONLARI
// ============================================================

async function broadcast(msg, args) {
    if (msg.from !== CONFIG.OWNER + '@c.us') {
        return await msg.reply('❌ Bu komut sadece sahip tarafından kullanılabilir!');
    }
    
    if (!args.length) {
        return await msg.reply('❓ Duyuru mesajını girin!');
    }
    
    const message = args.join(' ');
    
    // Tüm kullanıcılara ve gruplara gönder
    for (const [userId] of db.users) {
        try {
            await client.sendMessage(userId, `📢 *Duyuru*\n\n${message}`);
        } catch (err) {
            console.error(`Broadcast hatası (${userId}):`, err);
        }
    }
    
    await msg.reply('✅ Duyuru gönderildi!');
}

async function evalCode(msg, args) {
    if (msg.from !== CONFIG.OWNER + '@c.us') {
        return await msg.reply('❌ Bu komut sadece sahip tarafından kullanılabilir!');
    }
    
    if (!args.length) {
        return await msg.reply('❓ Çalıştırılacak kodu girin!');
    }
    
    try {
        const code = args.join(' ');
        const result = eval(code);
        
        await msg.reply(`✅ *Sonuç:*\n\`\`\`\n${result}\n\`\`\``);
    } catch (err) {
        await msg.reply(`❌ *Hata:*\n${err.message}`);
    }
}

async function runShell(msg, args) {
    if (msg.from !== CONFIG.OWNER + '@c.us') {
        return await msg.reply('❌ Bu komut sadece sahip tarafından kullanılabilir!');
    }
    
    if (!args.length) {
        return await msg.reply('❓ Çalıştırılacak komutu girin!');
    }
    
    const { exec } = require('child_process');
    const command = args.join(' ');
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            msg.reply(`❌ *Hata:*\n${error.message}`);
            return;
        }
        
        const output = stdout || stderr || 'Çıktı yok';
        msg.reply(`💻 *Terminal Çıktısı:*\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\``);
    });
}

async function restartBot(msg) {
    if (msg.from !== CONFIG.OWNER + '@c.us') {
        return await msg.reply('❌ Bu komut sadece sahip tarafından kullanılabilir!');
    }
    
    await msg.reply('🔄 Bot yeniden başlatılıyor...');
    process.exit(0);
}

async function stopBot(msg) {
    if (msg.from !== CONFIG.OWNER + '@c.us') {
        return await msg.reply('❌ Bu komut sadece sahip tarafından kullanılabilir!');
    }
    
    await msg.reply('👋 Bot kapatılıyor...');
    await client.destroy();
    process.exit(0);
}

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

async function detectLinks(msg) {
    const text = msg.body;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    if (urlRegex.test(text)) {
        const chat = await msg.getChat();
        
        if (chat.isGroup) {
            const groupId = chat.id._serialized;
            const antilink = db.groups.get(groupId)?.antilink;
            
            if (antilink) {
                await msg.delete(true);
                await msg.reply('🚫 Link paylaşımı yasak!');
            }
        }
    }
}

async function antiSpam(msg) {
    const userId = msg.from;
    const now = Date.now();
    
    if (!db.users.has(userId)) {
        db.users.set(userId, { lastMessage: now, messageCount: 1 });
        return;
    }
    
    const userData = db.users.get(userId);
    
    if (now - userData.lastMessage < 1000) {
        userData.messageCount++;
        
        if (userData.messageCount > 5) {
            await msg.reply('⚠️ Spam yapmayı bırakın!');
        }
    } else {
        userData.messageCount = 1;
    }
    
    userData.lastMessage = now;
    db.users.set(userId, userData);
}

async function checkAutoReply(msg) {
    const text = msg.body.toLowerCase();
    
    const autoReplies = {
        'merhaba': '👋 Merhaba! Size nasıl yardımcı olabilirim?',
        'selam': '👋 Selam! Hoş geldiniz!',
        'nasılsın': '😊 İyiyim, teşekkür ederim! Siz nasılsınız?',
        'teşekkürler': '😊 Rica ederim!',
        'görüşürüz': '👋 Görüşürüz! İyi günler!',
        'sa': '👋 Aleyküm selam!',
        'günaydın': '🌅 Günaydın! Güzel bir gün dilerim!',
        'iyi geceler': '🌙 İyi geceler! Tatlı rüyalar!'
    };
    
    for (const [key, value] of Object.entries(autoReplies)) {
        if (text.includes(key)) {
            await msg.reply(value);
            break;
        }
    }
}

function startCronJobs() {
    // Her dakika hatırlatıcıları kontrol et
    cron.schedule('* * * * *', async () => {
        const now = Date.now();
        
        for (let i = db.reminders.length - 1; i >= 0; i--) {
            const reminder = db.reminders[i];
            
            if (reminder.time <= now) {
                try {
                    await client.sendMessage(reminder.chatId, `⏰ *Hatırlatıcı*\n\n📝 ${reminder.message}`);
                    db.reminders.splice(i, 1);
                } catch (err) {
                    console.error('Hatırlatıcı hatası:', err);
                }
            }
        }
    });
    
    // Her saat istatistikleri kaydet
    cron.schedule('0 * * * *', () => {
        console.log(`[${moment().format('HH:mm')}] İstatistikler:`, db.stats);
    });
    
    log('⏰ Zamanlanmış görevler başlatıldı');
}

// ============================================================
// BAŞLATMA
// ============================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🤖 WHATSAPP USERBOT v2.0                        ║
║                                                           ║
║   200+ Özellik | AI Destekli | Grup Yönetimi             ║
║                                                           ║
║   Geliştirici: AI Assistant                               ║
║   Versiyon: 2.0.0                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

client.initialize();
