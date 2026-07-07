import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  writeBatch,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Member, PowerRecord } from "../types";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection references
const SETTINGS_DOC_REF = doc(db, "settings", "global");
const MEMBERS_COL_REF = collection(db, "members");
const RECORDS_COL_REF = collection(db, "records");

export interface GlobalSettings {
  appTitle: string;
  prosperity: string;
  lineup: string;
}

/**
 * Real-time listener for global settings
 */
export function subscribeGlobalSettings(callback: (settings: GlobalSettings) => void) {
  return onSnapshot(SETTINGS_DOC_REF, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GlobalSettings);
    } else {
      // Return default values if document does not exist yet
      callback({
        appTitle: "絕世毛利喵戰力觀測站",
        prosperity: "260億",
        lineup: "80億"
      });
    }
  });
}

/**
 * Update global settings
 */
export async function updateGlobalSettings(settings: Partial<GlobalSettings>) {
  try {
    await setDoc(SETTINGS_DOC_REF, settings, { merge: true });
  } catch (error) {
    console.error("Error updating global settings:", error);
  }
}

/**
 * Real-time listener for members list
 */
export function subscribeMembers(callback: (members: Member[]) => void) {
  const q = query(MEMBERS_COL_REF, orderBy("sortOrder", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list: Member[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        communityName: data.communityName || "",
        gameName: data.gameName || "",
        sortOrder: data.sortOrder || 0,
        isOutlaw: !!data.isOutlaw
      });
    });
    callback(list);
  });
}

/**
 * Bulk update/write members (for drag and drop sorting, inline edits, new additions)
 */
export async function updateAllMembersInDb(membersList: Member[]) {
  try {
    const batch = writeBatch(db);
    // Standardize IDs and write them
    membersList.forEach((member) => {
      const docRef = doc(MEMBERS_COL_REF, member.id);
      batch.set(docRef, {
        communityName: member.communityName,
        gameName: member.gameName,
        sortOrder: member.sortOrder,
        isOutlaw: !!member.isOutlaw
      });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error batch updating members:", error);
  }
}

/**
 * Delete a member from the database
 */
export async function deleteMemberFromDb(memberId: string) {
  try {
    await deleteDoc(doc(MEMBERS_COL_REF, memberId));
  } catch (error) {
    console.error("Error deleting member:", error);
  }
}

/**
 * Real-time listener for combat power records
 */
export function subscribePowerRecords(callback: (records: PowerRecord[]) => void) {
  return onSnapshot(RECORDS_COL_REF, (snapshot) => {
    const list: PowerRecord[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        memberId: data.memberId || "",
        weekLabel: data.weekLabel || "",
        powerValue: data.powerValue || 0,
        createdAt: data.createdAt || ""
      });
    });
    callback(list);
  });
}

/**
 * Add or update a combat power record
 */
export async function savePowerRecordToDb(record: PowerRecord) {
  try {
    const docRef = doc(RECORDS_COL_REF, record.id);
    await setDoc(docRef, {
      memberId: record.memberId,
      weekLabel: record.weekLabel,
      powerValue: record.powerValue,
      createdAt: record.createdAt
    });
  } catch (error) {
    console.error("Error saving power record:", error);
  }
}

/**
 * Delete a power record
 */
export async function deletePowerRecordFromDb(recordId: string) {
  try {
    await deleteDoc(doc(RECORDS_COL_REF, recordId));
  } catch (error) {
    console.error("Error deleting power record:", error);
  }
}

/**
 * Database Seeding or Resetting function
 */
export async function seedOrResetDatabase(defaultMembers: Member[], defaultPowerRecords: PowerRecord[]) {
  try {
    const batch = writeBatch(db);

    // 1. Delete all existing members
    const membersSnap = await getDocs(MEMBERS_COL_REF);
    membersSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. Delete all existing records
    const recordsSnap = await getDocs(RECORDS_COL_REF);
    recordsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. Set default settings
    batch.set(SETTINGS_DOC_REF, {
      appTitle: "絕世毛利喵戰力觀測站",
      prosperity: "260億",
      lineup: "80億"
    });

    // 4. Add default members
    defaultMembers.forEach((member) => {
      const docRef = doc(MEMBERS_COL_REF, member.id);
      batch.set(docRef, {
        communityName: member.communityName,
        gameName: member.gameName,
        sortOrder: member.sortOrder,
        isOutlaw: !!member.isOutlaw
      });
    });

    // 5. Add default records
    defaultPowerRecords.forEach((record) => {
      const docRef = doc(RECORDS_COL_REF, record.id);
      batch.set(docRef, {
        memberId: record.memberId,
        weekLabel: record.weekLabel,
        powerValue: record.powerValue,
        createdAt: record.createdAt
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

/**
 * Check if the database has any seeded data, if not seed it automatically
 */
export async function autoSeedIfEmpty(defaultMembers: Member[], defaultPowerRecords: PowerRecord[]) {
  try {
    const snap = await getDocs(MEMBERS_COL_REF);
    if (snap.empty) {
      console.log("Database is empty, auto-seeding default data...");
      await seedOrResetDatabase(defaultMembers, defaultPowerRecords);
    }
  } catch (error) {
    console.error("Auto-seeding check failed:", error);
  }
}
