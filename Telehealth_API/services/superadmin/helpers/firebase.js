const firebase = require('firebase-admin');

const serviceAccount = require('./terstapp-firebase-admin.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
})

module.exports = firebase