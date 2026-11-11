import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import LobbyPage from "./LobbyPage";
import PlayPage from "./PlayPage";
import RevealPage from "./RevealPage";
import ResultPage from "./ResultPage";

export default function RoomContainer() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { room, phase } = useSelector((state) => state.game);

  // Sesuai PRD Bagian 11: Jika pemain refresh halaman saat game berjalan
  // (state memori di client hilang), arahkan kembali ke halaman Landing.
  useEffect(() => {
    if (!room || phase === "landing") {
      navigate("/", { replace: true });
    }
  }, [room, phase, navigate, code]);

  if (!room || phase === "landing") {
    return null;
  }

  if (phase === "playing") {
    return <PlayPage />;
  }

  if (phase === "reveal") {
    return <RevealPage />;
  }

  if (phase === "result") {
    return <ResultPage />;
  }

  return <LobbyPage />;
}

