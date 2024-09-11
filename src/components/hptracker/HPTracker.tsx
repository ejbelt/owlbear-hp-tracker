import React, { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import "./hp-tracker.scss";

import {
    characterMetadata
} from "../../helper/variables.ts";

type PlayerProps = {
    id: string;
    item: Item;
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

    const [data, setData] = useState<HpTrackerMetadata>(props.data);

    const { setId } = useCharSheet();

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

    const handleValueChange = (newData: HpTrackerMetadata) => {
        OBR.scene.items.updateItems([props.item], (items) => {
            items.forEach((item) => {
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...newData };
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
                    return <Player key={token.id} id={token.id} data={data} item={token}/>;
                }
                return null;
            })}
        </div>
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
