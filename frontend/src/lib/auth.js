// Auth terpadu: mode normal (Clerk) vs mode demo (tanpa login).
//
// DEMO_MODE dibaca sekali saat build (Vite mengganti import.meta.env saat
// bundling), jadi nilainya KONSTAN selama app berjalan. Artinya memilih hook
// di dalam custom hook berdasarkan flag ini aman — urutan hook tidak pernah
// berubah dalam satu build.
//
// Mode demo:
// - tanpa ClerkProvider, tanpa login, langsung masuk zona chat
// - user palsu "Tamu Demo" supaya seluruh UI (sapaan, avatar, riwayat) jalan
// - getToken() mengembalikan string dummy (tidak dipakai — demo tidak
//   memanggil backend sama sekali)
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useClerk as useClerkBase,
} from "@clerk/clerk-react";

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const demoUser = {
  id: "demo-user",
  fullName: "Tamu Demo",
  firstName: "Tamu",
  imageUrl: "", // kosong → UI menampilkan inisial, bukan foto
};

export function useAppUser() {
  if (DEMO_MODE) return { user: demoUser, isLoaded: true, isSignedIn: true };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkUser();
}

export function useAppAuth() {
  if (DEMO_MODE) {
    return {
      getToken: async () => "demo-token",
      isLoaded: true,
      isSignedIn: true,
      userId: demoUser.id,
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkAuth();
}

export function useAppClerk() {
  if (DEMO_MODE) return { signOut: async () => {}, openSignIn: () => {} };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkBase();
}
