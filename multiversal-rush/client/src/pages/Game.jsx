// ============================================================
//  pages/Game.jsx — 3D game shell
//  Flow (Fall Guys style):
//    1. All ready in Lobby.jsx → server emits allReadyMoveToLobby → navigate here
//    2. HubWorld (15s | lobbyCountdown ticks from server)
//    3. Server emits startGame { map } → mount the selected map
//    4. Player finishes / eliminated → matchResults → returnToLobby → back to /
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import useStore from "../store/store";
import RemotePlayers from "../components/Multiplayer/RemotePlayers";
import HUD from "../components/UI/HUD";
import MatchResultsOverlay from "../components/UI/MatchResultsOverlay";
import AchievementPopup from "../components/UI/AchievementPopup";
import HubWorld from "../components/Worlds/HubWorld";
import Honeycomb from "../components/Worlds/Honeycomb";
import WorldCryoVoid from "../components/Worlds/WorldCryoVoid";
import WorldLavaHell from "../components/Worlds/WorldLavaHell";
import WorldNeonParadox from "../components/Worlds/WorldNeonParadox";
import FrozenFrenzyArena from "../components/Worlds/FrozenFrenzyArena";

// Map ID → display label (for HUD badge + floating text)
const MAP_LABELS = {
    frozenfrenzy: "🌨️ Frozen Frenzy",
    lavahell: "🔥 Lava Hell",
    honeycomb: "🍯 Honeycomb",
    neonparadox: "🔮 Neon Paradox",
    cryovoid: "❄️ Cryo Void",
};

