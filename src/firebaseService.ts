import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  limit,
} from "firebase/firestore";
import "dotenv/config";

// Inicializa o Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializa o app do Firebase
const app = initializeApp(firebaseConfig);

// Obtém o Firestore
const db = getFirestore(app);

// Função para armazenar interações no Firestore
export async function saveInteraction(
  userId: string,
  message: string,
  response: string
) {
  try {
    const docRef = await addDoc(collection(db, "interactions"), {
      userId: userId,
      message: message,
      response: response,
      timestamp: new Date(),
    });
    console.log("Interação salva com sucesso:", docRef.id);
  } catch (e) {
    console.error("Erro ao salvar a interação no Firestore:", e);
  }
}

// Função para recuperar histórico de mensagens
export async function getMessageHistory(userId: string) {
  try {
    const q = query(
      collection(db, "interactions"),
      where("userId", "==", userId),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const history: { role: string; content: string }[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Adiciona a mensagem do usuário e a resposta do assistente
      history.push({ role: "user", content: data.message });
      history.push({ role: "assistant", content: data.response });
    });

    return history;
  } catch (e) {
    console.error(
      "Erro ao recuperar o histórico de mensagens do Firestore:",
      e
    );
    return [];
  }
}
