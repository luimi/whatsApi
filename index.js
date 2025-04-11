const express = require('express')
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const ww = require('./utils/wwController');
require('dotenv').config()

const app = express()
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });
const { PORT, PASSWORD } = process.env;

server.listen(PORT || 3000, () => {
    console.log(`* Servidor escuchando en el puerto ${PORT || 3000}`);
});

const sendStatusUpdate = () => {
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(ww.status()));
    });
}
ww.setSubscription(sendStatusUpdate)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/*

           _____ _____ 
     /\   |  __ \_   _|
    /  \  | |__) || |  
   / /\ \ |  ___/ | |  
  / ____ \| |    _| |_ 
 /_/    \_\_|   |_____|
                       
                       

*/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.post('/startService', (req, res) => {
    ww.start();
    res.send('Service Started')
    sendStatusUpdate();
})

app.post('/stopService', (req, res) => {
    ww.stop();
    res.send('Service Stopped')
    sendStatusUpdate();
})

app.post('/restartService', (req, res) => {
    ww.restart();
    res.send('Service Restarted')
})

app.post('/disconnectAccount', (req, res) => {
    ww.disconnect();
    res.send('Disconnected')
})

app.post('/isPassword', (req, res) => {
    if (req.body.password === PASSWORD || !PASSWORD) {
        res.send({ success: true })
    } else {
        res.status(401).send('Unauthorized')
    }
})

app.get('/getStatus', (req, res) => {
    res.send(ww.status())
})

app.post('/sendMessage', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).send('Number and message are required');
    }
    let result = await ww.sendMessage(number, message);
    if (result) {
        res.send('Mensaje enviado');
    } else {
        res.status(500).send('Fallo al enviar el mensaje');
    }
})



/*

 __          __  _     _____            _        _   
 \ \        / / | |   / ____|          | |      | |  
  \ \  /\  / /__| |__| (___   ___   ___| | _____| |_ 
   \ \/  \/ / _ \ '_ \\___ \ / _ \ / __| |/ / _ \ __|
    \  /\  /  __/ |_) |___) | (_) | (__|   <  __/ |_ 
     \/  \/ \___|_.__/_____/ \___/ \___|_|\_\___|\__|
                                                     
                                                     

*/
wsServer.on('connection', (ws) => {
    ws.send(JSON.stringify(ww.status()));
});

ww.start();