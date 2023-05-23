/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion } from "features/conversion";
import { JSXFunction, jsx } from "features/feature";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { Resource, createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { BaseLayer, createLayer } from "game/layers";
import { DecimalSource, format } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { BoardNode, BoardNodeLink, GenericBoard, createBoard } from "features/boards/board";
import { noPersist, persistent } from "game/persistence";
import { BoardConnections, BoardID, Building, BuildingType, Enemy, Loop } from "../types/data";
import { CSSProperties, StyleValue, computed, ref, unref } from "vue";
import * as types from "../types/board";
import player from "game/player";
import { globalBus } from "game/events";
import { formatWhole } from "util/break_eternity";
import { createBar } from "features/bars/bar";
import { Direction } from "util/common";
import * as b from "../types/buildings";
import "components/common/features.css";
import vuePlugin from "@vitejs/plugin-vue";

const buildings = b as { [key: string]: BuildingType };

const id = "game";

function loopIdToPosition(id: string) {
    let [x, y] = id.split("x");
    return { x: +x, y: +y };
}

function loopPositionToId(x: number, y: number) {
    return x + "x" + y;
}

let building: Building | undefined = undefined;

const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Game";

    const cycle = persistent<number>(0);
    const cycleProgress = persistent<number>(0);
    const health = persistent<number>(0);
    const stress = ref<number>(0);

    const loops = persistent<Record<string, Loop>>({});

    const resources = {
        energy: createResource<number>(0, "Energy"),
    } as { [key: string]: Resource<number>};
    const buildingFactor = persistent<number>(0);
    const buildingFactors = persistent<{ [key: string]: number }>({});

    function getBuildingCostFactor(building: string) {
        return 1.1 ** (buildingFactor.value + (buildingFactors.value[building] ?? 0));
    }

    const gameState = persistent<string>("");
    const gameSpeed = persistent<number>(0);

    function startGame() {
        cycle.value = 0;
        cycleProgress.value = 0;
        health.value = 100;
        resources.energy.value = 150;
        buildingFactor.value = 0;
        buildingFactors.value = {};

        gameState.value = "running";
        gameSpeed.value = 1;

        loops.value = { "0x0": { enemies: [
            {
                angle: 0,
                lifetime: 0,
                speed: Number.EPSILON,
                health: 20,
                maxHealth: 20,
                effects: {},
                loot: { energy: 50 },
            }
        ] } };
    }

    function endGame() {
        gameState.value = "ended";
        gameSpeed.value = 0;
    }

    function spawnEnemies() {
        let count = 1 + (0.1 * cycle.value) + (0.01 * cycle.value * cycle.value);
        count = Math.floor(count) + (Math.random() < (count % 1) ? 1 : 0);
        let loopList = Object.values(loops.value);
        for (let a = 0; a < count; a++) {
            let health = 18 * (1.05 ** cycle.value) * (Math.random() * .2 + .9);
            loopList[Math.floor(Math.random() * loopList.length)].enemies.push({
                angle: Math.random(),
                lifetime: 0,
                speed: (Math.random() * .4 + .8 + 0.05 * cycle.value) * (Math.random() < .5 ? 1 : -1),
                health,
                maxHealth: health,
                effects: {},
                loot: { energy: 25 },
            });
        }
    }

    function spawnLoop() {
        let entries = Object.entries(loops.value);
        let id = "";

        while (entries.length) {
            let pos = Math.floor(Math.random() * entries.length);
            let entry = entries[pos];
            let { x: ex, y: ey } = loopIdToPosition(entry[0]);
            let poses = [];

            if (!loops.value[loopPositionToId(ex + 1, ey)]) poses.push(loopPositionToId(ex + 1, ey));
            if (!loops.value[loopPositionToId(ex - 1, ey)]) poses.push(loopPositionToId(ex - 1, ey));
            if (!loops.value[loopPositionToId(ex, ey + 1)]) poses.push(loopPositionToId(ex, ey + 1));
            if (!loops.value[loopPositionToId(ex, ey - 1)]) poses.push(loopPositionToId(ex, ey - 1));

            if (poses.length) {
                id = poses[Math.floor(Math.random() * poses.length)];
                break;
            } else {
                entries.splice(pos, 1);
            }
        }
        
        loops.value[id] = { enemies: [] };
    }

    globalBus.on("onLoad", () => {
        if (gameState.value == "") {
            startGame();
        } else if (gameState.value == "ended") {
            endGame();
        }
    })

    globalBus.on("update", delta => {
        if (gameState.value == "running") {
            if (gameSpeed.value <= 0) return;
            delta *= gameSpeed.value;
    
            if (cycle.value >= 1) {
                cycleProgress.value += delta / (15 + Math.sqrt(cycle.value));
                if (cycleProgress.value >= 1) {
                    cycleProgress.value--;
                    cycle.value++;
                    spawnEnemies();
                    if ((cycle.value + 1) % 2 == 0) spawnLoop();
                }
            }
            let hasEnemies = false;
            for (let loop in loops.value) {
                hasEnemies ||= loops.value[loop].enemies.length > 0;
            }
            if (!hasEnemies) {
                cycleProgress.value = 0;
                cycle.value++;
                spawnEnemies();
                if ((cycle.value + 1) % 2 == 0) spawnLoop();
            }
    
            let enemyMoves: {
                enemy: Enemy;
                from: Loop;
                to: Loop;
            }[] = [];
    
            stress.value = 0;
    
            for (let id in loops.value) {
                let loop = loops.value[id];
                let { x, y } = loopIdToPosition(id);
    
                for (let enm of loop.enemies) {
                    let prevAngle = enm.angle;
                    let dist = enm.speed * 0.1 * delta;
                    if (enm.effects.freeze) dist *= 0.5;
                    enm.angle += dist;
                    enm.lifetime += Math.abs(dist);
                    stress.value += enm.lifetime;
                    enm.angle = ((enm.angle % 1) + 1) % 1;
        
                    let [ min, max ] = [
                        Math.min(prevAngle, enm.angle),
                        Math.max(prevAngle, enm.angle),
                    ];
    
                    if (enm.health <= 0) {
                        loop.enemies.splice(loop.enemies.indexOf(enm), 1);
                        for (let [id, loot] of Object.entries(enm.loot)) {
                            resources[id].value += loot;
                        }
                    }
        
                    // Bottom (+y)
                    if (min < .25 && max > .75) {
                        if (loops.value[loopPositionToId(x, y + 1)] && Math.random() < 0.5) {
                            enemyMoves.push({
                                enemy: enm,
                                from: loops.value[loopPositionToId(x, y)],
                                to: loops.value[loopPositionToId(x, y + 1)],
                            });
                            enm.angle = 0.5 - enm.angle;
                            enm.speed = -enm.speed;
                        }
                    }
                    // Right (+x)
                    else if (min < .25 && max > .25) {
                        if (loops.value[loopPositionToId(x + 1, y)] && Math.random() < 0.5) {
                            enemyMoves.push({
                                enemy: enm,
                                from: loops.value[loopPositionToId(x, y)],
                                to: loops.value[loopPositionToId(x + 1, y)],
                            });
                            enm.angle = 1 - enm.angle;
                            enm.speed = -enm.speed;
                        }
                    }
                    // Top (-y)
                    else if (min < .5 && max > .5) {
                        if (loops.value[loopPositionToId(x, y - 1)] && Math.random() < 0.5) {
                            enemyMoves.push({
                                enemy: enm,
                                from: loops.value[loopPositionToId(x, y)],
                                to: loops.value[loopPositionToId(x, y - 1)],
                            });
                            enm.angle = 0.5 - enm.angle;;
                            enm.speed = -enm.speed;
                        }
                    }
                    // Left (-x)
                    else if (min < .75 && max > .75) {
                        if (loops.value[loopPositionToId(x - 1, y)] && Math.random() < 0.5) {
                            enemyMoves.push({
                                enemy: enm,
                                from: loops.value[loopPositionToId(x, y)],
                                to: loops.value[loopPositionToId(x - 1, y)],
                            });
                            enm.angle = 1 - enm.angle;
                            enm.speed = -enm.speed;
                        }
                    }
                    
                    enm.angle = ((enm.angle % 1) + 1) % 1;
                    
                    for (let eff in enm.effects) {
                        enm.effects[eff] -= Math.abs(dist);
                        if (enm.effects[eff] <= 0) delete enm.effects[eff];
                    }
                    if (enm[BoardConnections]) {
                        for (let from in enm[BoardConnections]) {
                            enm[BoardConnections][from] -= delta;
                            if (enm[BoardConnections][from] <= 0) delete enm[BoardConnections][from];
                        }
                    }
                }
    
                if (loop.building) {
                    buildings[loop.building.type].onUpdate?.(loop.building, loop, delta);
                }
            }
    
            stress.value /= Object.values(loops.value).length * 10;
    
            if (stress.value > 1) {
                health.value -= (2 ** stress.value) * delta;
            }
            if (health.value <= 0) {
                endGame();
            }
            
            for (let move of enemyMoves) {
                move.from.enemies.splice(move.from.enemies.indexOf(move.enemy), 1);
                move.to.enemies.push(move.enemy);
    
                if (move.from.building) {
                    buildings[move.from.building.type].onEnemyExit?.(move.from.building, move.from, move.enemy);
                }
                if (move.to.building) {
                    buildings[move.to.building.type].onEnemyEnter?.(move.to.building, move.to, move.enemy);
                }
            }
    
            if (selectedBuilding.value) {
                if (canAffordBuilding(selectedBuilding.value)) {
                    if (board.selectedNode.value?.type == "loop") {
                        let loop = (board.selectedNode.value.state as { target: Loop }).target;
                        if (loop.building) {
                            unref(board.state).selectedNode = null;
                        } else {
                            loop.building = {
                                type: selectedBuilding.value,
                                upgrades: {},
                                data: {},
                            }
                            for (let [id, cost] of Object.entries(buildings[selectedBuilding.value].baseCost)) {
                                resources[id].value -= cost * getBuildingCostFactor(selectedBuilding.value);
                            }
                            buildingFactor.value++;
                            buildingFactors.value[selectedBuilding.value] = (buildingFactors.value[selectedBuilding.value] ?? 0) + 1;
                            selectedBuilding.value = "";
                        }
                    }
                } else {
                    selectedBuilding.value = "";
                }
            }
        }
    });

    let newBoardID = 0;

    const board = createBoard(() => ({
        startNodes: () => [],
        state() {
            let nodes: BoardNode[] = [];

            if (gameState.value == "ended") {
                nodes = unref(board.state)?.nodes ?? [];
            } else {
                let enemies: (Enemy & { position: {x: number, y: number }})[] = [];
    
                for (let [lid, loop] of Object.entries(loops.value)) {
                    let {x, y} = loopIdToPosition(lid);
                    for (let enemy of loop.enemies) {
                        if (!enemy[BoardID]) {
                            enemy[BoardID] = newBoardID;
                            newBoardID += 1;
                        }
                        enemies.push({
                            ...enemy,
                            position: { x, y }
                        });
                    }
    
                    x = x * 100;
                    y = y * 100;
    
                    if (!loop[BoardID]) {
                        loop[BoardID] = newBoardID;
                        newBoardID += 2;
                    }
    
                    nodes.push({
                        id: loop[BoardID] ?? 0,
                        position: { x, y },
                        type: "loop",
                        state: { target: loop }
                    })
                    if (loop.building) {
                        nodes.push({
                            id: (loop[BoardID] ?? 0) + 1,
                            position: { x, y },
                            type: "building",
                            state: { target: loop.building }
                        })
                    }
                }
    
                for (let enm of enemies) {
                    let {x, y} = enm.position;
                    
                    nodes.push({
                        id: enm[BoardID] ?? 0,
                        position: { 
                            x: (x + Math.sin(enm.angle * 2 * Math.PI) * .5) * 100, 
                            y: (y + Math.cos(enm.angle * 2 * Math.PI) * .5) * 100 
                        },
                        type: "enemy",
                        state: { target: enm }
                    });
                }
            }

            return {
                nodes,
                selectedNode: unref(board.state)?.selectedNode ?? null,
                selectedAction: null,
            }
        },
        links() {
            let links: BoardNodeLink[] = [];
            for (let [lid, loop] of Object.entries(loops.value)) {
                for (let enemy of loop.enemies) {
                    if (enemy[BoardConnections]) {
                        for (let from in enemy[BoardConnections]) {
                            let startNode = board.nodes.value.find(x => x.id == +from);
                            let endNode = board.nodes.value.find(x => x.id == enemy[BoardID]);
                            if (startNode && endNode) links.push({
                                startNode,
                                endNode,
                                stroke: "white",
                                strokeWidth: 2,
                            });
                        }
                    }
                }
            }
            return links;
        },
        classes: { "game-board": true },
        types,
    })) as GenericBoard;

    const cycleBar = createBar(() => ({
        width: 500,
        height: 31,
        direction: Direction.Right,
        progress: computed(() => cycleProgress.value),
        display: jsx(() => <span class="bar-label">
            Cycle {formatWhole(cycle.value + 1)}
        </span>),
        fillStyle: { backgroundColor: "#50637c" },
        baseStyle: { backgroundColor: "#0000001f" },
        borderStyle: { 
            border: "none", 
            borderTop: "2px solid var(--outline)",
            borderRadius: "0 0 0 4px",
        }
    }));

    const stressBar = createBar(() => ({
        width: 249,
        height: 31,
        direction: Direction.Right,
        progress: computed(() => stress.value),
        display: jsx(() => <span class="bar-label left">
            Stress: {formatWhole(stress.value * 100)}%
        </span>),
        fillStyle: { backgroundColor: "#ff5c5a" },
        baseStyle: { backgroundColor: "#0000001f" },
        borderStyle: { 
            border: "none", 
            borderTop: "2px solid var(--outline)", 
            borderRadius: "0 0 0 4px",
        }
    }));

    const healthBar = createBar(() => ({
        width: 249,
        height: 31,
        direction: Direction.Left,
        progress: computed(() => health.value / 100),
        display: jsx(() => <span class="bar-label right">
            HP: {formatWhole(health.value)}%
        </span>),
        fillStyle: { backgroundColor: "#ff5c5a" },
        baseStyle: { backgroundColor: "#0000001f" },
        borderStyle: { 
            border: "none", 
            borderTop: "2px solid var(--outline)", 
            borderLeft: "2px solid var(--outline)", 
            borderRadius: "0 0 4px 0",
        }
    }));

    let tooltipTimeout: NodeJS.Timeout = 0 as unknown as NodeJS.Timeout;

    let tooltipShown = ref<boolean>(false);
    let tooltipItem = ref<JSX.Element | string>("");
    let tooltipSide = ref<Direction>(Direction.Default);
    let tooltipStyle = ref<CSSProperties>({});

    function showTooltip(value: JSX.Element | string, target: Element, side: Direction = Direction.Default) {
        tooltipItem.value = value;
        tooltipShown.value = true;
        tooltipSide.value = side;

        setTimeout(() => {
            let selfRect = document.querySelector(".game-tooltip")?.getBoundingClientRect();
            let tarRect = target.getBoundingClientRect();
            
            if (!selfRect) return;

            let selfPos = {
                x: (selfRect.right + selfRect.left) / 2,
                y: (selfRect.bottom + selfRect.top) / 2,
            }
            let tarPos = {
                x: (tarRect.right + tarRect.left) / 2,
                y: (tarRect.bottom + tarRect.top) / 2,
            }

            let clampY = (x: number) => Math.min(Math.max(x, 8), window.innerHeight - selfRect!.height - 8);
            let clampX = (x: number) => Math.min(Math.max(x, 8), window.innerWidth - selfRect!.width - 8);

            if (side == Direction.Left) {
                tooltipStyle.value = {
                    right: window.innerWidth - (tarRect.left - 12) + "px",
                    top: clampY(tarPos.y - selfRect.height / 2) + "px"
                }
            }
            else if (side == Direction.Right) {
                tooltipStyle.value = {
                    left: (tarRect.right + 12) + "px",
                    top: clampY(tarPos.y - selfRect.height / 2) + "px"
                }
            }
            else if (side == Direction.Up) {
                tooltipStyle.value = {
                    left: clampX(tarPos.x - selfRect.width / 2) + "px",
                    bottom: window.innerHeight - (tarRect.top - 12) + "px"
                }
            }
            else if (side == Direction.Down) {
                tooltipStyle.value = {
                    left: clampX(tarPos.x - selfRect.width / 2) + "px",
                    top: (tarRect.bottom + 12) + "px"
                }
            }
        }, 0);
    }

    function hideTooltip() {
        tooltipShown.value = false;
    }

    let selectedBuilding = ref("");

    function canAffordBuilding(id: string) {
        if (!buildings[id]) return false;
        let costFactor = getBuildingCostFactor(id);
        for (let [rid, cost] of Object.entries(buildings[id].baseCost)) {
            if (resources[rid].value < cost * costFactor) return false;
        }
        return true;
    }

    function canAffordUpgrade(building: Building, id: string) {
        if (buildings[building.type].upgrades[id].max !== undefined && building.upgrades[id] >= (buildings[building.type].upgrades[id].max ?? 0) - 1) {
            return false;
        }
        for (let [uid, cost] of Object.entries(buildings[building.type].upgrades[id].cost(building.upgrades[id] ?? 0))) {
            if (resources[uid].value < cost) {
                return false;
            }
        }
        return true;
    }

    function buyUpgrade(building: Building, id: string) {
        if (canAffordUpgrade(building, id)) {
            for (let [uid, cost] of Object.entries(buildings[building.type].upgrades[id].cost(building.upgrades[id] ?? 0))) {
                resources[uid].value -= cost;
            }
            building.upgrades[id] = (building.upgrades[id] ?? 0) + 1;
        }
    }


    function buildingItemMouseEnter(e: MouseEvent, building: BuildingType, id: string) {
        tooltipTimeout = setTimeout(() => {
            let costFactor = getBuildingCostFactor(id);
            showTooltip(<>
                <h3>{building.name}</h3>{" "}
                <h5 style="display: inline-block; margin: 0"><i>- {building.class.toUpperCase()}</i></h5>
                <br />
                <i>{building.description}</i>
                <hr />
                <h5>BUILDING COST:</h5>
                <div class="stat-entries">
                    {Object.entries(building.baseCost).map(([id, cost]) => 
                        <div class={{red: resources[id].value < cost * costFactor}}>
                            <div class="name">{resources[id].displayName}</div>
                            <div class="value">{formatWhole(cost * costFactor)}</div>
                        </div>
                    )}  
                </div>
                <hr />
                <h5>STARTING SPECS:</h5>
                <div class="stat-entries">
                    {Object.entries(building.upgrades).map(([id, upg]) => 
                        <div>
                            <div class="name">{upg.name}</div>
                            <div class="value">{format(upg.effect(0), upg.precision ?? 0) + (upg.unit ?? "")}</div>
                        </div>
                    )}
                </div>
            </>, e.target as Element, Direction.Left);
        }, 500)
    }

    function buildingItemMouseLeave(e: MouseEvent, building: BuildingType, id: string) {
        clearTimeout(tooltipTimeout);
        hideTooltip();
    }

    function buildingItemClick(e: MouseEvent, building: BuildingType, id: string) {
        clearTimeout(tooltipTimeout);
        hideTooltip();
        if (canAffordBuilding(id)) {
            selectedBuilding.value = selectedBuilding.value == id ? "" : id;
        }
    }


    return {
        name,
        color: "#afcfef",

        cycle,
        cycleProgress,
        cycleBar,
        health,
        healthBar,

        gameState,
        gameSpeed,

        loops,
        buildingFactor,
        buildingFactors,

        resources,

        board,

        display: jsx(() => (
            <>
                {render(board)}
                <div class="game-top">
                    <div style="display: flex; height: 31px">
                        <span class="bar-label">
                            {formatWhole(resources.energy.value)} energy
                        </span>
                    </div>
                    {render(cycleBar)}
                    <div style="display: flex">
                        {render(stressBar)}
                        {render(healthBar)}
                    </div>
                </div>
                <div class="game-bottom">{(() => {
                    let state = (board.selectedNode.value?.state as { target: Loop } | undefined);
                    return <>
                        {state ? <div style="display: flex; height: 31px">
                            {state.target.building ? <div class="building-upgrades" style={{
                                "--layer-color": buildings[state.target.building.type].color
                            }}>
                                {
                                    Object.entries(buildings[state.target.building.type].upgrades).map(([id, upg]) => {
                                        let level = state?.target.building?.upgrades[id] ?? 0;
                                        let maxed = buildings[state?.target.building?.type ?? ""].upgrades[id].max !== undefined && 
                                            level >= (buildings[state?.target.building?.type ?? ""].upgrades[id].max ?? 0) - 1;

                                        return <button class={{
                                            feature: true,
                                            can: canAffordUpgrade(state?.target.building as Building, id)
                                        }} onClick={() => buyUpgrade(state?.target.building as Building, id)}>
                                            Level {formatWhole(level + 1) + (upg.max ? " / " + formatWhole(upg.max) : "")}<br/>
                                            <h3>{upg.name}</h3>
                                            <hr/>
                                            &uarr; {format(upg.effect(level + 1), upg.precision ?? 0) + (upg.unit ?? "")} &uarr;<br/>
                                            {format(upg.effect(level), upg.precision ?? 0) + (upg.unit ?? "")}<br/>
                                            <hr/>
                                            {Object.entries(upg.cost(level)).map(([id, cost]) => 
                                                formatWhole(cost) + " " + resources[id].displayName
                                            ).join(", ")}
                                        </button>
                                    })
                                }
                            </div> : <span class="bar-label">
                                Select a building to build &rarr;
                            </span>}
                        </div> : ""}
                        <div style="display: flex; height: 31px">
                            <span>
                                {
                                    !state ? selectedBuilding.value ? "▲ Select a loop to build ▲" : 
                                    "▲ Select a loop from above ▲" :
                                    !state.target.building ? <i>No building</i> : 
                                    buildings[state.target.building.type].name
                                }
                            </span>
                        </div>
                    </>
                })()}</div>
                <div class="game-right">
                    <div class="building-list">
                        {
                            Object.entries(buildings).map(([id, building]) => 
                                <button 
                                    class={Object.fromEntries([
                                        [building.class, true],
                                        ["selected", selectedBuilding.value == id],
                                        ["disabled", !canAffordBuilding(id)],
                                    ])}
                                    onMouseenter={e => buildingItemMouseEnter(e, building, id)}
                                    onMouseleave={e => buildingItemMouseLeave(e, building, id)}
                                    onClick={e => buildingItemClick(e, building, id)}
                                >
                                    <div class="background"
                                        style={{
                                            background: building.color
                                        }}
                                    >
                                        <div class="icon">
                                            {building.icon}
                                        </div>
                                    </div>
                                </button>
                            )
                        }
                    </div>
                </div>
                <div class={{
                    "game-tooltip": true,
                    hidden: !tooltipShown.value,
                    left: tooltipSide.value == Direction.Left,
                    right: tooltipSide.value == Direction.Right,
                    top: tooltipSide.value == Direction.Up,
                    bottom: tooltipSide.value == Direction.Down,
                }} style={tooltipStyle.value}>
                    {tooltipItem.value}
                </div>
            </>
        )),
        minimizable: false,
        classes: {  
            game: true
        }
    };
});

export default layer;
