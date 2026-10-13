client.on('guildMemberAdd', (member) => {
    console.log(`guildMemberAdd: ${member}`);
});

client.on('guildMemberRemove', (member) => {
    console.log(`guildMemberRemove: ${member}`);
});
