import Vue from 'vue'
import { firestorePlugin } from 'vuefire'
import firebase from 'firebase/app'
import 'firebase/analytics'
import 'firebase/auth'
import 'firebase/firestore'

firebase.initializeApp({
  apiKey: 'AIzaSyAEVJPo5Kdcpx7av8frZ5la2QgZlWcpWlc',
  authDomain: 'supple-cabinet-263008.firebaseapp.com',
  projectId: 'supple-cabinet-263008',
  storageBucket: 'supple-cabinet-263008.appspot.com',
  messagingSenderId: '325967377789',
  appId: '1:325967377789:web:d739768ec129a310c94814',
  measurementId: 'G-KEM5TEFZCX',
})
firebase.analytics()
Vue.use(firestorePlugin)

// Get a Firestore instance
export const db = firebase.firestore()

// Export types that exists in Firestore
// This is not always necessary, but it's used in other examples
const { Timestamp, GeoPoint } = firebase.firestore
export { Timestamp, GeoPoint }

// if using Firebase JS SDK < 5.8.0
db.settings({ timestampsInSnapshots: true })

export default db
