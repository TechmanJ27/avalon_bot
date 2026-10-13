
client.on('guildUpdate', (oldGuild, newGuild) => {
    console.log(`guildUpdate: ${oldGuild} | ${newGuild}`);
});

client.on('inviteCreate', (invite) => {
    console.log(`inviteCreate: ${invite}`);
});

client.on('inviteDelete', (invite) => {
    console.log(`inviteDelete: ${invite}`);
});
