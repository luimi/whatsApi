const { Client, LocalAuth } = require('whatsapp-web.js');

/*

 __          ___           _                            
 \ \        / / |         | |         /\                
  \ \  /\  / /| |__   __ _| |_ ___   /  \   _ __  _ __  
   \ \/  \/ / | '_ \ / _` | __/ __| / /\ \ | '_ \| '_ \ 
    \  /\  /  | | | | (_| | |_\__ \/ ____ \| |_) | |_) |
     \/  \/   |_| |_|\__,_|\__|___/_/    \_\ .__/| .__/ 
                                           | |   | |    
                                           |_|   |_|    

*/

const wwClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox']  },
});
let sendStatusUpdate;
let status = {
    code: null,
    status: "Disconnected",
    service: "Paused"
}

wwClient.on('qr', (qr) => {
    status.code = qr
    status.service = "Running"
    if(sendStatusUpdate) sendStatusUpdate();
    console.log("* QR actualizado");
});
wwClient.on('ready', () => {
    status.status = "Connected"
    status.service = "Running"
    status.code = null
    if(sendStatusUpdate) sendStatusUpdate();
    console.log("* Servicio conectado");
});
wwClient.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});
wwClient.on('disconnected', (reason) => {
    status.status = "Disconnected"
    if(sendStatusUpdate) sendStatusUpdate();
    console.log("* Servicio desconectado");
});

module.exports = {
    start: () => {
        wwClient.initialize();
        console.log("* Servicio iniciado");
    },
    stop: () => {
        wwClient.destroy();
        status.service = "Paused"
        status.code = null
        console.log("* Servicio pausado");
    },
    restart: () => {
        wwClient.destroy();
        wwClient.initialize();
        console.log("* Servicio reiniciado");
    },
    disconnect: () => {
        wwClient.logout();
        wwClient.initialize();
        status.status = "Disconnected"
    },
    sendMessage: (number, message) => {
        return new Promise((resolve, reject) => {
            const chatId = number.replace('+','') + '@c.us';
            wwClient.sendMessage(chatId, message).then((response) => {
                if (response.id.fromMe) {
                    resolve(true);
                } else {
                    resolve(false)
                }
            }).catch((err => {
                console.log(`* Error al enviar el mensaje: ${err.message}`);
                resolve(false);
            }));
        });
    },
    status: () => {
        return status;
    },
    setSubscription: (callback) => {
        sendStatusUpdate = callback;
    }
}