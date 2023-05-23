import { Shape, NodeTypeOptions } from "features/boards/board";
import * as b from "./buildings";
import { Building, BuildingType } from "./data";

const buildings = b as { [key: string]: BuildingType };

export const loop = {
    shape: Shape.Circle,
    size: 50,
    title: "",
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
        "generator": Shape.Square,
    }[buildings[((node.state as { target: Building }).target.type as string)]?.class]),
    size: 30,
    title: node => buildings[((node.state as { target: Building }).target.type as string)]?.icon,
    fillColor: node => buildings[((node.state as { target: Building }).target.type as string)]?.color,
    classes: { building: true },
} as NodeTypeOptions;