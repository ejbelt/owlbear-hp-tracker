import { createShape, createText, getAttachedItems, localItemsCache } from "./helpers.ts";
import { characterMetadata, infoMetadata, sceneMetadata } from "./variables.ts";
import OBR, { Item, Text, Shape, Metadata } from "@owlbear-rodeo/sdk";
import { Changes, HpTrackerMetadata, SceneMetadata, ShapeItemChanges, TextItemChanges } from "./types.ts";

export const saveOrChangeShape = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    const bounds = await OBR.scene.items.getItemBounds([character.id]);
    const width = bounds.width;
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            const shape = attachment as Shape;
            if (attachment.name === "hp" && infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                const percentage = data.maxHp === 0 || data.hp === 0 ? 0 : data.hp / data.maxHp;
                if (percentage === 0) {
                    change.color = "black";
                } else {
                    change.color = "red";
                }
                change.width = percentage === 0 ? 0 : (width - 4) * percentage;
                if (shape.width != change.width || shape.style.fillColor != change.color) {
                    changeMap.set(attachment.id, change);
                }
            } else if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (shape.width != width) {
                    change.width = width;
                    changeMap.set(attachment.id, change);
                }
            }
        });
    } else {
        const percentage = data.hp === 0 && data.maxHp === 0 ? 0 : data.hp / data.maxHp;
        const shapes = await createShape(percentage, character.id);
        if (shapes) {
            await OBR.scene.local.addItems(shapes);
            localItemsCache.invalid = true;
        }
    }
};

export const saveOrChangeText = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};

                const text =
                    (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
                    (data.hpOnMap && data.acOnMap ? " " : "") +
                    (data.acOnMap ? `AC:${data.armorClass}` : "");
                change.text = text;
                changeMap.set(attachment.id, change);
            }
        });
    } else {
        const textContent =
            (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
            (data.hpOnMap && data.acOnMap ? " " : "") +
            (data.acOnMap ? `AC:${data.armorClass}` : "");
        const text = await createText(textContent, character.id ?? "");
        if (text) {
            await OBR.scene.local.addItems([text]);
            localItemsCache.invalid = true;
        }
    }
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await OBR.scene.local.deleteItems(attachments.map((attachment) => attachment.id));
        localItemsCache.invalid = true;
    }
};

export const handleOtherTextChanges = async (
    character: Item,
    attachments: Text[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        const bounds = await OBR.scene.items.getItemBounds([character.id]);
        const height = bounds.height / 2;
        let offset = (((await OBR.scene.getMetadata()) as Metadata)[sceneMetadata] as SceneMetadata).hpBarOffset ?? 0;
        const offsetFactor = bounds.height / 150;
        offset *= offsetFactor;
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (character.visible !== attachment.visible) {
                    change.visible = character.visible;
                }
                if (
                    character.position.x - Number(attachment.text.width) / 2 != attachment.position.x ||
                    character.position.y + height - 47 + offset != attachment.position.y
                ) {
                    change.position = {
                        x: character.position.x - Number(attachment.text.width) / 2,
                        y: character.position.y + height - 47 + offset,
                    };
                }
                changeMap.set(attachment.id, change);
            }
        });
    }
};

export const handleOtherShapeChanges = async (
    character: Item,
    attachments: Shape[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    const bounds = await OBR.scene.items.getItemBounds([character.id]);
    const width = bounds.width;
    const height = bounds.height / 2;
    let offset = (((await OBR.scene.getMetadata()) as Metadata)[sceneMetadata] as SceneMetadata).hpBarOffset ?? 0;
    const offsetFactor = bounds.height / 150;
    offset *= offsetFactor;
    const barHeight = 31;
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (character.visible !== attachment.visible) {
                    change.visible = character.visible;
                }
                if (attachment.name === "hp") {
                    if (
                        character.position.x - width / 2 + 2 != attachment.position.x ||
                        character.position.y + height - barHeight + 2 + offset != attachment.position.y
                    ) {
                        change.position = {
                            x: character.position.x - width / 2 + 2,
                            y: character.position.y + height - barHeight + 2 + offset,
                        };
                    }
                } else {
                    if (
                        character.position.x - width / 2 != attachment.position.x ||
                        character.position.y + height - barHeight + offset != attachment.position.y
                    ) {
                        change.position = {
                            x: character.position.x - width / 2,
                            y: character.position.y + height - barHeight + offset,
                        };
                    }
                }
                changeMap.set(attachment.id, change);
            }
        });
    }
};

export const prepareDisplayChanges = async (characters: Item[], role: "GM" | "PLAYER") => {
    const changes: Changes = {
        textItems: new Map<string, TextItemChanges>(),
        shapeItems: new Map<string, ShapeItemChanges>(),
    };
    for (const character of characters) {
        if (characterMetadata in character.metadata) {
            const textAttachments = await getAttachedItems(character.id, "TEXT");
            const shapeAttachments = await getAttachedItems(character.id, "SHAPE");
            const data = character.metadata[characterMetadata] as HpTrackerMetadata;

            if (!data.hpTrackerActive) {
                await deleteAttachments(textAttachments.concat(shapeAttachments));
            } else {
                if ((!data.hpOnMap && !data.acOnMap) || (role === "PLAYER" && !data.canPlayersSee)) {
                    await deleteAttachments(textAttachments);
                } else {
                    await saveOrChangeText(character, data, textAttachments, changes.textItems);
                    await handleOtherTextChanges(character, textAttachments as Array<Text>, changes.textItems);
                }

                if (!data.hpBar) {
                    await deleteAttachments(shapeAttachments);
                } else {
                    await saveOrChangeShape(character, data, shapeAttachments, changes.shapeItems);
                    await handleOtherShapeChanges(character, shapeAttachments as Array<Shape>, changes.shapeItems);
                }
            }
        }
    }
    return changes;
};
