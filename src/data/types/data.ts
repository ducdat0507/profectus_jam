import { Shape } from "features/boards/board";
import { CoercableComponent } from "features/feature";
import { NonPersistent, State } from "game/persistence";

export const BoardID = Symbol("BoardID");
export const BoardConnections = Symbol("BoardConnections");

export type Loop = {
    building?: Building;
    enemies: Enemy[];
    [BoardID]?: number;
}

export type Building = {
    type: string;
    upgrades: { [key: string]: number };
    data: { [key: string]: State };
    [BoardID]?: number;
}

export type Enemy = {
    angle: number,
    lifetime: number,
    speed: number,
    health: number,
    maxHealth: number,
    effects: { [key: string]: number };
    loot: { [key: string]: number };
    [BoardID]?: number;
    [BoardConnections]?: { [key: number]: number };
}

export type BuildingType = {
    name: string;
    icon: string;
    color: string;
    class: BuildingClass;
    description: CoercableComponent;
    baseCost: { [key: string]: number };
    upgrades: { [key: string]: BuildingUpgrade };

    onUpdate?: (self: Building, loop: Loop, delta: number) => void;
    onEnemyEnter?: (self: Building, loop: Loop, enemy: Enemy) => void;
    onEnemyExit?: (self: Building, loop: Loop, enemy: Enemy) => void;
}

export type BuildingUpgrade = {
    name: string;
    effect: (level: number) => number;
    cost: (level: number) => { [key: string]: number };
    max?: number;
    precision?: number;
    unit?: string;
}

export type BuildingClass = 
    "damager" |
    "effector" |
    "generator"