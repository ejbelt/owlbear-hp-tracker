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
                currentData.hp = currentData.hp + (value-currentData.temp_hp);
                currentData.temp_hp = value;
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
