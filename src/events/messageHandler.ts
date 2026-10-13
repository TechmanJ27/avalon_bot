client.on('messageUpdate', (oldMessage, newMessage) => {
    console.log(`messageUpdate: ${oldMessage} | ${newMessage}`);
});
