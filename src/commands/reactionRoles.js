async function addRole(server, reaction_orig, message, user) {
    for (let reaction of server.reactions) {
        if(reaction_orig.emoji.name === reaction.emoji) {
            const role = await message.guild.roles.fetch(reaction.roleID);
            const guildUser = await message.guild.members.fetch(user.id);
            await guildUser.roles.add(role);
            console.log(`Added ${user.tag} to ${role.name}`);
        }
    }
}

async function removeRole(server, reaction_orig, message, user) {
    for (let reaction of server.reactions) {
        if(reaction_orig.emoji.name === reaction.emoji) {
            const role = await message.guild.roles.fetch(reaction.roleID);
            const guildUser = await message.guild.members.fetch(user.id);
            await guildUser.roles.remove(role);
            console.log(`Removed ${user.tag} from ${role.name}`);
        }
    }
}

module.exports = {
    addRole,
    removeRole
}