import React, { MouseEvent, useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import "./hp-tracker.scss";

type PlayerProps = {
    id: string;
    item: Item;
    data: HpTrackerMetadata;
    popover: boolean;
    selected: boolean;
    metadata: SceneMetadata;
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

    const [data, setData] = useState<HpTrackerMetadata>(props.data);

    const { setId } = useCharSheet();

    const handleMetadata = (metadata: Metadata) => {
        if (metadata && sceneMetadata in metadata) {
            const sceneData = metadata[sceneMetadata] as SceneMetadata;
            setAllowNegativeNumbers(sceneData.allowNegativeNumbers ?? false);
        }
    };

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
                currentData.hp = currentData.hp + (value-currentData.temp_hp);
                currentData.temp_hp = value;
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleMaxHpChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                let maxHP = value
                if (currentData.temp_hp != 0){
                    maxHP += currentData.temp_hp
                }

                if (maxHP < currentData.hp){
                    currentData.hp = maxHP
                }

                currentData.maxHp = maxHP

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

    const handleOnPlayerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const currentSelection = (await OBR.player.getSelection()) || [];
        if (currentSelection.includes(props.item.id)) {
            currentSelection.splice(currentSelection.indexOf(props.item.id), 1);
            await OBR.player.select(currentSelection);
        } else {
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
                currentSelection.push(props.item.id);
                await OBR.player.select(currentSelection);
            } else {
                await OBR.player.select([props.item.id]);
            }
        }
    };

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([props.item.id]);
        await OBR.player.select([props.item.id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
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
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.maxHp}
                    min={0}
                    onChange={(e) => {
                        handleMaxHpChange(Number(e.target.value));
                    }}
                />
            </span>
            <span className={"armor-class"}>TMP:
                <input
                    type={"number"}
                    placeholder="0"
                    value={props.data.temp_hp}
                    min={0}
                    onChange={(e) => {
                        handleTMPHpChange(Number(e.target.value));
                    }}
                />
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
                <button
                    title={"Roll Initiative (including DEX modifier from statblock)"}
                    className={`toggle-button initiative-button`}
                    onClick={() => {
                        const value = Math.floor(Math.random() * 20) + 1 + data.stats.initiativeBonus;
                        const newData = { ...data, initiative: value };
                        setData(newData);
                        handleValueChange(newData);
                    }}
                />
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
