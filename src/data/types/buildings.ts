import { Shape } from "features/boards/board";
import { BoardConnections, BoardID, BuildingType, Enemy } from "./data";
import { dealDamage } from "./buildingHelper";
import gameLayer from "data/layers/game";

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
                dealDamage(enm, this.upgrades.damage.effect(self.upgrades.damage ?? 0));
                if (!enm[BoardConnections]) enm[BoardConnections] = {};
                enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                self.data.prg--;
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const splatter = {
    name: "Splatter",
    icon: "🔹", color: "#afcfef", class: "damager",
    description: "Splats one random enemy on the loop it's on at a very fast speed.",
    baseCost: { energy: 150, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 2 + 1 * x, 
            cost: (x) => ({ energy: 50 * 1.3 ** x }),
            unit: "/hit",
        },
        interval: { 
            name: "Interval", max: 5,
            effect: (x) => 0.5 * .8 ** x, 
            cost: (x) => ({ energy: 100 * 2 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        if (loop.enemies.length) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            if (self.data.prg >= 1) {
                let enm = loop.enemies[Math.floor(Math.random() * loop.enemies.length)];
                dealDamage(enm, this.upgrades.damage.effect(self.upgrades.damage ?? 0));
                if (!enm[BoardConnections]) enm[BoardConnections] = {};
                enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                self.data.prg--;
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const blaster = {
    name: "Blaster",
    icon: "🔷", color: "#afcfef", class: "damager",
    description: "Blasts one random enemy on the loop it's on once every a certain amount of time. Takes a while to charge but its damage is scaled to the time since the last blast.",
    baseCost: { energy: 200, },
    upgrades: {
        damage: { 
            name: "Base Damage", 
            effect: (x) => 20 + 4 * x, 
            cost: (x) => ({ energy: 100 * 1.2 ** x }),
            unit: "/hit",
        },
        damage2: { 
            name: "Time Factor", 
            effect: (x) => 1 + x, 
            cost: (x) => ({ energy: 200 * 1.5 ** x }),
            unit: "x",
        },
        interval: { 
            name: "Interval", max: 10,
            effect: (x) => 5 * .9 ** x, 
            cost: (x) => ({ energy: 100 * 1.3 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        if (loop.enemies.length) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            self.data.time = ((self.data.time ?? 0) as number) + delta;
            if (self.data.prg >= 1) {
                let enm = loop.enemies[Math.floor(Math.random() * loop.enemies.length)];
                let dam = this.upgrades.damage.effect(self.upgrades.damage ?? 0) + 
                    Math.log(self.data.time + 1) * this.upgrades.damage2.effect(self.upgrades.damage2 ?? 0);
                dealDamage(enm, dam);
                if (!enm[BoardConnections]) enm[BoardConnections] = {};
                enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                self.data.prg--;
                self.data.time = 0;
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const hourglass = {
    name: "Hourglass",
    icon: "⏳", color: "#afcfef", class: "damager",
    description: "A beamer whose damage is scaled based on time since it was placed. You can not upgrade the damage, only the interval.",
    baseCost: { energy: 200, },
    upgrades: {
        interval: { 
            name: "Interval", max: 15,
            effect: (x) => 2 * .9 ** x, 
            cost: (x) => ({ energy: 100 * 1.3 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        if (loop.enemies.length) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            self.data.time = ((self.data.time ?? 0) as number) + delta;
            if (self.data.prg >= 1) {
                let enm = loop.enemies[Math.floor(Math.random() * loop.enemies.length)];
                let dam = 10 + 2 * Math.sqrt(self.data.time + 1);
                dealDamage(enm, dam);
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
    icon: "⚪", color: "#efbfbf", class: "damager",
    description: "Deal damage per second to all enemies on the loop it's on.",
    baseCost: { energy: 300, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 8 + 2 * x, 
            cost: (x) => ({ energy: 200 * 1.2 ** x }), 
            unit: "/s",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.damage.effect(self.upgrades.damage ?? 0);
        for (let enm of loop.enemies) {
            dealDamage(enm, dam * delta);
            if (!enm[BoardConnections]) enm[BoardConnections] = {};
            enm[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const bomber = {
    name: "Bomber",
    icon: "💣", color: "#efbfbf", class: "damager",
    description: "Deal damage to all enemies on the loop it's on every once in a while.",
    baseCost: { energy: 400, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 18 + 3 * x, 
            cost: (x) => ({ energy: 200 * 1.2 ** x }), 
            unit: "/hit",
        },
        interval: { 
            name: "Interval", max: 15,
            effect: (x) => 2.5 * .9 ** x, 
            cost: (x) => ({ energy: 300 * 1.3 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        if (loop.enemies.length) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            if (self.data.prg >= 1) {
                let dam = this.upgrades.damage.effect(self.upgrades.damage ?? 0);
                for (let enm of loop.enemies) {
                    dealDamage(enm, dam);
                    if (!enm[BoardConnections]) enm[BoardConnections] = {};
                    enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                }
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const thunder = {
    name: "Thunder",
    icon: "🌩️", color: "#efefaf", class: "damager",
    description: "Deals huge damage to enemies at a very fast speed, but requires an amount of Energy equal to its damage. Attacks of this building also make enemies lose all their Energy drop.",
    baseCost: { energy: 500, },
    upgrades: {
        damage: { 
            name: "Damage", 
            effect: (x) => 20 + 4 * x, 
            cost: (x) => ({ energy: 250 * 1.3 ** x }),
            unit: "/hit",
        },
        interval: { 
            name: "Interval", max: 5,
            effect: (x) => 0.5 * .8 ** x, 
            cost: (x) => ({ energy: 400 * 2 ** x }), 
            precision: 2, unit: "s",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.damage.effect(self.upgrades.damage ?? 0);
        if (loop.enemies.length && gameLayer.resources.energy.value >= dam) {
            self.data.prg = ((self.data.prg ?? 0) as number) + delta / this.upgrades.interval.effect(self.upgrades.interval ?? 0);
            if (self.data.prg >= 1) {
                let enm = loop.enemies[Math.floor(Math.random() * loop.enemies.length)];
                dealDamage(enm, dam);
                if (!enm[BoardConnections]) enm[BoardConnections] = {};
                enm[BoardConnections][loop[BoardID] ?? 0] = 0;
                self.data.prg--;
                gameLayer.resources.energy.value -= dam;
                enm.loot.energy = 0;
            }
        } else {
            self.data.prg = 0;
        }
    },
} as BuildingType;

export const pins = {
    name: "Pins",
    icon: "📍", color: "#afafaf", class: "damager",
    description: "Deals a flat 20 damage to an enemy when one enters the loop it's on. Only has 20 uses before it vanishes. This building is not sellable and will not reverse its cost scaling when vanished.",
    baseCost: { energy: 75, },
    upgrades: {},
    onEnemyEnter(self, loop, enemy) {
        dealDamage(enemy, 20);
        self.data.uses = (self.data.uses as number ?? 0) + 1;
        if (self.data.uses >= 20) delete loop.building;
        if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
        enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
    },
} as BuildingType;

export const freezer = {
    name: "Freezer",
    icon: "❄️", color: "#afcfef", class: "effector",
    description: "Apply the \"Freezing\" effect to enemies when one moves out of the loop it's on. Freezed enemies' speed are halved. If the enemy has the \"Blazing\" effect, removes it.",
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
        if (!enemy.effects.duality) delete enemy.effects.blaze;
        enemy.effects.freeze = this.upgrades.duration.effect(self.upgrades.duration ?? 0);
        if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
        enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
    },
} as BuildingType;

export const igniter = {
    name: "Igniter",
    icon: "🔥", color: "#efafaf", class: "effector",
    description: "Apply the \"Blazing\" effect to enemies when one moves in to the loop it's on. Blazed enemies move twice as fast but receive four times the damage. If the enemy has the \"Freezing\" effect, removes it.",
    baseCost: { energy: 600, },
    upgrades: {
        duration: { 
            name: "Duration", 
            effect: (x) => 8 + 2 * x, 
            cost: (x) => ({ energy: 350 * 1.4 ** x }), 
            unit: "rad",
        },
    },
    onEnemyEnter(self, loop, enemy) {
        if (!enemy.effects.duality) delete enemy.effects.freeze;
        enemy.effects.blaze = this.upgrades.duration.effect(self.upgrades.duration ?? 0);
        if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
        enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
    },
} as BuildingType;

export const pagoda = {
    name: "Zen Pagoda",
    icon: "☯️", color: "#efefef", class: "effector",
    description: "Apply the \"Duality\" effect to enemies when one moves in to the loop it's on. The \"Duality\" effect allows enemies to have the \"Freezing\" and \"Blazing\" effect at the same time.",
    baseCost: { energy: 500, },
    upgrades: {
        duration: { 
            name: "Duration", 
            effect: (x) => 8 + 4 * x, 
            cost: (x) => ({ energy: 400 * 1.4 ** x }), 
            unit: "rad",
        },
    },
    onEnemyEnter(self, loop, enemy) {
        enemy.effects.duality = this.upgrades.duration.effect(self.upgrades.duration ?? 0);
        if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
        enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
    },
} as BuildingType;

export const decayer = {
    name: "Decayer",
    icon: "☠️", color: "#cfafef", class: "effector",
    description: "Apply the \"Decay\" effect to enemies when one moves in to the loop it's on. Decaying enemies take twice as much damage.",
    baseCost: { energy: 700, },
    upgrades: {
        duration: { 
            name: "Duration", 
            effect: (x) => 5 + 1 * x, 
            cost: (x) => ({ energy: 400 * 1.4 ** x }), 
            unit: "rad",
        },
    },
    onEnemyEnter(self, loop, enemy) {
        enemy.effects.decay = this.upgrades.duration.effect(self.upgrades.duration ?? 0);
        if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
        enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
    },
} as BuildingType;

export const splitter = {
    name: "Splitter",
    icon: "↔️", color: "#efafef", class: "effector",
    description: "Enemies have a chance to split upon entering the loop the building is on.",
    baseCost: { energy: 300, },
    upgrades: {
        chance: { 
            name: "Chance", max: 10,
            effect: (x) => 25 + 5 * x, 
            cost: (x) => ({ energy: 200 * 1.6 ** x }), 
            unit: "%",
        },
    },
    onEnemyEnter(self, loop, enemy) {
        if (Math.random() < this.upgrades.chance.effect(self.upgrades.chance ?? 0) / 100) {
            let clone: Enemy = {
                angle: enemy.angle,
                speed: -enemy.speed,
                health: (enemy.health /= 2),
                maxHealth: (enemy.maxHealth /= 2),
                lifetime: 0,
                effects: { ...enemy.effects },
                loot: {},
            };
            for (let loot in enemy.loot) {
                clone.loot[loot] = (enemy.loot[loot] /= 2);
            }
            loop.enemies.push(clone);
            if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
            enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const stablizer = {
    name: "Stablizer",
    icon: "🔘", color: "#afefaf", class: "effector",
    description: "Reduces the lifespan of an enemy when one moves to the loop it's on, down to an upgradable minimum, therefore reduces the stress load.",
    baseCost: { energy: 500, },
    upgrades: {
        amount: { 
            name: "Amount",
            effect: (x) => 2 + .5 * x, 
            cost: (x) => ({ energy: 200 * 1.4 ** x }), 
            precision: 1, unit: "rad",
        },
        min: { 
            name: "Minimum", max: 20,
            effect: (x) => 20 - x, 
            cost: (x) => ({ energy: 300 * 1.2 ** x }), 
            unit: "rad",
        },
    },
    onEnemyEnter(self, loop, enemy) {
        let min = this.upgrades.min.effect(self.upgrades.min ?? 0);
        if (enemy.lifetime > min) {
            enemy.lifetime = Math.max(min, enemy.lifetime - this.upgrades.amount.effect(self.upgrades.amount ?? 0));
            if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
            enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const energizer = {
    name: "Energizer",
    icon: "⚡", color: "#efefaf", class: "generator",
    description: "Infuse enemies with Energy while they are on the loop it's on, resulting in them dropping more Energy when defeated. Scales with base enemy speed.",
    baseCost: { energy: 200, },
    upgrades: {
        amount: { 
            name: "Amount", 
            effect: (x) => 2 + x * (x + 1) / 2, 
            cost: (x) => ({ energy: 400 * 3 ** x }), 
            unit: "/rad",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.amount.effect(self.upgrades.amount ?? 0);
        for (let enm of loop.enemies) {
            enm.loot.energy = (enm.loot.energy ?? 0) + (dam * delta * Math.abs(enm.speed));
            if (!enm[BoardConnections]) enm[BoardConnections] = {};
            enm[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const multiplier = {
    name: "Multiplier",
    icon: "✖️", color: "#efefaf", class: "generator",
    description: "When an enemy enters the loop its on, if an enemy's Energy drop is in a certain threshold or below, double the Energy drop.",
    baseCost: { energy: 800, },
    upgrades: {
        threshold: { 
            name: "Threshold", 
            effect: (x) => 200 + 50 * x, 
            cost: (x) => ({ energy: 500 * 3 ** x }), 
        },
    },
    onEnemyEnter(self, loop, enemy) {
        let min = this.upgrades.threshold.effect(self.upgrades.threshold ?? 0);
        if (enemy.loot.energy <= min) {
            enemy.loot.energy *= 2;
            if (!enemy[BoardConnections]) enemy[BoardConnections] = {};
            enemy[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;

export const observer = {
    name: "Observer",
    icon: "👁️", color: "#efafcf", class: "generator",
    description: "Generates Information while an enemy is on the loop it's on. Use Information to purchase global upgrades.",
    baseCost: { energy: 400, },
    upgrades: {
        amount: { 
            name: "Amount", 
            effect: (x) => 1 + x, 
            cost: (x) => ({ energy: 400 * 2 ** x }), 
            unit: "/s",
        },
    },
    onUpdate(self, loop, delta) {
        let dam = this.upgrades.amount.effect(self.upgrades.amount ?? 0);
        for (let enm of loop.enemies) {
            enm.loot.info = (enm.loot.info ?? 0) + (dam * delta);
            if (!enm[BoardConnections]) enm[BoardConnections] = {};
            enm[BoardConnections][loop[BoardID] ?? 0] = 0;
        }
    },
} as BuildingType;