export default function Game() {
    const navigate = useNavigate();

    // "lobby" = 3D HubWorld waiting area
    // any map id = that map is active
    const [phase, setPhase] = useState("lobby");
    const [lobbyTimeLeft, setLobbyTimeLeft] = useState(15);   // shown in HubWorld
    const [selectedMap, setSelectedMap] = useState(null);     // revealed early by server
    const [eliminated, setEliminated] = useState(false);

    const setCurrentWorld = useStore((s) => s.setCurrentWorld);
    const setGameState = useStore((s) => s.setGameState);
    const updatePlayer = useStore((s) => s.updatePlayer);
    const setFinishedOrder = useStore((s) => s.setFinishedOrder);
    const setMyFinishResult = useStore((s) => s.setMyFinishResult);
    const setStartTime = useStore((s) => s.setStartTime);
    const setPlayers = useStore((s) => s.setPlayers);
    const setMatchResults = useStore((s) => s.setMatchResults);
    const showMatchResults = useStore((s) => s.showMatchResults);
    const showAchievementPopup = useStore((s) => s.showAchievementPopup);

    useEffect(() => { setCurrentWorld(0); }, [setCurrentWorld]);

    // ---- Socket listeners ----
    useEffect(() => {
        // Remote player moved
        socket.on("playerMoved", ({ playerId, position, rotation, world }) => {
            updatePlayer(playerId, { position, rotation, world });
        });

        socket.on("playerWorldChanged", ({ playerId, newWorld }) => {
            updatePlayer(playerId, { world: newWorld });
        });

        socket.on("playerFinishedRace", ({ playerId, finishTime, finishedOrder }) => {
            updatePlayer(playerId, { finished: true, finishTime });
            setFinishedOrder(finishedOrder);
        });

        socket.on("yourFinishResult", ({ position, finishTime }) => {
            setMyFinishResult({ position, finishTime });
        });

        socket.on("playerEliminated", ({ eliminatedId }) => {
            updatePlayer(eliminatedId, { eliminated: true });
        });

        socket.on("matchResults", ({ results }) => {
            setMatchResults(results);
        });

        // ── Server ticks the 15-sec lobby countdown ──
        socket.on("lobbyCountdown", ({ timeLeft }) => {
            setLobbyTimeLeft(timeLeft);
        });

        // ── Catch allReadyMoveToLobby in case component mounts after it fires ──
        socket.on("allReadyMoveToLobby", ({ map }) => {
            if (map) setSelectedMap(map);
        });

        // ── Game GO — mount the randomly selected map ──
        socket.on("startGame", ({ map, startTime, players }) => {
            console.log("[Game] startGame received, map:", map);
            setStartTime(startTime);
            setGameState("playing");
            setEliminated(false);
            setPlayers(players);
            setMyFinishResult(null); // Clear previous finish result

            // Map the map id → the world number that each map's Player emits
            // This MUST match the world={N} prop in each World component:
            //   FrozenFrenzyArena  world={7}
            //   WorldLavaHell      world={5}
            //   Honeycomb          world={3}
            //   World1 (neon)      world={1}   ← was wrongly 4
            //   WorldCryoVoid      world={6}   ← was 3, clashed with honeycomb
            const MAP_WORLD_NUM = {
                frozenfrenzy: 7,
                lavahell: 5,
                honeycomb: 3,
                neonparadox: 1,  // fixed: World1 uses world={1}
                cryovoid: 6,     // fixed: unique ID, no longer clashes with honeycomb
            };
            console.log('[Game] startGame – map:', map, '→ worldNum:', MAP_WORLD_NUM[map] ?? 1);
            setCurrentWorld(MAP_WORLD_NUM[map] ?? 1);

            if (map) {
                setPhase(map);
                setSelectedMap(map);
            }
        });

        // Countdown cancelled (someone left during lobby)
        socket.on("countdownCancelled", () => {
            setPhase("lobby");
            setLobbyTimeLeft(15);
            setSelectedMap(null);
            setMyFinishResult(null); // Clear finish result
        });

        // Return to main lobby (2D Lobby.jsx) after match
        socket.on("returnToLobby", () => {
            console.log("[Game] returnToLobby");
            setGameState("waiting");
            setCurrentWorld(0);
            setEliminated(false);
            setPhase("lobby");
            setSelectedMap(null);
            setLobbyTimeLeft(15);
            setMyFinishResult(null); // Clear finish result
            navigate("/");
        });

        socket.on("playersUpdated", ({ players }) => setPlayers(players));

        // Achievement unlock notification
        socket.on("achievementUnlocked", (data) => {
            console.log(`[Game] achievementUnlocked:`, data);
            showAchievementPopup(data);
        });

        return () => {
            socket.off("playerMoved");
            socket.off("playerWorldChanged");
            socket.off("playerFinishedRace");
            socket.off("yourFinishResult");
            socket.off("playerEliminated");
            socket.off("matchResults");
            socket.off("lobbyCountdown");
            socket.off("allReadyMoveToLobby");
            socket.off("startGame");
            socket.off("countdownCancelled");
            socket.off("returnToLobby");
            socket.off("playersUpdated");
            socket.off("achievementUnlocked");
        };
    }, [updatePlayer, setFinishedOrder, setMyFinishResult, setMatchResults,
        setStartTime, setGameState, setCurrentWorld, setPlayers, navigate]);

    // ---- Emit helpers ----
    const emitMove = useCallback(({ position, rotation, world }) => {
        socket.emit("move", { position, rotation, world });
    }, []);

    const emitWorldTransition = useCallback(() => { }, []); // no-op (maps are standalone)
    const emitFinished = useCallback(() => socket.emit("playerFinished"), []);
    const emitFell = useCallback(() => socket.emit("playerFell"), []);
    const emitEliminated = useCallback(() => {
        socket.emit("playerEliminated");
        setEliminated(true);
    }, []);

    const emitAchievement = useCallback((type, value = 1) => {
        socket.emit("achievementEvent", { type, value });
    }, []);

    // ── Text shown floating inside HubWorld ──
    const mapLabel = MAP_LABELS[selectedMap] || "🎲 Random Map";
    const countdownText = phase === "lobby"
        ? (lobbyTimeLeft > 0
            ? `${mapLabel}\nStarting in ${lobbyTimeLeft}s…`
            : "🚀 Launching…")
        : `🎮 ${MAP_LABELS[phase] || "Playing..."}`;

    const isInLobby = phase === "lobby";

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
            {showMatchResults && <MatchResultsOverlay />}

            {/* Achievement unlock popup — rendered once */}
            <AchievementPopup />

            <HUD
                emitMethods={{ emitMove, emitWorldTransition, emitFinished, emitFell }}
                currentLevel={isInLobby ? "hub" : phase}
            />

            {/* Eliminated overlay */}
            {eliminated && !showMatchResults && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 200,
                    background: "rgba(180,0,0,0.72)", backdropFilter: "blur(10px)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: "#fff", fontFamily: "'Exo 2', sans-serif",
                }}>
                    <div style={{ fontSize: 80 }}>🔥</div>
                    <h1 style={{ fontSize: 56, margin: "12px 0", textShadow: "0 0 40px #ff4400" }}>ELIMINATED</h1>
                    <p style={{ fontSize: 22, opacity: 0.85 }}>Waiting for match to end…</p>
                </div>
            )}

            {/* Lobby countdown badge overlay */}
            {isInLobby && lobbyTimeLeft > 0 && (
                <div style={{
                    position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
                    zIndex: 100,
                    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
                    border: "1px solid #00ffe0", borderRadius: 12,
                    padding: "10px 28px 10px 22px",
                    color: "#00ffe0", fontFamily: "'Exo 2', sans-serif",
                    fontSize: 20, fontWeight: 700, letterSpacing: 1,
                    display: "flex", alignItems: "center", gap: 12,
                    pointerEvents: "none",
                }}>
                    <span style={{ fontSize: 28 }}>🗺️</span>
                    <span>
                        {selectedMap ? MAP_LABELS[selectedMap] : "Picking a map…"}
                        {" — "}
                        <span style={{ color: "#fff" }}>{lobbyTimeLeft}s</span>
                    </span>
                </div>
            )}

            <Canvas 
                camera={{ position: [0, 6, 12], fov: 70 }} 
                style={{ position: "absolute", inset: 0 }}
                gl={{ 
                    antialias: true, 
                    alpha: false,
                    powerPreference: "high-performance",
                    failIfMajorPerformanceCaveat: false,
                    preserveDrawingBuffer: false, // Better performance
                    stencil: false, // Disable if not needed
                    depth: true
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#87CEEB');
                    
                    // WebGL Context Loss Recovery
                    const canvas = gl.domElement;
                    
                    canvas.addEventListener('webglcontextlost', (event) => {
                        console.warn('[WebGL] Context lost, preventing default...');
                        event.preventDefault();
                    });
                    
                    canvas.addEventListener('webglcontextrestored', () => {
                        console.log('[WebGL] Context restored, reloading...');
                        window.location.reload(); // Force reload to restore everything
                    });
                }}
                }}
            >
                <RemotePlayers />

                {/* ── 3D Pre-Game Lobby (HubWorld) ── */}
                {isInLobby && (
                    <HubWorld
                        emitMove={emitMove}
                        emitFell={emitFell}
                        emitAchievement={emitAchievement}
                        countdownText={countdownText}
                    />
                )}

                {/* ══ MAPS — chosen randomly by server ══ */}

                {phase === "frozenfrenzy" && (
                    <FrozenFrenzyArena
                        emitMove={emitMove}
                        emitFinished={emitFinished}
                        emitFell={emitFell}
                        emitAchievement={emitAchievement}
                        emitWorldTransition={emitWorldTransition}
                    />
                )}

                {phase === "lavahell" && (
                    <WorldLavaHell
                        emitMove={emitMove}
                        emitFinished={emitFinished}
                        emitFell={emitFell}
                        emitAchievement={emitAchievement}
                        emitWorldTransition={emitWorldTransition}
                        emitEliminated={emitEliminated}
                    />
                )}

                {phase === "honeycomb" && (
                    <Honeycomb
                        emitMove={emitMove}
                        emitWorldTransition={emitWorldTransition}
                        emitFell={emitFell}
                        emitEliminated={emitEliminated}
                        emitAchievement={emitAchievement}
                    />
                )}

                {phase === "neonparadox" && (
                    <WorldNeonParadox
                        emitMove={emitMove}
                        emitFinished={emitFinished}
                        emitFell={emitFell}
                        emitAchievement={emitAchievement}
                        emitWorldTransition={emitWorldTransition}
                    />
                )}

                {phase === "cryovoid" && (
                    <WorldCryoVoid
                        emitMove={emitMove}
                        emitFinished={emitFinished}
                        emitFell={emitFell}
                        emitAchievement={emitAchievement}
                    />
                )}
            </Canvas>
        </div>
    );
}
