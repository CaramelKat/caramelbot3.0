const db = require("../database");
const {MessageEmbed} = require("discord.js");
const {STARBOARD} = require("../models/starboards");

async function updateStarboard(bot, server, message, reaction_orig) {
    const reactions = message.reactions.cache;
    if(reaction_orig.emoji.name === '⭐') {
        /**
         * Check if message is already in the starboard
         */
        let star = await db.getStar(message.id, message.guild.id);
        if(star) {
            star.reaction_count = reactions.get('⭐') ? reactions.get('⭐').count : 0;
            star.update();
            bot.channels.cache.get(server.starboard_channel).messages.fetch(star.new_message_id).then(msg => {
                let embed = new MessageEmbed()
                    .setColor('#ffd23c')
                    .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL(), url: message.url })
                    .setDescription(message.content || '')
                    .setTimestamp(message.createdAt)
                    .setFooter({ text: `⭐: ${ star.reaction_count }` });
                let messageAttachment = message.attachments.size > 0 ? message.attachments.first().url : null
                if (messageAttachment) embed.setImage(messageAttachment)
                msg.edit({ embeds: [embed] });
            }).catch(err => {
                console.error(err);
            });
        }
        /**
         * Create new starboard message
         */
        else if(reactions.get('⭐').count === server.starboard_count) {
            let embed = new MessageEmbed()
                .setColor('#ffd23c')
                .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL(), url: message.url })
                .setDescription(message.content || '')
                .setTimestamp(message.createdAt)
                .setFooter({ text: `⭐: ${ reactions.get('⭐').count }` });
            let messageAttachment = message.attachments.size > 0 ? message.attachments.first().url : null
            if (messageAttachment) embed.setImage(messageAttachment)

            let sent = await bot.channels.cache.get(server.starboard_channel).send({ embeds: [embed] });
            let star = {
                server_id: message.guild.id,
                original_message_id: message.id,
                new_message_id: sent.id,
                reaction_count: reactions.get('⭐').count,
            }
            const newStar = new STARBOARD(star);
            newStar.save();
        }
    }
}

module.exports = {
    updateStarboard
}