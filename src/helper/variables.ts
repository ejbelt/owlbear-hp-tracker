import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";

export const ID = "com.bitperfect-software.hp-tracker";
export const characterMetadata = `${ID}/data`;
export const textMetadata = `${ID}/text`;
export const sceneMetadata = `${ID}/metadata`;

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
    fullScreen: true,
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
    fullScreen: true,
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
    width: 500,
    height: 600,
};