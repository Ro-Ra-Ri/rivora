// ============================================================================
// FILE INI MILIK DEV3.
// Dev2 hanya membuat kerangkanya supaya aplikasi React & Redux bisa berjalan.
// Dev3 mengisi pemasangan socket.io-client, emitter, dan listener di sini.
// ============================================================================
//
// Panduan singkat untuk Dev3:
// 1. Install socket.io-client di folder client: `npm install socket.io-client`
// 2. Gunakan alamat server dari `SERVER_URL` di bawah ini.
// 3. Saat event dari server datang, panggil `store.dispatch(...)` memakai
//    action dari `../store/gameSlice`:
//    - `setSocketConnected(true / false)` -> saat connect / disconnect
//    - `sessionJoined({ room, player })`  -> saat pemain berhasil join room
//    - `roomUpdated(room)`                -> saat daftar pemain / host berubah
//    - `questionStarted(question)`        -> saat soal baru dimulai (20 detik)
//    - `answerProgressUpdated(progress)`  -> saat ada pemain yang menjawab
//    - `questionRevealed(revealData)`     -> saat waktu habis / semua menjawab (8 detik)
//    - `gameFinished(resultData)`         -> saat seluruh soal selesai
//    - `setError({ message, code })`      -> saat server mengirim error
// ============================================================================

export const SERVER_URL = (
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
).replace(/\/+$/, "");

let socketInstance = null;

/**
 * Dipanggil sekali dari App.jsx saat aplikasi menyala.
 * @param {import("@reduxjs/toolkit").EnhancedStore} store
 */
export function initSocketListeners(store) {
  // Dev3: inisialisasi koneksi socket.io-client dan pasang semua socket.on(...) di sini.
  // Contoh kerangka untuk Dev3:
  //
  // if (socketInstance) return socketInstance;
  // socketInstance = io(SERVER_URL, { autoConnect: true });
  // socketInstance.on("connect", () => store.dispatch(setSocketConnected(true)));
  // socketInstance.on("disconnect", () => store.dispatch(setSocketConnected(false)));
  void store;
  return socketInstance;
}

/**
 * Dipanggil setelah Host berhasil membuat room lewat REST POST /api/rooms
 * supaya socket milik Host ditautkan ke playerId dan room code di server
 * (lihat playerService.getPlayer di server).
 */
export function emitHostJoinRoom({ code, playerId }) {
  // Dev3: kirim event socket untuk menautkan socket host ke room `code` & `playerId`.
  void code;
  void playerId;
}

/**
 * Dipanggil saat pemain biasa menekan "Gabung Room" setelah cek room berhasil.
 * Mengembalikan true jika ditangani oleh Socket.io, atau false jika socket belum dipasang.
 */
export function emitJoinRoom({ code, name }) {
  // Dev3: kirim event join room ke server lewat socket (roomService.joinRoom di server),
  // lalu ubah return menjadi `true` setelah diimplementasikan.
  void code;
  void name;
  return false;
}

/**
 * Dipanggil saat pemain menekan tombol "Keluar Room".
 */
export function emitLeaveRoom({ code, playerId }) {
  // Dev3: kirim event leave room ke server (roomService.leaveRoom di server).
  void code;
  void playerId;
}

/**
 * Dipanggil saat Host menekan tombol "Mulai Pertandingan" di Lobby.
 * Mengembalikan true jika ditangani oleh Socket.io, atau false jika socket belum dipasang.
 */
export function emitStartGame({ code, playerId }) {
  // Dev3: kirim event start game ke server (gameService.startGame di server),
  // lalu ubah return menjadi `true` setelah diimplementasikan.
  void code;
  void playerId;
  return false;
}

/**
 * Dipanggil saat pemain memilih salah satu dari 4 jawaban (indeks 0..3).
 * Mengembalikan true jika ditangani oleh Socket.io, atau false jika socket belum dipasang.
 */
export function emitSubmitAnswer({ code, playerId, choice }) {
  // Dev3: kirim event submit answer ke server (gameService.submitAnswer di server),
  // lalu ubah return menjadi `true` setelah diimplementasikan.
  void code;
  void playerId;
  void choice;
  return false;
}

export function disconnectSocket() {
  if (socketInstance && typeof socketInstance.disconnect === "function") {
    socketInstance.disconnect();
  }
  socketInstance = null;
}

