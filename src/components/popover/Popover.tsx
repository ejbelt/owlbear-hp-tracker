import React, { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import "./popover.scss";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";

export const Popover = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();

    return playerContext.role ? playerContext.role === "PLAYER" ? <></> : <Layer /> : <h1>Waiting for OBR startup</h1>;
};

const Layer = () => {
    const id = new URLSearchParams(window.location.search).get("id") ?? null;
    const [hp, setHp] = useState<number>(0);
    const [maxHp, setMaxHp] = useState<number>(0);
    const [temp_hp, setTempHp] = useState<number>(0);
    const [armorClass, setArmorClass] = useState<number>(0);
    const [armorClassSpecial, setArmorClassSpecial] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [hpTrackerActive, setHpTrackerActive] = useState<boolean>(false);
    const [canPlayersSee, setCanPlayersSee] = useState<boolean>(false);
    const [hpOnMap, setHpOnMap] = useState<boolean>(false);
    const [index, setIndex] = useState<number>(0);
    const [initiative, setInitiative] = useState<number>(0);

    useEffect(() => {
        if (id) {
            OBR.scene.items.updateItems([id], (items) => {
                items.forEach((item) => {
                    const data = {
                        name: name,
                        maxHp: maxHp,
                        hp: hp,
                        temp_hp: temp_hp,
                        armorClass: armorClass,
                        armorClassSpecial: armorClassSpecial,
                        hpTrackerActive: hpTrackerActive,
                        canPlayersSee: canPlayersSee,
                        hpOnMap: hpOnMap,
                        index: index,
                        initiative: initiative
                    };
                    item.metadata[characterMetadata] = {
                        ...data,
                    };
                });
            });
        }
    }, [hp, maxHp, name, hpTrackerActive, canPlayersSee, hpOnMap, armorClass, armorClassSpecial, initiative]);

    useEffect(() => {
        if (id) {
            const initTokens = async () => {
                const items = await OBR.scene.items.getItems([id]);
                if (items.length > 0) {
                    const item = items[0];
                    let data: HpTrackerMetadata = {
                        name: item.name,
                        hp: 0,
                        maxHp: 0,
                        temp_hp: 0,
                        armorClass: 0,
                        armorClassSpecial: 0,
                        hpTrackerActive: false,
                        canPlayersSee: false,
                        hpOnMap: false,
                        initiative: 0,
                        stats: {
                            initiativeBonus: 0
                        }
                    };
                    if (characterMetadata in item.metadata) {
                        data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    }
                    setName(data.name !== "" ? data.name : item.name);
                    setHp(data.hp ?? 0);
                    setTempHp(data.temp_hp ?? 0);
                    setArmorClass(data.armorClass ?? 0);
                    setArmorClassSpecial(data.armorClassSpecial ?? 0);
                    setMaxHp(data.maxHp ?? 0);
                    setHpTrackerActive(data.hpTrackerActive ?? false);
                    setCanPlayersSee(data.canPlayersSee ?? false);
                    setHpOnMap(data.hpOnMap ?? false);
                    setIndex(data.index ?? 0);
                    setInitiative(data.initiative ?? 0)
                }
            };
            initTokens();
        }
    }, []);

    return (
        <div className={"popover-wrapper"}>
            <label>
                Name:
                <input
                    type={"text"}
                    value={name}
                    placeholder="Smitty Werbenjagermanjensen"
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                />
            </label>
            <label>
                Max HP:
                <input
                    type={"number"}
                    value={maxHp}
                    min={0}
                    placeholder="0"
                    onChange={(e) => {
                        setMaxHp(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                HP:
                <input
                    type={"number"}
                    value={hp}
                    max={maxHp}
                    min={0}
                    placeholder="0"
                    onChange={(e) => {
                        setHp(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                ACP:
                <input
                    type={"number"}
                    value={armorClass}
                    min={0}
                    placeholder="0"
                    onChange={(e) => {
                        setArmorClass(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                ACS:
                <input
                    type={"number"}
                    value={armorClassSpecial}
                    min={0}
                    placeholder="0"
                    onChange={(e) => {
                        setArmorClassSpecial(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                Active:
                <input
                    type={"checkbox"}
                    value={String(hpTrackerActive)}
                    checked={hpTrackerActive}
                    onChange={() => {
                        setHpTrackerActive(!hpTrackerActive);
                    }}
                />
            </label>
            <label>
                Visible for Players:
                <input
                    type={"checkbox"}
                    value={String(canPlayersSee)}
                    checked={canPlayersSee}
                    onChange={() => {
                        setCanPlayersSee(!canPlayersSee);
                    }}
                />
            </label>
            <label>
                Add to Map:
                <input
                    type={"checkbox"}
                    value={String(hpOnMap)}
                    checked={hpOnMap}
                    onChange={(event) => {
                        setHpOnMap(event.target.checked);
                    }}
                />
            </label>
        </div>
    );
};
