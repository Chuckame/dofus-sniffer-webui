require('dotenv').config();
const frida = require('frida');
const {spawn} = require('child_process');
const { Socket } = require('dgram');
const { Reader, Protocol } = require('@rblanchet/d2-protocol');
const { SocketServer } = require('socket.io');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
    },
});
const net = require('net');
const path = require('path');
const snifferServer = net.Server().listen('8000');

const DOFUS_GAME_PATH = process.env.DOFUS_GAME_PATH;

if (null === DOFUS_GAME_PATH) {
    throw Error('[ERREUR] Impossible de trouver le dossier "Dofus", veuillez le définir dans le fichier .env');
}

const dofusProcess = spawn(`${DOFUS_GAME_PATH}\\Dofus.exe`);

if (!dofusProcess.pid) {
    throw Error('[ERREUR] Impossible de trouver le PID de l\'application, êtes vous sur que Dofus est lancé ?');
}


io.on('connection', socket => {
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
});

server.listen(3000);

const pushBufferToApp = (buffer, direction) => {
    const message = Reader.readBuffer(buffer);
    if (message) {
        const data = {
            message: message.constructor.name,
            id: message.getMessageId(),
            content: message,
            direction: direction,
        };
        io.emit('data', data);
    }
};

(async () => {
    const session = await frida.attach(dofusProcess.pid);
    session.detached.connect(message => {
    });

    script = await session.createScript(`
        var connect_p = Module.getExportByName(null, 'connect');
        var send_p = Module.getExportByName(null, 'send');
        // ssize_t send(int sockfd, const void * buf, size_t len, int flags);
        var socket_send = new NativeFunction(send_p, 'int', ['int', 'pointer', 'int', 'int']);
        var recv_p = Module.getExportByName(null, 'recv');
        // ssize_t recv(int sockfd, void *buf, size_t len, int flags);
        var socket_recv = new NativeFunction(recv_p, 'int', ['int', 'pointer', 'int', 'int']);
        Interceptor.attach(connect_p, {
            onEnter: function (args) {
                this.sockfd = args[0];
                var sockaddr_p = args[1];
                this.port = 256 * sockaddr_p.add(2).readU8() + sockaddr_p.add(3).readU8();
                this.addr = "";
                for (var i = 0; i < 4; i++) {
                    this.addr += sockaddr_p.add(4 + i).readU8(4);
                    if (i < 3) this.addr += '.';
                }
                var newport = 8000;
                sockaddr_p.add(2).writeByteArray([Math.floor(newport / 256), newport % 256]);
                sockaddr_p.add(4).writeByteArray([127, 0, 0, 1]);
            },
            onLeave: function (retval) {
                var connect_request = "CONNECT " + this.addr + ":" + this.port + " HTTP/1.0\\n\\n";
                var buf_send = Memory.allocUtf8String(connect_request);
                socket_send(this.sockfd.toInt32(), buf_send, connect_request.length, 0);
            }
        })
    `);
    await script.load();

    dofusProcess.stdout.on('data', data => {
        console.log(`[Dofus] ${data}`);
    });

    dofusProcess.stderr.on('data', data => {
        console.log(`[Dofus] Erreur : ${data}`);
    });

    dofusProcess.on('exit', () => {
        console.log(`[Dofus] Application fermée.`);
    });
})();

const connectClient = function(socket, host, port) {
    socket['client'] = new net.Socket();;
    socket['client']['queue'] = [];

    socket['client'].connect({host, port});

    socket['client'].on('connect', () => {
        socket['client']['connected'] = true;
        socket['client']['queue'].forEach(packet => socket['client'].write(packet));
    });

    socket['client'].on('data', data => {
        socket.write(data);
        if (data.toString().includes('.ankama-games.com')) {
            socket.destroy();
        }
        try {
            console.log('[Dofus Frida] Message venant du serveur');
            pushBufferToApp(data, 'Serveur');
        } catch (e) {
        }
    });

    socket['client'].on('error', function (err) {
        // Nothing
    });
};

snifferServer.on('connection', socket => {
    socket.on('data', data => {
        dataString = data.toString();
        if (dataString.startsWith('CONNECT')) {
            connectClient(socket, dataString.split(' ')[1].split(':')[0], dataString.split(' ')[1].split(':')[1]);
        } else {
            if (socket['client']['connected']) {
                socket['client'].write(data);
            } else {
                socket['client']['queue'].push(data);
            }
        }

        try {
            console.log('[Dofus Frida] Message venant du client');
            pushBufferToApp(data, 'Client');
        } catch (e) {
        }
    });

    socket.on('end', function () {
        try {
            socket['client'].destroy();
        } catch (e) {
        }
    });

    socket.on('error', function (err) {
        // Nothing
    });
});
