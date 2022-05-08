const { SlashCreator, GatewayServer } = require('slash-create');
const { Client, Intents, MessageEmbed, WebhookClient } = require('discord.js');
const config = require('./config.json');
const db = require('./database');
const reactionRoles = require('./commands/reactionRoles')
const starBoard = require('./commands/starBoard')

const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const creator = new SlashCreator({
    applicationID: config.application_id,
    publicKey: config.public_key,
    token: config.token,
});

const ToggleRoleCommand = require('./commands/ping');

creator.withServer(
        new GatewayServer(
            (handler) => bot.ws.on('INTERACTION_CREATE', handler)
        )
    ).registerCommands([
        new ToggleRoleCommand(bot, creator)
    ]).syncCommands();

bot.on('messageCreate', message => {
    // Ignore bot messages
    if (message.author.bot || message.author.id !== '234488313690456064') return;

    if(message.content.includes('/activity ')) {
        let options = ['STREAMING', 'WATCHING', 'CUSTOM_STATUS', 'PLAYING', 'COMPETING'];
        let status = message.content.replace('/activity', '');
        if(options.includes(status.substring(0, status.indexOf(' ')))) {
            console.log(status.substring(status.indexOf(' ')));
            bot.user.setActivity(status, { type: 'WATCHING' }) // STREAMING, WATCHING, CUSTOM_STATUS, PLAYING, COMPETING
        }
    }
    else if(message.content.includes('/status ')) {
        let status = message.content.replace('/status ', '');
        let statusOpt = ["online", 'idle', 'dnd', 'invisible']
        if(statusOpt.includes(status)) {
            console.log(status);
            bot.user.setStatus(status);
        }
    }
});

/**
 * When reaction is added to message
 */
bot.on('messageReactionAdd', async (reaction_orig, user) => {
    const message = !reaction_orig.message.author
        ? await reaction_orig.message.fetch()
        : reaction_orig.message;
    if(message.author.bot) return;
    /**
     * Iterate through all servers
     */
    let server = await db.getServerByID(message.guild.id);
    if (server) {
        /**
         * Check if a message is for a reaction roll
         */
        if(message.id === server.messageID) {
            await reactionRoles.addRole(server, reaction_orig, message, user);
        }
        /**
         * Check if a server has a starboard
         */
        else if(server.starboard_channel !== '' && (server.guildID === message.guild.id)) {
            await starBoard.updateStarboard(bot, server, message, reaction_orig)
        }
    }
});

bot.on('messageReactionRemove', async (reaction_orig, user) => {
    // fetch the message if it's not cached
    const message = !reaction_orig.message.author
        ? await reaction_orig.message.fetch()
        : reaction_orig.message;
    if(message.author.bot) return;
    let server = await db.getServerByID(message.guild.id);
    if (server) {
        /**
         * Check if a message is for a reaction roll
         */
        if(message.id === server.messageID) {
            await reactionRoles.removeRole(server, reaction_orig, message, user);
        }
        /**
         * Check if a server has a starboard
         */
        else if(server.starboard_channel !== '' && (server.guildID === message.guild.id)) {
            await starBoard.updateStarboard(bot, server, message, reaction_orig)
        }
    }

});
/**
 * Connect to DB, then login to Discord
 */
db.connect().then(() => {
    bot.login(config.token).then(() => {
        console.log('ready');
    }).catch(function (error) {
        console.log('Discord: ' + error)
    });
}).catch(function (error) {
    console.log('DB: ' + error)
});