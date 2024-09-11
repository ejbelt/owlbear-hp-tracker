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
    stats: {
        initiativeBonus: number;
    };
    ruleset?: Ruleset;
    index: number;
    initiative: number;
};

export type SceneMetadata = {
    version: string;
    id: string;
    allowNegativeNumbers?: boolean;
    hpBarSegments?: number;
    hpBarOffset?: number;
    acOffset?: { x: number; y: number };
    acShield?: boolean;
    ruleset?: Ruleset;
    groups?: Array<string>;
    openChangeLog?: boolean;
    playerSort: boolean;
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
