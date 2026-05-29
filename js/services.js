// ── Firebase Services ────────────────────────────────────────────────
import { initializeApp } from './config.js';
import { getStorage } from './config.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from './config.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, serverTimestamp, query, where, orderBy, limit } from './config.js';

export class FBService{
   constructor(cfg){this._app=initializeApp(cfg);this._auth=getAuth(this._app);this._db=getFirestore(this._app);this._storage=getStorage(this._app)}
   get auth(){return this._auth}get db(){return this._db}get storage(){return this._storage}
}
export class AuthSvc{
  constructor(fb){this._a=fb.auth}
  async signIn(e,p){return signInWithEmailAndPassword(this._a,e,p)}
  async signInGoogle(){const gp=new GoogleAuthProvider();return signInWithPopup(this._a,gp)}
  async signOut(){return signOut(this._a)}
  onChanged(cb){return onAuthStateChanged(this._a,cb)}
  get user(){return this._a.currentUser}
}
export class PatientSvc{
  constructor(fb){this._db=fb.db}
  _col(){return collection(this._db,'patients')}
  _doc(id){return doc(this._db,'patients',id)}
  onPatients(cb){return onSnapshot(query(this._col()),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))))}
  async create(data){return addDoc(this._col(),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}
  async update(id,data){return updateDoc(this._doc(id),{...data,updatedAt:serverTimestamp()})}
  async delete(id){return deleteDoc(this._doc(id))}
  async getAll(){const s=await getDocs(this._col());return s.docs.map(d=>({id:d.id,...d.data()}))}
}
export class SessionSvc{
  constructor(fb){this._db=fb.db;this._hc=null}
  setHeadset(code){this._hc=code}
  // CHANGE 8: each Quest gets its own session control doc: quest_{headsetCode}
  _cur(){return this._hc?doc(this._db,'sessions','quest_'+this._hc):doc(this._db,'sessions','currentSession')}
  async cmd(data){return setDoc(this._cur(),data,{merge:true})}
  onSession(cb){return onSnapshot(this._cur(),s=>cb(s.data()))}
  onMetrics(sid,cb){return onSnapshot(doc(this._db,'metrics',sid),s=>cb(s.data()))}
  async sessionsForPatient(pid){
    try{
      const q=query(collection(this._db,'sessions'),where('patientId','==',pid),where('status','==','ended'),orderBy('startTime','desc'),limit(50));
      const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){const s=await getDocs(collection(this._db,'sessions'));return s.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.patientId===pid&&d.status==='ended').sort((a,b)=>(b.startTime?.seconds||0)-(a.startTime?.seconds||0));}
  }
  async allSessions(){
    try{
      const q=query(collection(this._db,'sessions'),where('status','==','ended'),orderBy('startTime','desc'),limit(100));
      const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){const s=await getDocs(collection(this._db,'sessions'));return s.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.status==='ended').sort((a,b)=>(b.startTime?.seconds||0)-(a.startTime?.seconds||0));}
  }
  async getMetrics(sid){const s=await getDoc(doc(this._db,'metrics',sid));return s.exists()?s.data():null}
  async updateSession(id,data){return updateDoc(doc(this._db,'sessions',id),data)}
  async deleteSession(id){return deleteDoc(doc(this._db,'sessions',id))}
  async deleteMetrics(id){try{return await deleteDoc(doc(this._db,'metrics',id))}catch(_){}}
}
// CHANGE 8: Multi-Quest headset service
export class HeadsetSvc{
  constructor(fb){this._db=fb.db}
  onHeadsets(cb){return onSnapshot(collection(this._db,'headsets'),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))))}
  async add(code,name){return setDoc(doc(this._db,'headsets',code),{headsetCode:code,headsetName:name||code,addedAt:serverTimestamp()},{merge:true})}
  async remove(id){return deleteDoc(doc(this._db,'headsets',id))}
}

