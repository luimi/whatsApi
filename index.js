const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express')
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config()

const app = express()
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });
const { PORT } = process.env;

server.listen(PORT || 3000, () => {
    console.log(`Servidor escuchando en el puerto ${PORT || 3000}`);
});

let status = {
    code: null,
    status: "Disconnected",
    service: "Paused"
}
const wwClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true },
});

const sendStatusUpdate = () => {
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(status));
    });
}
app.use(express.static(path.join(__dirname, 'public')));

/*

           _____ _____ 
     /\   |  __ \_   _|
    /  \  | |__) || |  
   / /\ \ |  ___/ | |  
  / ____ \| |    _| |_ 
 /_/    \_\_|   |_____|
                       
                       

*/
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.post('/startService', (req, res) => {
    wwClient.initialize();
    res.send('Service Started')
    sendStatusUpdate();
})

app.post('/stopService', (req, res) => {
    wwClient.destroy();
    status.service = "Paused"
    status.code = null
    res.send('Service Stopped')
    sendStatusUpdate();
})

app.post('/restartService', (req, res) => {
    wwClient.destroy();
    wwClient.initialize();
    res.send('Service Restarted')
})

app.post('/disconnectAccount', (req, res) => { 
    wwClient.logout()
    status.status = "Disconnected"
    wwClient.initialize();
    res.send('Disconnected')
})



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
wwClient.on('qr', (qr) => {
    status.code = qr
    status.service = "Running"
    sendStatusUpdate();
});
wwClient.on('ready', () => {
    status.status = "Connected"
    status.service = "Running"
    status.code = null
    sendStatusUpdate();
});
wwClient.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});
wwClient.on('disconnected', (reason) => {
    status.status = "Disconnected"
    sendStatusUpdate();
});

wwClient.initialize();

/*

 __          __  _     _____            _        _   
 \ \        / / | |   / ____|          | |      | |  
  \ \  /\  / /__| |__| (___   ___   ___| | _____| |_ 
   \ \/  \/ / _ \ '_ \\___ \ / _ \ / __| |/ / _ \ __|
    \  /\  /  __/ |_) |___) | (_) | (__|   <  __/ |_ 
     \/  \/ \___|_.__/_____/ \___/ \___|_|\_\___|\__|
                                                     
                                                     

*/
wsServer.on('connection', (ws) => {
    ws.send(JSON.stringify(status));
});