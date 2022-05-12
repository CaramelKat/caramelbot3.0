const { Schema, model } = require('mongoose');

const reaction = new Schema({
    emoji: String,
    roleID: String
});

const  ServerSchema = new Schema({
    guildName: String,
    guildID: String,
    messageID: String,
    adminRoleID: String,
    starboard_channel: String,
    starboard_count: Number,
    reactions: [reaction]
});


const SERVER = model('SERVER', ServerSchema);

module.exports = {
    ServerSchema,
    SERVER
};
