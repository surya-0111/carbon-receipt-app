// Firebase integration with offline LocalStorage fallback
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where 
} from "firebase/firestore";

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.authDomain
);

let appInstance: any = null;
let firestoreInstance: any = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreInstance = getFirestore(appInstance);
    console.log("🔥 Firebase initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase, falling back to LocalStorage:", error);
  }
} else {
  console.log("ℹ️ Firebase credentials not provided. Using local database (LocalStorage fallback).");
}

// ─── Database Interface ───────────────────────────────────────────────────────
export interface Database {
  saveReceipt(userId: string, receipt: any): Promise<void>;
  getReceipts(userId: string): Promise<any[]>;
  getUserStats(userId: string): Promise<{ points: number; streak: number; level: string; lastScanDate?: string; challenges?: any[] }>;
  saveUserStats(userId: string, stats: { points: number; streak: number; level: string; lastScanDate?: string; challenges?: any[] }): Promise<void>;
  getLeaderboard(): Promise<any[]>;
  getUserRewards(userId: string): Promise<any[]>;
  addReward(userId: string, reward: any): Promise<void>;
}

// ─── LocalStorage Implementation ──────────────────────────────────────────────
const localStorageDb: Database = {
  async saveReceipt(userId: string, receipt: any) {
    const key = `receipts_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({
      id: receipt.id || `RPT-${Date.now()}`,
      date: receipt.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      store: receipt.store || "Local Grocery Store",
      items: receipt.items || [],
      totalCo2: receipt.totalCo2 || 0,
      score: receipt.score || 70,
      savings: receipt.savings || 0
    });
    localStorage.setItem(key, JSON.stringify(existing));
  },

  async getReceipts(userId: string) {
    const key = `receipts_${userId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  },

  async getUserStats(userId: string) {
    const key = `user_stats_${userId}`;
    const defaultStats = {
      points: 150,
      streak: 2,
      level: "Sprout Citizen",
      lastScanDate: new Date().toISOString(),
      challenges: [
        { id: 1, title: "Go Green Dairy", description: "Replace Milk with Soy Milk on a receipt", points: 50, completed: false },
        { id: 2, title: "Plant Protein", description: "Replace Chicken with Tofu on a receipt", points: 100, completed: false },
        { id: 3, title: "Zero Beef Week", description: "Scan a receipt with zero beef items", points: 150, completed: false }
      ]
    };
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultStats;
  },

  async saveUserStats(userId: string, stats: any) {
    const key = `user_stats_${userId}`;
    localStorage.setItem(key, JSON.stringify(stats));
  },

  async getLeaderboard() {
    const defaultLeaderboard = [
      { name: "Priya Nair", points: 2850, level: "Forest Guardian" },
      { name: "Marcus Webb", points: 2100, level: "Green Advocate" },
      { name: "Aria Chen", points: 1950, level: "Green Advocate" },
      { name: "You (Suriya)", points: 150, level: "Sprout Citizen" }
    ];
    const key = "leaderboard";
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(defaultLeaderboard));
      return defaultLeaderboard;
    }
    return JSON.parse(saved);
  },

  async getUserRewards(userId: string) {
    const key = `rewards_${userId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  },

  async addReward(userId: string, reward: any) {
    const key = `rewards_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({
      ...reward,
      id: `REW-${Date.now()}`,
      redeemedAt: new Date().toLocaleDateString()
    });
    localStorage.setItem(key, JSON.stringify(existing));
  }
};

// ─── Firestore Implementation ─────────────────────────────────────────────────
const firestoreDb: Database = {
  async saveReceipt(userId: string, receipt: any) {
    try {
      const receiptData = {
        userId,
        id: receipt.id || `RPT-${Date.now()}`,
        date: receipt.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        store: receipt.store || "Local Grocery Store",
        items: receipt.items || [],
        totalCo2: receipt.totalCo2 || 0,
        score: receipt.score || 70,
        savings: receipt.savings || 0,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(firestoreInstance, "receipts"), receiptData);
    } catch (e) {
      console.error("Firestore saveReceipt error: ", e);
      // Fallback
      await localStorageDb.saveReceipt(userId, receipt);
    }
  },

  async getReceipts(userId: string) {
    try {
      const q = query(
        collection(firestoreInstance, "receipts"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const receipts: any[] = [];
      snapshot.forEach((doc) => {
        receipts.push(doc.data());
      });
      return receipts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e) {
      console.error("Firestore getReceipts error: ", e);
      return localStorageDb.getReceipts(userId);
    }
  },

  async getUserStats(userId: string) {
    try {
      const userRef = doc(firestoreInstance, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as any;
      } else {
        const initial = {
          points: 150,
          streak: 2,
          level: "Sprout Citizen",
          lastScanDate: new Date().toISOString(),
          challenges: [
            { id: 1, title: "Go Green Dairy", description: "Replace Milk with Soy Milk on a receipt", points: 50, completed: false },
            { id: 2, title: "Plant Protein", description: "Replace Chicken with Tofu on a receipt", points: 100, completed: false },
            { id: 3, title: "Zero Beef Week", description: "Scan a receipt with zero beef items", points: 150, completed: false }
          ]
        };
        await setDoc(userRef, initial);
        return initial;
      }
    } catch (e) {
      console.error("Firestore getUserStats error: ", e);
      return localStorageDb.getUserStats(userId);
    }
  },

  async saveUserStats(userId: string, stats: any) {
    try {
      const userRef = doc(firestoreInstance, "users", userId);
      await setDoc(userRef, stats, { merge: true });
    } catch (e) {
      console.error("Firestore saveUserStats error: ", e);
      await localStorageDb.saveUserStats(userId, stats);
    }
  },

  async getLeaderboard() {
    try {
      const usersRef = collection(firestoreInstance, "users");
      const snapshot = await getDocs(usersRef);
      const leaders: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        leaders.push({
          name: data.name || "Eco Shopper",
          points: data.points || 0,
          level: data.level || "Sprout Citizen"
        });
      });
      if (leaders.length === 0) {
        return localStorageDb.getLeaderboard();
      }
      return leaders.sort((a, b) => b.points - a.points).slice(0, 10);
    } catch (e) {
      console.error("Firestore getLeaderboard error: ", e);
      return localStorageDb.getLeaderboard();
    }
  },

  async getUserRewards(userId: string) {
    try {
      const q = query(
        collection(firestoreInstance, "rewards"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const rewards: any[] = [];
      snapshot.forEach((doc) => {
        rewards.push(doc.data());
      });
      return rewards;
    } catch (e) {
      console.error("Firestore getUserRewards error: ", e);
      return localStorageDb.getUserRewards(userId);
    }
  },

  async addReward(userId: string, reward: any) {
    try {
      const rewardData = {
        ...reward,
        userId,
        id: `REW-${Date.now()}`,
        redeemedAt: new Date().toLocaleDateString()
      };
      await addDoc(collection(firestoreInstance, "rewards"), rewardData);
    } catch (e) {
      console.error("Firestore addReward error: ", e);
      await localStorageDb.addReward(userId, reward);
    }
  }
};

export const db: Database = firestoreInstance ? firestoreDb : localStorageDb;
