import { Shape, NodeTypeOptions, ProgressDisplay } from "features/boards/board";
import * as b from "./buildings";
import { Building, BuildingType, Loop } from "./data";
import settings from "game/settings";
import { formatWhole } from "util/break_eternity";

const buildings = b as { [key: string]: BuildingType };

export const loop = {
    shape: Shape.Circle,
    size: 50,
    title: (node) => { 
        let count = (node.state as { target: Loop }).target.enemies.length;
        return settings.quality < 1 && count > 0 ? formatWhole(count) : "";
    },
    classes: { loop: true },
} as NodeTypeOptions;

export const enemy = {
    shape: Shape.Circle,
    size: 8,
    title: "",
    classes: { enemy: true },
} as NodeTypeOptions;

export const building = {
    shape: node => ({
        "damager": Shape.Circle,
        "effector": Shape.Diamond,
        "influencer": Shape.Squircle,
        "generator": Shape.Square,
    }[buildings[((node.state as { target: Building }).target.type as string)]?.class]),
    size: 30,
    title: node => buildings[((node.state as { target: Building }).target.type as string)]?.icon,
    fillColor: node => buildings[((node.state as { target: Building }).target.type as string)]?.color,
    progress: node => {
        let bd = (node.state as { target: Building }).target;
        return buildings[bd.type].progress?.(bd) ?? 0;
    },
    progressColor: "var(--foreground)",
    progressDisplay: ProgressDisplay.Outline,
    classes: { building: true },
} as NodeTypeOptions;