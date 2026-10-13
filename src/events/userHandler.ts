client.on('guildMemberAdd', (member) => {
    console.log(`guildMemberAdd: ${member}`);
});

client.on('guildMemberRemove', (member) => {
    console.log(`guildMemberRemove: ${member}`);
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    console.log(`guildMemberUpdate: ${oldMember} | ${newMember}`);
});
