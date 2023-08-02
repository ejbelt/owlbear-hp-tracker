import OBR, { isShape, isText, Item, Metadata } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata, sceneMetadata } from "../helper/variables.ts";
import { prepareDisplayChanges } from "../helper/infoHelpers.ts";
import { migrate102To103 } from "../migrations/v103.ts";
import { migrate105To106 } from "../migrations/v106.ts";
import { compare } from "compare-versions";
import { HpTrackerMetadata, SceneMetadata } from "../helper/types.ts";

const version = "1.1.0";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const addMetaData = (items: Item[]) => {
        items.forEach((item) => {
            if (!(characterMetadata in item.metadata)) {
                // initializing a variable gives us type safety
                const initialMetadata: HpTrackerMetadata = {
                    name: "",
                    hp: 0,
                    maxHp: 0,
                    armorClass: 0,
                    hpTrackerActive: false,
                    canPlayersSee: false,
                    hpOnMap: false,
                    acOnMap: false,
                    hpBar: false,
                    initiative: 0,
                    sheet: "",
                };
                item.metadata[characterMetadata] = initialMetadata;
            }
        });
    };

    await OBR.scene.items.updateItems((item) => item.layer === "CHARACTER", addMetaData);
};

/**
 * The Texts that display the current HP of a Character Item must be updated anytime the metadata of the Character Items
 * is changed.
 *
 */
const initLocalItems = async () => {
    const role = await OBR.player.getRole();

    const updateScene = async (items: Item[]) => {
        const characters = items.filter((item) => item.layer === "CHARACTER");
        const changes = await prepareDisplayChanges(characters, role);

        if (changes.textItems.size > 0) {
            await OBR.scene.local.updateItems(isText, (texts) => {
                texts.forEach((text) => {
                    if (changes.textItems.has(text.id)) {
                        const change = changes.textItems.get(text.id);
                        if (change) {
                            if (change.text) {
                                text.text.plainText = change.text;
                            }
                            if (change.visible !== undefined) {
                                text.visible = change.visible;
                            }
                            if (change.position) {
                                text.position = change.position;
                            }
                        }
                    }
                });
            });
        }
        if (changes.shapeItems.size > 0) {
            await OBR.scene.local.updateItems(isShape, (shapes) => {
                shapes.forEach((shape) => {
                    if (changes.shapeItems.has(shape.id)) {
                        const change = changes.shapeItems.get(shape.id);
                        if (change) {
                            if (change.width) {
                                shape.width = change.width;
                            }
                            if (change.visible !== undefined) {
                                shape.visible = change.visible;
                            }
                            if (change.position) {
                                shape.position = change.position;
                            }
                            if (change.color) {
                                shape.style.fillColor = change.color;
                            }
                        }
                    }
                });
            });
        }
    };

    const sceneItems = await OBR.scene.items.getItems(
        (item) => item.layer === "CHARACTER" && characterMetadata in item.metadata
    );
    await updateScene(sceneItems);

    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        // But we only care about Character Items
        await updateScene(items);
    });
};

const initScene = async () => {
    const metadata: Metadata = await OBR.scene.getMetadata();
    metadata[sceneMetadata] = { version: version };
    await OBR.scene.setMetadata(metadata);
};

const setupContextMenu = async () => {
    await OBR.contextMenu.create({
        id: `${ID}/plus`,
        icons: [
            {
                icon: "/plus.svg",
                label: "Increase HP",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        {
                            key: ["metadata", `${characterMetadata}`, "hpTrackerActive"],
                            value: true,
                        },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            OBR.scene.items.updateItems(context.items, (items) => {
                items.forEach((item) => {
                    if (characterMetadata in item.metadata) {
                        const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                        metadata.hp = Math.min(metadata.hp + 1, metadata.maxHp);
                        item.metadata[characterMetadata] = { ...metadata };
                    }
                });
            });
        },
    });
    await OBR.contextMenu.create({
        id: `${ID}/minus`,
        icons: [
            {
                icon: "/minus.svg",
                label: "Decrease HP",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        {
                            key: ["metadata", `${characterMetadata}`, "hpTrackerActive"],
                            value: true,
                        },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context) => {
            OBR.scene.items.updateItems(context.items, (items) => {
                items.forEach((item) => {
                    if (characterMetadata in item.metadata) {
                        const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                        metadata.hp = Math.max(metadata.hp - 1, 0);
                        item.metadata[characterMetadata] = { ...metadata };
                    }
                });
            });
        },
    });
    await OBR.contextMenu.create({
        id: `${ID}/tool`,
        icons: [
            {
                icon: "/icon.svg",
                label: "HP Tracker",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", `${characterMetadata}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${characterMetadata}`, "hpTrackerActive"],
                            value: false,
                            coordinator: "||",
                        },
                    ],
                    roles: ["GM"],
                },
            },
            {
                icon: "/iconOff.svg",
                label: "HP Tracker",
                filter: {
                    every: [{ key: "layer", value: "CHARACTER" }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context) => {
            const initTokens = async () => {
                OBR.scene.items.updateItems(context.items, (items) => {
                    items.forEach((item) => {
                        if (characterMetadata in item.metadata) {
                            const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                            metadata.hpTrackerActive = !metadata.hpTrackerActive;
                            item.metadata[characterMetadata] = metadata;
                        } else {
                            // variable allows us to be typesafe
                            const defaultMetadata: HpTrackerMetadata = {
                                name: item.name,
                                hp: 0,
                                maxHp: 0,
                                armorClass: 0,
                                hpTrackerActive: true,
                                canPlayersSee: false,
                                hpOnMap: false,
                                acOnMap: false,
                                hpBar: false,
                                initiative: 0,
                                sheet: "",
                            };
                            item.metadata[characterMetadata] = defaultMetadata;
                        }
                    });
                });
            };
            initTokens();
        },
    });
};

const migrations = async () => {
    const metadata = await OBR.scene.getMetadata();
    if (sceneMetadata in metadata) {
        const data: SceneMetadata = metadata[sceneMetadata] as SceneMetadata;
        if (compare(data.version, "1.0.3", "<")) {
            await migrate102To103();
        }
        if (compare(data.version, "1.0.6", "<")) {
            await migrate105To106();
        }
    }
};

const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const initLocalLoop = async () => {
    let initialized = false;
    while (!initialized) {
        try {
            await initLocalItems();
            initialized = true;
        } catch (e) {
            console.log(e);
            await delay(1000);
        }
    }
};

OBR.onReady(async () => {
    console.log(`HP Tracker version ${version} initializing`);
    await setupContextMenu();
    try {
        await initLocalLoop();
    } catch {}
    await OBR.scene.onReadyChange(async (isReady) => {
        console.log(isReady);
        if (isReady) {
            await migrations();
            await initItems();
            await initScene();
        }
    });
});
