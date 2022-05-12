const express = require('express');
const { port } = require('./config.json');

const app = express();
//https://discord.com/api/oauth2/authorize?client_id=366454911879086081&redirect_uri=http%3A%2F%2Flocalhost&response_type=code&scope=identify%20guilds
app.get('/', (request, response) => {
    return response.sendFile('index.html', { root: './html/' });
});

app.get('/discordAPI.js', (request, response) => {
    return response.sendFile('discordAPI.js', { root: './html/' });
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
