import { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { changelogModal, itemMetadataKey, version } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { DragDropContext, DraggableLocation, DropResult } from "react-beautiful-dnd";
import { PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./charactersheet/CharacterSheet.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import { sortItems, sortItemsInitiative } from "../../helper/helpers.ts";
import { compare } from "compare-versions";
import { Helpbuttons } from "../general/Helpbuttons/Helpbuttons.tsx";
import { DiceTray } from "../general/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";

export const HPTracker = () => {
    return (
        <ContextWrapper>
            <Content />
            <DiceTray classes={"hp-tracker-dice-tray"} />
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Item[] | undefined>(undefined);
    const [playerTokens, setPlayerTokens] = useState<Array<Item>>([]);
    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [tokenLists, setTokenLists] = useState<Map<string, Array<Item>>>(new Map());
    const [ignoredChanges, setIgnoredChanges] = useState<boolean>(false);
    const { scene, room } = useMetadataContext();
    const { isReady } = SceneReadyContext();
    const { characterId } = useCharSheet();

    const initHpTracker = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                itemMetadataKey in item.metadata &&
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
        );
        setTokens(initialItems);

        if (
            playerContext.role === "GM" &&
            !room?.ignoreUpdateNotification &&
            scene?.version &&
            compare(scene.version, version, "<")
        ) {
            await OBR.modal.open({
                ...changelogModal,
                fullScreen: false,
                url: `${changelogModal.url}&update=true`,
                height: 600,
                width: 600,
            });
        } else if (playerContext.role === "GM" && scene?.version && compare(scene.version, version, "<")) {
            setIgnoredChanges(true);
            await OBR.notification.show(`HP Tracker has been updated to version ${version}`, "SUCCESS");
        }
    };

    useEffect(() => {
        if (isReady) {
            initHpTracker();
        }
    }, [isReady]);

    useEffect(() => {
        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    itemMetadataKey in item.metadata &&
                    (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
            );
            setTokens(Array.from(filteredItems));
        });

        OBR.player.onChange((player) => {
            setSelectedTokens(player.selection ?? []);
        });
    }, []);

    useEffect(() => {
        const tokenMap = new Map<string, Array<Item>>();

        scene?.groups?.forEach((group) => {
            const groupItems = tokens?.filter((item) => {
                const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                return (
                    (!metadata.group && group === "Default") ||
                    metadata.group === group ||
                    (!scene?.groups?.includes(metadata.group ?? "") && group === "Default")
                );
            });
            tokenMap.set(group, groupItems ?? []);
        });

        setTokenLists(tokenMap);
    }, [scene?.groups, tokens]);

    useEffect(() => {
        if (room?.playerSort && tokens) {
            const localTokens = [...tokens];
            setPlayerTokens(localTokens.sort(sortItemsInitiative));
        } else {
            setPlayerTokens(tokens ?? []);
        }
    }, [room?.playerSort, tokens]);

    const reorderMetadataIndex = (list: Array<Item>, group?: string) => {
        OBR.scene.items.updateItems(list, (items) => {
            items.forEach((item, index) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                data.index = index;
                if (group) {
                    data.group = group;
                }
                item.metadata[itemMetadataKey] = { ...data };
            });
        });
    };

    const reorder = (
        list: Item[],
        startIndex: number,
        endIndex: number,
        dragItem: DropResult,
        multiMove: boolean = false
    ) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = result.filter(
                (item) => selectedTokens.includes(item.id) && item.id != dragItem.draggableId
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    result.splice(
                        result.findIndex((sourceItem) => sourceItem.id === item.id),
                        1
                    )
                );
            });

            localRemove = localRemove.concat(multiRemove);
            localRemove.forEach((item) => {
                result.splice(endIndex, 0, item);
            });
        } else {
            result.splice(endIndex, 0, removed);
        }
        const tokens = result.filter((item) => item !== undefined);

        reorderMetadataIndex(tokens);
    };

    const move = (
        source: Array<Item>,
        destination: Array<Item>,
        droppableSource: DraggableLocation,
        droppableDestination: DraggableLocation,
        result: DropResult,
        multiMove: boolean = false
    ) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = source.filter(
                (item) => selectedTokens.includes(item.id) && item.id != result.draggableId
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    sourceClone.splice(
                        sourceClone.findIndex((sourceItem) => sourceItem.id === item.id),
                        1
                    )
                );
            });

            localRemove = localRemove.concat(multiRemove);

            localRemove.forEach((item) => {
                destClone.splice(droppableDestination.index, 0, item);
            });
        } else {
            destClone.splice(droppableDestination.index, 0, removed);
        }

        reorderMetadataIndex(sourceClone);
        reorderMetadataIndex(destClone, droppableDestination.droppableId);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId != result.destination.droppableId) {
            move(
                tokenLists.get(result.source.droppableId) || [],
                tokenLists.get(result.destination.droppableId) || [],
                result.source,
                result.destination,
                result,
                selectedTokens.includes(result.draggableId)
            );
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(
            tokenLists.get(result.destination.droppableId) ?? [],
            result.source.index,
            result.destination.index,
            result,
            selectedTokens.includes(result.draggableId)
        );
    };

    const orderByInitiative = () => {
        tokenLists.forEach((tokenList) => {
            const reordered = Array.from(tokenList);
            reordered.sort((a, b) => {
                const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
                const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
                if (bData.initiative === aData.initiative) {
                    return (
                        bData.stats.initiativeBonus +
                        bData.initiative -
                        (aData.stats.initiativeBonus + aData.initiative)
                    );
                }
                return bData.initiative - aData.initiative;
            });
            reorderMetadataIndex(reordered);
        });
    };

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet itemId={characterId} />
        ) : (
            <div className={"hp-tracker"}>
                <Helpbuttons ignoredChanges={ignoredChanges} setIgnoredChange={setIgnoredChanges} />
                <h1 className={"title"}>
                    HP Tracker<span className={"small"}>{version}</span>
                </h1>
                <div className={`player-wrapper headings ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                    <span>Name</span>
                    {playerContext.role === "GM" ? <span>Settings</span> : null}
                    <span className={"current-hp"}>HP / MAX</span>
                    <span className={"temp-hp"}>TMP</span>
                    <span className={"armor-class"}>AC</span>
                    <span className={"initiative-wrapper"}>
                        INIT
                        {playerContext.role === "GM" ? (
                            <button
                                className={"sort-button settings-button"}
                                title={"Order By Initiative"}
                                onClick={orderByInitiative}
                            >
                                ↓
                            </button>
                        ) : null}
                    </span>
                    <span className={"character-sheet"}>INFO</span>
                </div>
                {playerContext.role === "GM" ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {scene && scene.groups && scene.groups?.length > 0 ? (
                            scene.groups?.map((group) => {
                                const list = tokenLists.get(group) || [];
                                return (
                                    <DropGroup
                                        key={group}
                                        title={group}
                                        list={list.sort(sortItems)}
                                        selected={selectedTokens}
                                        tokenLists={tokenLists}
                                    />
                                );
                            })
                        ) : (
                            <DropGroup
                                title={"Default"}
                                list={Array.from(tokens ?? []).sort(sortItems)}
                                selected={selectedTokens}
                                tokenLists={tokenLists}
                            />
                        )}
                    </DragDropContext>
                ) : (
                    <PlayerTokenList tokens={playerTokens} selected={selectedTokens} tokenLists={tokenLists} />
                )}
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
