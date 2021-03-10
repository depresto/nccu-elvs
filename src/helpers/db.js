import Vue from 'vue'
import { firestorePlugin } from 'vuefire'
import firebase from 'firebase/app'

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
