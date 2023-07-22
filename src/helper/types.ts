export type HpTrackerMetadata = {
    name: string;
    hp: number;
    maxHp: number;
    armorClass: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpBar: boolean;
};

export type HpTextMetadata = {
    isHpText: boolean;
};

export type SceneMetadata = {
    version: string;
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

export type Changes = {
    textItems: Map<string, TextItemChanges>;
    shapeItems: Map<string, ShapeItemChanges>;
};
