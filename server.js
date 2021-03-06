const express = require('express');
const ip = require('ip');

const serverport = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));

app.get('/api/test', (req, res) => {
    res.send('Hi this is working. If you found this email navidmx@gmail.com');
});

app.listen(serverport, () => {
    const ipAddress = ip.address();
    console.log(`Network access via: ${ipAddress}:${serverport}`);

    console.log('server listening on port ' + serverport);
});