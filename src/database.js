const mongoose = require('mongoose');
const { mongoose: mongooseConfig } = require('./config.json');
const { STARBOARD } = require('./models/starboards');
const { SERVER } = require('./models/servers');
const { uri, database, options } = mongooseConfig;

let connection;

async function connect() {
    await mongoose.connect(`${uri}/${database}`, options);
    connection = mongoose.connection;
    connection.on('connected', function () {
        console.log(`MongoDB connected ${this.name}`);
    });
    connection.on('error', console.error.bind(console, 'connection error:'));
    connection.on('close', () => {
        connection.removeAllListeners();
    });
}

function verifyConnected() {
    if (!connection) {
        connect();
    }
}

async function getStar(messageID, serverID) {
    verifyConnected();
    return STARBOARD.findOne({ original_message_id: messageID, server_id: serverID });
}

async function getServers() {
    verifyConnected();
    return SERVER.find();
}


module.exports = {
    connect,
    getStar,
    getServers
};
