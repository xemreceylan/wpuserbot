const fs = require('fs');

const notlar = JSON.parse(fs.readFileSync('notlar.json', 'utf8') || '{}');

module.exports = {
    name: 'Not',
    category: 'Kişisel',
    commands: {
        notal: {
            description: 'Not alır',
            execute: async (client, msg, args) => {
                if (!args.length) return msg.reply('Ne not alayım?');
                
                const user = msg.author;
                if (!notlar[user]) notlar[user] = [];
                
                notlar[user].push({
                    not: args.join(' '),
                    tarih: new Date().toISOString()
                });
                
                fs.writeFileSync('notlar.json', JSON.stringify(notlar, null, 2));
                await msg.reply('✅ Not alındı');
            }
        },
        notlarim: {
            description: 'Notlarını gösterir',
            execute: async (client, msg, args) => {
                const user = msg.author;
                const userNotlar = notlar[user] || [];
                
                if (!userNotlar.length) return msg.reply('Notunuz yok');
                
                let liste = '*Notlarınız:*\n';
                userNotlar.forEach((n, i) => {
                    liste += (i+1) + '. ' + n.not + '\n';
                });
                await msg.reply(liste);
            }
        },
        notsil: {
            description: 'Not siler',
            execute: async (client, msg, args) => {
                const user = msg.author;
                const index = parseInt(args[0]) - 1;
                
                if (!notlar[user] || !notlar[user][index]) {
                    return msg.reply('Geçersiz not numarası');
                }
                
                notlar[user].splice(index, 1);
                fs.writeFileSync('notlar.json', JSON.stringify(notlar, null, 2));
                await msg.reply('✅ Not silindi');
            }
        }
    }
};