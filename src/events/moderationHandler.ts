client.on('guildBanAdd', (ban) => {
  logBan(ban);
  addCase('ban', ban)
});

client.on('guildBanRemove', (ban) => {
    logUnban(ban);
    
});
