const { SlashCommand } = require('slash-create');

const allowedRoles = [
    {
        name: '937871597379936257',
        value: '937871597379936257'
    },
    {
        name: 'Stream Ping',
        value: 'StreamPing',
    }
];

class PingCommand extends SlashCommand {
    constructor(bot, creator) {
        super(creator, {
            name: 'react',
            description: 'Pong!',
            options: [
                {
                    name: 'role',
                    description: 'Role name',
                    required: true,
                    type: 3,
                }
            ]
        });

        this.bot = bot;

        this.filePath = __filename;
    }

    async run(ctx) {
        const bot = this.bot;

        const guild = await bot.guilds.fetch(ctx.data.guild_id, true);
        const user = await guild.members.fetch(ctx.data.member.user.id, true);
        const role = await guild.roles.cache.find(r => r.name === ctx.options.role);
        const channel = bot.channels.cache.get(ctx.data.channel_id);
        //const channel = await bot.channels.cache.find(c => c.name === ctx.data.channel_id);
        console.log(ctx.options.role)
        //console.log(channel.messages)


        channel.messages.fetch(ctx.options.role)
            .then(message => {
                const filter = (reaction, user) => {
                    return reaction.emoji.name === '👍';
                };

                message.awaitReactions({ filter, max: 4, time: 10000, errors: ['time'] })
                    .then(collected => console.log(collected.size))
                    .catch(collected => {
                        console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
                    });

            })
            .catch(console.error);

        return 'yeet!!!'

        /*if (!role) {
            return `Could not find role ${ctx.options.role}!`;
        }

        const hasRole = await user.roles.cache.find(r => r.name === ctx.options.role);

        if (hasRole) {
            await user.roles.remove(role);
        } else {
            await user.roles.add(role);
        }

        return `Toggling role ${ctx.options.role} [${hasRole ? 'REMOVED' : 'ADDED'}]!`;*/
    }

    onError(err) {
        console.log(err);
        return 'Something went wrong!';
    }
}

module.exports = PingCommand;