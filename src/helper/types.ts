export type HpTrackerMetadata = {
    name: string;
    hp: number;
    temp_hp: number;
    maxHp: number;
    armorClass: number;
    armorClassSpecial: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    index: number;
};

export type HpTextMetadata = {
    isHpText: boolean;
};

export type TextItemChanges = {
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type Changes = {
    textItems: Map<string, TextItemChanges>;
};
