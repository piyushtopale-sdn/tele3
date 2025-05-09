const firebase = require('firebase-admin');
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');

firebase.initializeApp({
  credential: firebase.credential.cert(firebaseConfig)
})

module.exports = firebase