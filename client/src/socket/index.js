import { io } from "socket.io-client";

export const SERVER_URL = (
  import.meta.env.VITE_SERVER_URL || "https://rivora-api.chazha.web.id/"
).replace(/\/+$/, "");

const CONNECTION_TIMEOUT_MS = 12000;
const ACK_TIMEOUT_MS = 12000;

let socketInstance = null;
let appStore = null;

function dispatch(type, payload) {
  appStore?.dispatch({ type, payload });
}

function socketError(error) {
  const message = error?.message || "Koneksi ke server terputus.";
  dispatch("game/setError", { message, code: error?.code || "SOCKET_ERROR" });
}

function getSocket() {
  if (!socketInstance) {
    throw new Error("Koneksi realtime belum siap. Muat ulang halaman.");
  }
  return socketInstance;
}

function waitForConnection(socket) {
  if (socket.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      error ? reject(error) : resolve();
    };
    const onConnect = () => finish();
    const onConnectError = (error) => {
      // Socket.IO akan mencoba tersambung lagi. Biarkan sampai batas waktu.
      if (socket.active === false) finish(error);
    };
    const timeout = setTimeout(
      () => finish(new Error("Tidak dapat terhubung ke server realtime.")),
      CONNECTION_TIMEOUT_MS
    );

    socket.once("connect", onConnect);
    socket.on("connect_error", onConnectError);
    if (!socket.active) socket.connect();
  });
}

async function emitWithAck(event, payload = {}) {
  const socket = getSocket();
  await waitForConnection(socket);

  return new Promise((resolve, reject) => {
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) {
        reject(new Error("Server tidak merespons. Coba lagi."));
        return;
      }

      if (!response?.ok) {
        const error = response?.error || {};
        const failure = new Error(error.message || "Permintaan ke server gagal.");
        failure.code = error.code || "SOCKET_REQUEST_FAILED";
        reject(failure);
        return;
      }

      resolve(response);
    });
  });
}

/** Pasang satu koneksi Socket.IO dan hubungkan event server ke Redux. */
export function initSocketListeners(store) {
  appStore = store;
  if (socketInstance) return socketInstance;

  socketInstance = io(SERVER_URL, {
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  socketInstance.on("connect", () => {
    dispatch("game/setSocketConnected", true);
  });
  socketInstance.on("disconnect", (reason) => {
    dispatch("game/setSocketConnected", false);
    if (reason !== "io client disconnect") {
      socketError(new Error("Koneksi realtime terputus. Periksa server dan jaringan."));
    }
  });
  socketInstance.on("connect_error", (error) => {
    dispatch("game/setSocketConnected", false);
    socketError(error);
  });

  socketInstance.on("room:state", (state) => {
    dispatch("game/sessionJoined", state);
  });
  socketInstance.on("room:updated", ({ room } = {}) => {
    if (room) dispatch("game/roomUpdated", room);
  });
  socketInstance.on("game:question", (question) => {
    dispatch("game/questionStarted", question);
  });
  socketInstance.on("game:answer-progress", (progress) => {
    dispatch("game/answerProgressUpdated", progress);
  });
  socketInstance.on("game:reveal", (reveal) => {
    dispatch("game/questionRevealed", reveal);
  });
  socketInstance.on("game:result", (result) => {
    dispatch("game/gameFinished", result);
  });
  socketInstance.on("server:error", (error) => socketError(error));

  return socketInstance;
}

export async function emitHostJoinRoom({ code, playerId }) {
  try {
    return await emitWithAck("room:connect", { code, playerId });
  } catch (error) {
    socketError(error);
    throw error;
  }
}

export async function emitJoinRoom({ code, name }) {
  try {
    return await emitWithAck("room:join", { code, name });
  } catch (error) {
    socketError(error);
    throw error;
  }
}

export function emitLeaveRoom() {
  return emitWithAck("room:leave").catch((error) => {
    socketError(error);
    return null;
  });
}

export function emitStartGame() {
  return emitWithAck("game:start").catch((error) => {
    socketError(error);
    return null;
  });
}

export function emitStopGame() {
  return emitWithAck("game:stop").catch((error) => {
    socketError(error);
    return null;
  });
}

export function emitSubmitAnswer({ choice }) {
  return emitWithAck("answer:submit", { choice }).catch((error) => {
    socketError(error);
    return null;
  });
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
