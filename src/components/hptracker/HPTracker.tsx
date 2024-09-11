import React, { MouseEvent, useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import "./hp-tracker.scss";

type PlayerProps = {
    id: string;
    data: HpTrackerMetadata;
};

export const HPTracker = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Player = (props: PlayerProps) => {
    const playerContext = usePlayerContext();
    const handleHpChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.hp = value;
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleTMPHpChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.tmp_hp = value;
                currentData.hp += value;
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleACChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.armorClass = value;
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleACSChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.armorClassSpecial = value;
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleOnPlayerClick = (event: MouseEvent) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                if (event.type === "mousedown") {
                    item.rotation = 10;
                } else {
                    item.rotation = 0;
                }
            });
        });
    };

    const reorderMetadataIndexMulti = (destList: Array<Item>, group: string, sourceList: Array<Item>) => {
        const combinedList = destList.concat(sourceList);
        const destinationIds = destList.map((d) => d.id);
        OBR.scene.items.updateItems(combinedList, (items) => {
            let destIndex = 0;
            let sourceIndex = 0;
            items.forEach((item) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                if (destinationIds.includes(item.id)) {
                    data.index = destIndex;
                    destIndex += 1;
                    data.group = group;
                } else {
                    data.index = sourceIndex;
                    sourceIndex += 1;
                }
                item.metadata[itemMetadataKey] = { ...data };
            });
        });
    };

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

        reorderMetadataIndexMulti(destClone, droppableDestination.droppableId, sourceClone);
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

    const display = (): boolean => {
        return (
            props.data.hpTrackerActive &&
            (playerContext.role === "GM" || (playerContext.role === "PLAYER" && props.data.canPlayersSee))
        );
    };

    return display() ? (
        <div className={"player-wrapper"}>
            <div
                className={"player-name"}
                onMouseDown={handleOnPlayerClick}
                onMouseUp={handleOnPlayerClick}
                onMouseLeave={handleOnPlayerClick}
            >
                {props.data.name}
            </div>
            <span className={"current-hp"}>
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.hp}
                    min={0}
                    onChange={(e) => {
                        handleHpChange(Number(e.target.value));
                    }}
                />
                <span>/</span>
                <span>{props.data.maxHp}</span>
            </span>
            <span className={"current-hp"}>ACP:
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.hp}
                    min={0}
                    onChange={(e) => {
                        handleTMPHpChange(Number(e.target.value));
                    }}
                />
                <span>/</span>
                <span>{props.data.maxHp}</span>
            </span>
            <span className={"armor-class"}>ACP: 
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.armorClass}
                    min={0}
                    onChange={(e) => {
                        handleACChange(Number(e.target.value));
                    }}
                />
            </span>
            <span className={"armor-class"}>ACS: 
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.armorClassSpecial}
                    min={0}
                    onChange={(e) => {
                        handleACSChange(Number(e.target.value));
                    }}
                />
            </span>
            
            <div className={"initiative-wrapper"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.initiative}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        const newData = { ...data, initiative: value };
                        setData(newData);
                        handleValueChange(newData);
                    }}
                    className={"initiative"}
                />
                <div
                    className={"init-wrapper"}
                    onMouseEnter={() => {
                        setInitHover(true);
                    }}
                    onMouseLeave={() => setInitHover(false)}
                >
                    <button
                        title={"Roll Initiative (including initiative modifier from statblock)"}
                        className={`toggle-button initiative-button`}
                        disabled={
                            getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                            !initialized &&
                            !room?.disableDiceRoller
                        }
                        onClick={async () => {
                            const value = await rollInitiative(false);
                            const newData = { ...data, initiative: value };
                            setData(newData);
                            handleValueChange(newData);
                        }}
                    />
                    <button
                        className={`self ${initHover ? "visible" : "hidden"}`}
                        disabled={
                            getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                            !initialized &&
                            !room?.disableDiceRoller
                        }
                        onClick={async () => {
                            const value = await rollInitiative(true);
                            const newData = { ...data, initiative: value };
                            setData(newData);
                            handleValueChange(newData);
                        }}
                    >
                        HIDE
                    </button>
                </div>
            </div>
            {props.popover ? null : (
                <div className={"info-button-wrapper"}>
                    <button
                        title={"Show Statblock"}
                        className={"toggle-button info-button"}
                        onClick={() => setId(props.item.id)}
                    />
                </div>
            )}
        </div>
            
        </div>
    ) : (
        <></>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Item[] | undefined>(undefined);

    useEffect(() => {
        OBR.onReady(() => {
            OBR.scene.onReadyChange(async (isReady) => {
                if (isReady) {
                    const initialItems = await OBR.scene.items.getItems((item) => item.layer === "CHARACTER");
                    setTokens(initialItems);

                    OBR.scene.items.onChange(async (items) => {
                        const filteredItems = items.filter((item) => item.layer === "CHARACTER");
                        setTokens(Array.from(filteredItems));
                    });
                }
            });
        });
    }, []);

    return playerContext.role ? (
        <div className={"hp-tracker"}>
            <h1>HP Tracker</h1>
            {tokens?.map((token) => {
                const data = token.metadata[characterMetadata] as HpTrackerMetadata;
                if (data) {
                    return <Player key={token.id} id={token.id} data={data} />;
                }
                return null;
            })}
        </div>
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
