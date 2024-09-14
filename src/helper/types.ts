export type HpTrackerMetadata = {
    name: string;
    hp: number;
    maxHp: number;
    tempHp: number;
    armorClass: number;
    armorClassSpecial: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpBar: boolean;
    sheet: string;
    index?: number;
    group?: string;
};

export type HpTextMetadata = {
    isHpText: boolean;
};

export type SceneMetadata = {
    version: string;
    id: string;
    allowNegativeNumbers?: boolean;
    hpBarSegments?: number;
    hpBarOffset?: number;
    groups?: Array<string>;
    openChangeLog?: boolean;
};

export type TextItemChanges = {
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type ShapeItemChanges = {
    color?: string;
    width?: number;
    visible?: boolean;
    position?: { x: number; y: number };
};
