const http = require('https');
const express = require('express');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();

const BigCommerce = require('node-bigcommerce');
const bigCommerce = new BigCommerce({
    clientId: process.env.CLIENTID,
    accessToken: process.env.ACCESSTOKEN,
    storeHash: process.env.STOREHASH,
    callback: 'http://b856e8ed.ngrok.io/',
    responseType: 'json',
    apiVersion: 'v3'
});

const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const client = require('twilio')(accountSid, authToken);

const app = express();

app.use(bodyParser.json())

bigCommerce.get('/hooks')
    .then(data => {
        let webhooks = data;
        console.log(JSON.stringify(webhooks));
        let scopes = webhooks.map(a => a.scope);
        //console.log(JSON.stringify(scopes));
        let hash = process.env.STOREHASH;
        const hookBody = {
            "scope": "store/order/",
            "hostname": `https://api.bigcommerce.com/stores/${hash}/v3/`,
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            "destination": "https://b856e8ed.ngrok.io/webhooks",
            "is_active": true
        }

        //console.log(scopes);

        if (scopes.indexOf("store/order/*") > -1 || scopes.indexOf("store/order/created") > -1) {
            /*console.log("Customer webhook already exists");
            console.log(JSON.stringify(data));*/
            //console.log(scopes);
        } else {
            bigCommerce.post('/hooks', hookBody)
                .then(data => {
                    console.log('Customer webhook created' + JSON.stringify(data));
                }).then((req, res) => {
                    if (res.status === 404) {
                        return res.json()
                    }
                })
        }

    });

bigCommerce.get('/products')
    .then(data => {
        console.log(JSON.stringify(data));
        // Catch any errors, or handle the data returned
    });

app.post('/webhooks', function(req, res) {
    res.send('OK');
    let webhook = req.body;
    let customerId = webhook.data;
    console.log(JSON.stringify(webhook));
    console.log(JSON.stringify(customerId));

    bigCommerce.get(`/order/`)
        .then(data => {
            let firstName = data.first_name;
            let lastName = data.last_name;
            sendText(firstName, lastName);
            console.log(JSON.stringify(data));
        })
});

function sendText(firstName, lastName) {
    client.messages
        .create({
            body: `${firstName} ${lastName} just registered an account on your store!`,
            from: '+15102405782',
            to: '+584242557101'
        })
        .then(message => console.log(message.sid));
}

http.createServer((request, response) => {
    const { headers, method, url } = request;
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        // At this point, we have the headers, method, url and body, and can now
        // do whatever we need to in order to respond to this request.
    });
}).listen(8080);