export type HpTrackerMetadata = {
    name: string;
    hp: number;
    maxHp: number;
    hp2: number;
    maxHp2: number;
    armorClass: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpBar: boolean;
    initiative: number;
    sheet: string;
    index?: number;
};

export type HpTextMetadata = {
    isHpText: boolean;
};

export type SceneMetadata = {
    version: string;
    allowNegativeNumbers?: boolean;
    hpBarSegments?: number;
    hpBarOffset?: number;
    activeTokens: [];
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
