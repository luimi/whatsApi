const express = require('express')
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const ww = require('./utils/wwController');
const jwt = require('./utils/jwtController');
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

app.post('/isPassword', (req, res) => {
    if (req.body.password === PASSWORD || !PASSWORD) {
        res.send({ success: true, token: jwt.sign({})})
    } else {
        res.status(401).send('Contraseña incorrecta')
    }
})

app.get('/getStatus', (req, res) => {
    res.send(ww.status())
})

app.post('/startService', async (req, res) => {
    if(!await jwt.verify(req, res)) return;
    ww.start();
    res.send('Servicio iniciado')
    sendStatusUpdate();
})

app.post('/stopService', async(req, res) => {
    if(!await jwt.verify(req, res)) return;
    ww.stop();
    res.send('Servicio detenido')
    sendStatusUpdate();
})

app.post('/restartService', async (req, res) => {
    if(!await jwt.verify(req, res)) return;
    ww.restart();
    res.send('Servicio reiniciado')
})

app.post('/disconnectAccount', async (req, res) => {
    if(!await jwt.verify(req, res)) return;
    ww.disconnect();
    res.send('Servicio desconectado')
})

app.post('/sendMessage', async (req, res) => {
    if(!await jwt.verify(req, res)) return;
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).send('Número o mensaje no proporcionado');
    }
    let result = await ww.sendMessage(number, message);
    if (result) {
        res.send('Mensaje enviado');
    } else {
        res.status(500).send('Falló al enviar el mensaje');
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