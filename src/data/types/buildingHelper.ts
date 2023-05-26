import { Enemy } from "./data";

export function dealDamage(enemy: Enemy, damage: number) {
    if (enemy.effects.decay) damage *= 2;
    if (enemy.effects.blazing) damage *= 4;
    enemy.health -= damage;
}