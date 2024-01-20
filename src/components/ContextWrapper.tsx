import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PluginGate } from "../context/PluginGateContext.tsx";
import { metadataKey } from "../helper/variables.ts";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { Loader } from "./general/Loader.tsx";
import { objectsEqual } from "../helper/helpers.ts";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";

export const ContextWrapper = (props: PropsWithChildren) => {
    const [role, setRole] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const { scene, room, setSceneMetadata, setRoomMetadata } = useMetadataContext();
    const queryClient = new QueryClient();
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
                setRole(await OBR.player.getRole());
                setPlayerId(OBR.player.id);
                setPlayerName(await OBR.player.getName());
            });
        }
    }, []);

    useEffect(() => {
        const setMetadata = async () => {
            const sceneMetadata = await OBR.scene.getMetadata();
            if (metadataKey in sceneMetadata) {
                setSceneMetadata(sceneMetadata[metadataKey] as SceneMetadata);
            }
            const roomMetadata = await OBR.room.getMetadata();
            if (metadataKey in roomMetadata) {
                setRoomMetadata(roomMetadata[metadataKey] as RoomMetadata);
            }

            OBR.scene.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newSceneMetadata = metadata[metadataKey] as SceneMetadata;
                    if (!scene || !objectsEqual(newSceneMetadata, scene)) {
                        setSceneMetadata(newSceneMetadata);
                    }
                }
            });

            OBR.room.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newRoomMetadata = metadata[metadataKey] as RoomMetadata;
                    if (room) {
                    }
                    if (!room || !objectsEqual(newRoomMetadata, room)) {
                        setRoomMetadata(newRoomMetadata);
                    }
                }
            });
        };

        if (isReady) {
            setMetadata();
        }
    }, [isReady]);

    const playerContext: PlayerContextType = { role: role, id: playerId, name: playerName };

    if (ready) {
        return (
            <PluginGate>
                <QueryClientProvider client={queryClient}>
                    <PlayerContext.Provider value={playerContext}>
                        {scene && room ? props.children : <Loader className={"initialization-loader"} />}
                    </PlayerContext.Provider>
                </QueryClientProvider>
            </PluginGate>
        );
    } else {
        return null;
    }
};
