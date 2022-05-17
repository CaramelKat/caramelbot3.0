const { SlashCreator, GatewayServer } = require('slash-create');
const {TwitterApi, TwitterV2IncludesHelper} = require('twitter-api-v2');
const twitterGetUrl = require("twitter-url-direct")
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
/*const client = new TwitterApi({
    appKey: config.twitter.appKey,
    appSecret: config.twitter.appSecret,
    accessToken: config.twitter.accessToken,
    accessSecret: config.twitter.accessSecret,
});*/
const client = new TwitterApi(config.twitter.bearerToken);

const ToggleRoleCommand = require('./commands/ping');

creator.withServer(
        new GatewayServer(
            (handler) => bot.ws.on('INTERACTION_CREATE', handler)
        )
    ).registerCommands([
        new ToggleRoleCommand(bot, creator)
    ]).syncCommands();

bot.on('messageCreate', async message => {
    // Ignore bot messages
    if (message.author.bot || message.author.id !== '234488313690456064' || message.webhookId) return;
    let server = await db.getServerByID(message.guild.id);
    if(server && server.twitterFix) {
        if(message.content.includes('https://twitter.com') && message.content.includes('status') && message.embeds[0] === undefined) {
            let channel = message.guild.channels.cache.get(message.channelId);
            let tweetID = message.content.substring(message.content.indexOf('status/') + 7, message.content.indexOf('status/') + 26)
            client.v2.singleTweet(tweetID, {
                expansions: [
                    "attachments.media_keys", "attachments.poll_ids"
                ],
                "media.fields": ["type", "url", "alt_text", "preview_image_url"],
                'tweet.fields': [
                    'author_id', 'attachments', 'text', 'created_at'
                ]
            }).then((tweet) => {
                client.v2.user(tweet.data.author_id, {
                    'user.fields': [
                        'name', 'username', 'profile_image_url'
                    ]
                }).then(user => {
                    channel.createWebhook(message.author.username, {
                        avatar: message.author.avatarURL(),
                    })
                        .then(async webhook => {
                            let text = "", imageLink;
                            const embed = new MessageEmbed()
                                .setAuthor({ name: `${user.data.name} (@${user.data.username})`, iconURL: user.data.profile_image_url, url: `https://twiter.com/${user.data.username}` })
                                .setColor('#1da0f2')
                                .setDescription(tweet.data.text)
                                .setTimestamp(tweet.data.created_at);
                            let tweetMedia = TwitterV2IncludesHelper.media(tweet);
                            if(tweetMedia[0].type === 'photo')
                                embed.setImage(tweetMedia[0].url);
                            else if(tweetMedia[0].type === 'animated_gif') {
                                imageLink = tweetMedia[0].preview_image_url.substring(tweetMedia[0].preview_image_url.indexOf('_thumb/') + 7, tweetMedia[0].preview_image_url.indexOf('_thumb/') + 22) ;
                                text = `https://video.twimg.com/tweet_video/${imageLink}.mp4`
                            }
                            else if(tweetMedia[0].type === 'video') {
                                let url = message.content.substring(message.content.indexOf('https://twitter.com'), message.content.indexOf('status/') + 26);
                                let response = await twitterGetUrl(url);
                                if(response.found) {
                                    text = response.download[response.download.length - 1].url;
                                }
                            }

                            return webhook.send({
                                content: message.content,
                                username: message.author.username,
                                avatarURL: message.author.avatarURL(),
                                embeds: [embed],
                            }).then(e => {
                                if(text !== "") {
                                    webhook.send({
                                        content: text,
                                        username: message.author.username,
                                        avatarURL: message.author.avatarURL()
                                    }).then(e => {
                                        webhook.delete().then(f => {
                                            message.delete();
                                        })
                                    })
                                }
                                else
                                    webhook.delete().then(f => {
                                        message.delete();
                                    });

                            })
                        })
                        .catch(console.error);
                })
                    .catch((err) => {
                        console.log(err)
                    })
            }).catch((err) => {
                console.log(err)
            })
        }
    }

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
            await starBoard.updateStarboard(bot, server, message, reaction_orig, user)
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

function getMp4Url(url, token) {
    return new Promise((resolve, reject) => {
        var init = {
            origin: 'https://mobile.twitter.com',
            headers: {
                "Accept": '*/*',
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0",
                "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
                "x-csrf-token": token,
            },
            credentials: 'include',
            referrer: 'https://mobile.twitter.com'
        };

        fetch(url, init)
            .then((response) => {
                if (response.status === 200) {
                    response.json().then((json) => {
                        let mp4Variants = json.extended_entities.media[0].video_info.variants.filter(variant => variant.content_type === 'video/mp4')
                        mp4Variants = mp4Variants.sort((a, b) => (b.bitrate - a.bitrate))

                        let url = ''
                        if (mp4Variants.length) {
                            url = mp4Variants[0].url
                        }
                        resolve(url);
                    })
                } else {
                    reject({
                        status: response.status,
                        statusText: response.statusText
                    });
                }
            })
            .catch((err) => {
                reject({
                    error: err
                });
            });
    });
}