import { Shape } from "features/boards/board";
import { BoardConnections, BoardID, BuildingType } from "./data";

export const beamer = {
    name: "Beamer",
    icon: "💠", color: "#afcfef", class: "damager",
    description: "Beams one random enemy on the loop it's on once every a certain amount of time.",
    baseCost: { energy: 100, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 10 + 2 * x, 
            cost: (x) => ({ energy: 50 * 1.2 ** x }),
            unit: "/hit",
        },
        interval: { 
            name: "Interval", max: 15,
            effect: (x) => 2 * .9 ** x, 
            cost: (x) => ({ energy: 50 * 1.3 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        if (loop.enemies.length) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            if (self.data.prg >= 1) {
                let enm = loop.enemies[Math.floor(Math.random() * loop.enemies.length)];
                enm.health -= this.upgrades.damage.effect(self.upgrades.damage ?? 0);
                if (!enm[BoardConnections]) enm[BoardConnections] = {};
                enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                self.data.prg--;
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const plasma = {
    name: "Plasma",
    icon: "🔺", color: "#efbfbf", class: "damager",
    description: "Deal damage per second to all enemies on the loop it's on.",
    baseCost: { energy: 400, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 3 + x, 
            cost: (x) => ({ energy: 200 * 1.2 ** x }), 
            unit: "/s",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.damage.effect(self.upgrades.damage ?? 0);
        for (let enm of loop.enemies) {
            enm.health -= dam * delta;
            if (!enm[BoardConnections]) enm[BoardConnections] = {};
            enm[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const freezer = {
    name: "Freezer",
    icon: "❄️", color: "#afcfef", class: "effector",
    description: "Slows down enemies when they move to the next loop. Does not deal any damage to enemies.",
    baseCost: { energy: 500, },
    upgrades: {
        duration: { 
            name: "Duration", 
            effect: (x) => 2 + 0.4 * x, 
            cost: (x) => ({ energy: 300 * 1.4 ** x }), 
            precision: 1, unit: "rad",
        },
    },
    onEnemyExit(self, loop, enemy) {
        enemy.effects.freeze = this.upgrades.duration.effect(self.upgrades.duration ?? 0);
    },
} as BuildingType;

export const energizer = {
    name: "Energizer",
    icon: "⚡", color: "#efefaf", class: "generator",
    description: "Infuse enemies with Energy while they are on the loop it's on, resulting in them dropping more Energy when defeated.",
    baseCost: { energy: 200, },
    upgrades: {
        amount: { 
            name: "Amount", 
            effect: (x) => 4 + x * (x + 1), 
            cost: (x) => ({ energy: 400 * 3 ** x }), 
            unit: "/s",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.amount.effect(self.upgrades.amount ?? 0);
        for (let enm of loop.enemies) {
            enm.loot.energy = (enm.loot.energy ?? 0) + (dam * delta);
            if (!enm[BoardConnections]) enm[BoardConnections] = {};
            enm[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;