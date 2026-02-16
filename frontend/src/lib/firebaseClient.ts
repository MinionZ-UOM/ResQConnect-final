// lib/firebaseClient.ts
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';

// Export helpers that only run on client
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;

export const firebaseSignIn = async (email: string, password: string) => {
  if (!auth) throw new Error('Auth is not available on the server');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const firebaseSignUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth is not available on the server");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

export const firebaseSignOut = async () => {
  if (auth) await signOut(auth);
};
