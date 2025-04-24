const firebase = require('firebase-admin');

const serviceAccount = require('./test_papp-firebase-admin.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
})

module.exports = firebase