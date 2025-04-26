require('dotenv').config()
const jwt = require('jsonwebtoken');
const { TOKENSEED } = process.env;

module.exports = {
    sign: (data) => {
        return jwt.sign(data, TOKENSEED);
    },
    verify: (req,res) => {
        return new Promise((resolve, reject) => {
            if(!req.headers.token) {
                res.status(401).send('Invalid token');
                resolve(false);
            }
            jwt.verify(req.headers.token, TOKENSEED, (error, decoded) => {
                if (error) {
                    res.status(401).send('Invalid token');
                    resolve(false);
                }
                else resolve(true);
            });
        });
    }
}