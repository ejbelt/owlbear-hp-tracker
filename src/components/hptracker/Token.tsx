import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";

import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useEffect, useRef, useState } from "react";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { characterMetadata, sceneMetadata } from "../../helper/variables.ts";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { updateHp } from "../../helper/hpHelpers.ts";
import { evalString } from "../../helper/helpers.ts";
import "./player-wrapper.scss";
import { updateAc } from "../../helper/acHelper.ts";

type TokenProps = {
    item: Item;
    data: HpTrackerMetadata;
    popover: boolean;
    selected: boolean;
    metadata: SceneMetadata;
};

export const Token = (props: TokenProps) => {
    const playerContext = usePlayerContext();
    // const { ruleset } = useFilter();
    const [data, setData] = useState<HpTrackerMetadata>(props.data);
    const [editName, setEditName] = useState<boolean>(false);
    const [allowNegativNumbers, setAllowNegativeNumbers] = useState<boolean | undefined>(undefined);
    const { isReady } = SceneReadyContext();
    const { setId } = useCharSheet();
    const hpRef = useRef<HTMLInputElement>(null);
    const maxHpRef = useRef<HTMLInputElement>(null);

    const handleMetadata = (metadata: Metadata) => {
        if (metadata && sceneMetadata in metadata) {
            const sceneData = metadata[sceneMetadata] as SceneMetadata;
            setAllowNegativeNumbers(sceneData.allowNegativeNumbers ?? false);
        }
    };

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    useEffect(() => {
        if (hpRef && hpRef.current) {
            hpRef.current.value = props.data.hp.toString();
        }
    }, [props.data.hp]);

    useEffect(() => {
        const initMetadataValues = async () => {
            const metadata = (await OBR.scene.getMetadata()) as Metadata;
            handleMetadata(metadata);
        };
        if (isReady) {
            initMetadataValues();
            updateHp(props.item, data);
            updateAc(props.item, data);
        }
    }, [isReady]);

    useEffect(() => {
        handleMetadata(props.metadata);
    }, [props.metadata]);

    useEffect(() => {
        // could be undefined so we check for boolean
        if (allowNegativNumbers === false) {
            if (data.hp < 0) {
                handleValueChange(0, "hp");
            }
            if (data.armorClass < 0) {
                handleValueChange(0, "armorClass");
            }
        }
    }, [allowNegativNumbers]);

    const handleValueChange = (value: string | number | boolean, key: string) => {
        OBR.scene.items.updateItems([props.item.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                if (key === "name") {
                    currentData.name = String(value);
                    setData({ ...data, name: currentData.name });
                } else if (key === "players") {
                    currentData.canPlayersSee = !!value;
                    updateHp(props.item, { ...data, canPlayersSee: !!value });
                    updateAc(props.item, {
                        ...data,
                        canPlayersSee: !!value,
                    });
                    setData({ ...data, canPlayersSee: currentData.canPlayersSee });
                } else if (key === "acOnMap") {
                    currentData.acOnMap = !!value;
                    updateAc(props.item, {
                        ...data,
                        acOnMap: !!value,
                    });
                    setData({ ...data, acOnMap: currentData.acOnMap });
                } else if (key === "hpOnMap") {
                    currentData.hpOnMap = !!value;
                    updateHp(props.item, { ...data, hpOnMap: !!value });
                    setData({ ...data, hpOnMap: currentData.hpOnMap });
                } else if (key === "hpBar") {
                    currentData.hpBar = !!value;
                    updateHp(props.item, { ...data, hpBar: !!value });
                    setData({ ...data, hpBar: currentData.hpBar });
                } else if (key === "armorClass") {
                    currentData.armorClass = allowNegativNumbers ? Number(value) : Math.max(Number(value), 0);
                    updateAc(props.item, {
                        ...data,
                        armorClass: currentData.armorClass,
                    });
                    setData({ ...data, armorClass: currentData.armorClass });
                } else if (key === "maxHP") {
                    currentData.maxHp = Math.max(Number(value), 0);
                    if (currentData.maxHp < currentData.hp) {
                        currentData.hp = currentData.maxHp;
                        setData({ ...data, hp: currentData.hp });
                    }
                    updateHp(props.item, {
                        ...data,
                        hp: currentData.hp,
                        maxHp: currentData.maxHp,
                    });
                    setData({ ...data, maxHp: currentData.maxHp });
                } else if (key === "hp") {
                    const newHp = Number(value);
                    if (newHp < currentData.hp && currentData.stats.tempHp && currentData.stats.tempHp > 0) {
                        currentData.stats.tempHp = Math.max(currentData.stats.tempHp - (currentData.hp - newHp), 0);
                        if (maxHpRef.current) {
                            maxHpRef.current.value = maxHpOutput(data.maxHp, currentData.stats.tempHp);
                        }
                    }
                    currentData.hp = allowNegativNumbers ? newHp : Math.max(newHp, 0);
                    updateHp(props.item, { ...data, hp: currentData.hp });
                    setData({ ...data, hp: currentData.hp });
                } else if (key === "tempHP") {
                    const { maxHp, tempHp } = getTempHp(value.toString());
                    if (tempHp !== 0) {
                        if (currentData.stats.tempHp) {
                            currentData.hp += tempHp - currentData.stats.tempHp;
                        } else {
                            currentData.hp += tempHp;
                        }
                    }
                    currentData.hp = Math.min(currentData.hp, maxHp + tempHp);
                    currentData.stats.tempHp = tempHp;
                    updateHp(props.item, { ...data, hp: currentData.hp });
                    setData({
                        ...data,
                        hp: currentData.hp,
                        stats: { ...currentData.stats, tempHp: currentData.stats.tempHp },
                    });
                } else if (key === "initiative") {
                    currentData.initiative = Number(value);
                    setData({ ...data, initiative: currentData.initiative });
                } else if (key === "hpMaxHp") {
                    currentData.maxHp = Math.max(Number(value), 0);
                    currentData.hp = Number(value);
                    updateHp(props.item, { ...data, hp: currentData.hp, maxHp: currentData.maxHp });
                    setData({ ...data, hp: currentData.hp, maxHp: currentData.maxHp });
                }
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
            (playerContext.role === "GM" ||
                (playerContext.role === "PLAYER" && props.data.canPlayersSee && props.item.visible))
        );
    };

    const getBgColor = () => {
        if (props.data.hp === 0 && props.data.maxHp === 0) {
            return "#1C1B22";
        }

        const percent = props.data.hp / (data.stats.tempHp ? data.stats.tempHp + data.maxHp : data.maxHp);

        const g = 255 * percent;
        const r = 255 - 255 * percent;
        return "rgb(" + r + "," + g + ",0,0.2)";
    };

    const getNewHpValue = (input: string) => {
        let value: number;
        let factor = 1;
        if (allowNegativNumbers) {
            factor = input.startsWith("-") ? -1 : 1;
        }
        if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
            value = Number(evalString(input));
        } else {
            value = Number(input.replace(/[^0-9]/g, ""));
        }
        let hp: number;
        if (data.maxHp > 0) {
            hp = Math.min(Number(value * factor), data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp);
        } else {
            hp = Number(value * factor);
            handleValueChange(hp, "hpMaxHp");
            return null;
        }
        return allowNegativNumbers ? hp : Math.max(hp, 0);
    };

    const getTempHp = (input: string) => {
        if (input.indexOf("+") > 0) {
            const parts = input.split("+");
            const max = Number(parts[0].replace(/[^0-9]/g, ""));
            if (max === 0) {
                return { maxHp: 0, tempHp: 0 };
            } else {
                return { maxHp: max, tempHp: Number(parts[1].replace(/[^0-9]/g, "")) };
            }
        } else if (input.indexOf("-") > 0) {
            const parts = input.split("-");
            const max = Number(parts[0].replace(/[^0-9]/g, ""));
            if (max === 0) {
                return { maxHp: 0, tempHp: 0 };
            } else {
                return { maxHp: max, tempHp: Number(parts[1].replace(/[^0-9]/g, "")) };
            }
        } else {
            return { maxHp: Number(input.replace(/[^0-9]/g, "")), tempHp: 0 };
        }
    };

    const maxHpOutput = (max: number, temp: number | undefined) => {
        return temp && temp !== 0 ? `${max} ${temp > 0 ? "+" : "-"} ${Math.abs(temp)}` : max.toString();
    };

    return display() ? (
        <div
            className={`player-wrapper ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            }`}
            style={{ background: `linear-gradient(to right, ${getBgColor()}, #1C1B22 50%, #1C1B22 )` }}
        >
            {props.popover ? null : (
                <div className={"player-name"}>
                    {editName ? (
                        <input
                            className={"edit-name"}
                            type={"text"}
                            value={data.name}
                            onChange={(e) => {
                                handleValueChange(e.target.value, "name");
                            }}
                        />
                    ) : (
                        <div
                            className={"name"}
                            onClick={(e) => {
                                handleOnPlayerClick(e);
                            }}
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                handleOnPlayerDoubleClick();
                            }}
                        >
                            {props.data.name}
                        </div>
                    )}
                    <button
                        title={"Change entry name"}
                        className={`edit ${editName ? "on" : "off"}`}
                        onClick={() => setEditName(!editName)}
                    ></button>
                </div>
            )}
            {playerContext.role === "GM" ? (
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Bar visibility for GM and Players"}
                        className={`toggle-button hp ${data.hpBar ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.hpBar, "hpBar");
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${data.hpOnMap ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.hpOnMap, "hpOnMap");
                        }}
                    />
                    <button
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${data.acOnMap ? "on" : "off"}`}
                        onClick={async () => {
                            handleValueChange(!data.acOnMap, "acOnMap");
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
                        className={`toggle-button players ${data.canPlayersSee ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.canPlayersSee, "players");
                        }}
                    />{" "}
                </div>
            ) : null}
            <div className={"current-hp"}>
                <input
                    ref={hpRef}
                    type={"text"}
                    size={3}
                    defaultValue={data.hp}
                    onBlur={(e) => {
                        const input = e.target.value;
                        const hp = getNewHpValue(input);
                        if (hp !== null) {
                            e.target.value = hp.toString();
                            handleValueChange(hp, "hp");
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            const hp = Math.min(
                                data.hp + 1,
                                data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                            );
                            handleValueChange(hp, "hp");
                            e.currentTarget.value = hp.toString();
                        } else if (e.key === "ArrowDown") {
                            const hp = Math.min(
                                data.hp - 1,
                                data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                            );
                            handleValueChange(hp, "hp");
                            e.currentTarget.value = hp.toString();
                        } else if (e.key === "Enter") {
                            const input = e.currentTarget.value;
                            const hp = getNewHpValue(input);
                            if (hp !== null) {
                                e.currentTarget.value = hp.toString();
                                handleValueChange(hp, "hp");
                            }
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    ref={maxHpRef}
                    defaultValue={maxHpOutput(data.maxHp, data.stats.tempHp)}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.maxHp + 1, "maxHP");
                            e.currentTarget.value = maxHpOutput(data.maxHp + 1, data.stats.tempHp);
                        } else if (e.key === "ArrowDown") {
                            if (data.stats.tempHp && data.stats.tempHp > 0) {
                                handleValueChange(maxHpOutput(data.maxHp, data.stats.tempHp - 1), "tempHP");
                                e.currentTarget.value = maxHpOutput(data.maxHp, data.stats.tempHp - 1);
                            } else {
                                handleValueChange(data.maxHp - 1, "maxHP");
                                e.currentTarget.value = maxHpOutput(data.maxHp - 1, data.stats.tempHp);
                            }
                        } else if (e.key === "Enter") {
                            const value = getTempHp(e.currentTarget.value);
                            handleValueChange(Number(value.maxHp), "maxHP");
                            handleValueChange(e.currentTarget.value, "tempHP");
                            e.currentTarget.value = maxHpOutput(value.maxHp, value.tempHp);
                        }
                    }}
                    onBlur={(e) => {
                        const value = getTempHp(e.target.value);
                        handleValueChange(Number(value.maxHp), "maxHP");
                        handleValueChange(e.target.value, "tempHP");
                        e.currentTarget.value = maxHpOutput(value.maxHp, value.tempHp);
                    }}
                />
            </div>
            <div className={"armor-class"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.armorClass}
                    onChange={(e) => {
                        let factor = 1;
                        if (allowNegativNumbers) {
                            factor = e.target.value.startsWith("-") ? -1 : 1;
                        }
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(value * factor, "armorClass");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.armorClass + 1, "armorClass");
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(data.armorClass - 1, "armorClass");
                        }
                    }}
                />
            </div>
            <div className={"initiative-wrapper"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.initiative}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(value, "initiative");
                    }}
                    className={"initiative"}
                />
                <button
                    title={"Roll Initiative (including DEX modifier from statblock)"}
                    className={`toggle-button initiative-button`}
                    onClick={() => {
                        handleValueChange(
                            Math.floor(Math.random() * 20) + 1 + data.stats.initiativeBonus,
                            "initiative"
                        );
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
    ) : props.data.hpBar && props.item.visible ? (
        <div
            className={"player-wrapper player"}
            style={{ background: `linear-gradient(to right, ${getBgColor()}, #242424 50%, #242424 )` }}
        >
            <div className={"player-name"}>
                <div
                    className={"name"}
                    onMouseDown={handleOnPlayerClick}
                    onMouseUp={handleOnPlayerClick}
                    onMouseLeave={handleOnPlayerClick}
                >
                    {props.data.name}
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
};
