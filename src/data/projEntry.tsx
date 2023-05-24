import Spacer from "components/layout/Spacer.vue";
import { jsx } from "features/feature";
import { createResource, trackBest, trackOOMPS, trackTotal } from "features/resources/resource";
import type { GenericTree } from "features/trees/tree";
import { branchedResetPropagation, createTree } from "features/trees/tree";
import { globalBus } from "game/events";
import type { BaseLayer, GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import player from "game/player";
import { DecimalSource, formatWhole } from "util/bignum";
import Decimal, { format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, ref, toRaw } from "vue";
import gameLayer from "./layers/game";
import { BoardNode, GenericBoard, Shape, createBoard } from "features/boards/board";
import { Persistent, persistent } from "game/persistence";
import InfoVue from "components/Info.vue";
import OptionsVue from "components/Options.vue";
import SavesManagerVue from "components/SavesManager.vue";
import ChangelogVue from "./Changelog.vue";
import ModalVue from "components/Modal.vue";
import { Computable } from "util/computed";

export type GameModeInfo = {
    name: string;
    description: string;
    multiplier: number;
}

export let gameModes = {
    standard: {
        name: "Standard",
        description: "The default game mode.\nStandard rules apply.",
        multiplier: 1
    },
    boosted: {
        name: "Boosted",
        description: "Harder enemies.\nLess health.",
        multiplier: 1.5
    },
    hardcore: {
        name: "Hardcore",
        description: "Hardest enemies.\nNo speed changes.\nNo overstressing.",
        multiplier: 2
    },
} as Record<string, GameModeInfo>;
export let gameModeArray = ["standard", "boosted", "hardcore"];

/**
 * @hidden
 */
export const main = createLayer("main", function (this: BaseLayer) {
    const points = createResource<number>(0);
    const total = trackTotal(points);

    let bestCycle = {
        standard: persistent<number>(0),
        boosted: persistent<number>(0),
        hardcore: persistent<number>(0),
    } as Record<string, Persistent<number>>;

    let selectedGameMode = persistent<string>("standard", false);

    const board = createBoard(() => ({
        startNodes: () => [],
        state() {
            let nodes: BoardNode[] = [
                { 
                    id: 0, type: "play",
                    position: { 
                        x: 0, 
                        y: 0 
                    }, 
                },
                { 
                    id: 1, type: "info",
                    position: { 
                        x: Math.sin(player.timePlayed / 20) * 150, 
                        y: Math.cos(player.timePlayed / 20) * 150,  
                    }, 
                },
                { 
                    id: 2, type: "setting",
                    position: { 
                        x: Math.sin(player.timePlayed / 20 + Math.PI * 0.66667) * 150, 
                        y: Math.cos(player.timePlayed / 20 + Math.PI * 0.66667) * 150,  
                    }, 
                },
                { 
                    id: 3, type: "saves",
                    position: { 
                        x: Math.sin(player.timePlayed / 20 + Math.PI * 1.33333) * 150, 
                        y: Math.cos(player.timePlayed / 20 + Math.PI * 1.33333) * 150,  
                    }, 
                },
            ];

            return {
                nodes,
                selectedNode: null,
                selectedAction: null,
            }
        },
        classes: { "hub-board": true },
        types: { 
            play: {
                shape: Shape.Circle,
                fillColor: "#afcfef",
                size: 80,
                title: "▶",
                onClick(node) {
                    showGameModal();
                }
            },
            info: {
                shape: Shape.Circle,
                fillColor: "#afcfef",
                size: 30,
                title: "i",
                onClick(node) {
                    (document.querySelector(".overlay-nav :nth-child(4)") as HTMLElement)?.click();
                }
            },
            setting: {
                shape: Shape.Circle,
                fillColor: "#afcfef",
                size: 30,
                title: "⚙️",
                onClick(node) {
                    (document.querySelector(".overlay-nav :nth-child(3)") as HTMLElement)?.click();
                }
            },
            saves: {
                shape: Shape.Circle,
                fillColor: "#afcfef",
                size: 30,
                title: "💾",
                onClick(node) {
                    (document.querySelector(".overlay-nav :nth-child(2)") as HTMLElement)?.click();
                }
            },
        },
    })) as GenericBoard;

    function showGameModal() {
        hubModalHeader.value = <div style="text-align: center">
            <h1 class="result-title">NEW GAME</h1>
            <h2 style="font-style: italic;">
                - Select your game mode. -
            </h2>
        </div>;
        hubModalContent.value = () => {
            let index = gameModeArray.indexOf(selectedGameMode.value);
            let prev = gameModeArray[(index + gameModeArray.length - 1) % gameModeArray.length];
            let next = gameModeArray[(index + 1) % gameModeArray.length];
            return <>
                <div class="game-mode-holder">
                    <button class="feature game-mode-card prev" onClick={() => selectedGameMode.value = prev}>
                        <h2>{gameModes[prev].name}</h2><hr/>
                        <i>
                            {gameModes[prev].description}<br/>
                            {format(gameModes[prev].multiplier, 1)}× XP gain.
                        </i>
                        <hr/>
                        Highest cycle reached:<br/>
                        <h1>{formatWhole(bestCycle[prev].value)}</h1>
                    </button>
                    <button class="feature game-mode-card">
                        <h2>{gameModes[selectedGameMode.value].name}</h2><hr/>
                        <i>
                            {gameModes[selectedGameMode.value].description}<br/>
                            {format(gameModes[selectedGameMode.value].multiplier, 1)}× XP gain.
                        </i>
                        <hr/>
                        Highest cycle reached:<br/>
                        <h1>{formatWhole(bestCycle[selectedGameMode.value].value)}</h1>
                    </button>
                    <button class="feature game-mode-card next" onClick={() => selectedGameMode.value = next}>
                        <h2>{gameModes[next].name}</h2><hr/>
                        <i>
                            {gameModes[next].description}<br/>
                            {format(gameModes[next].multiplier, 1)}× XP gain.
                        </i>
                        <hr/>
                        Highest cycle reached:<br/>
                        <h1>{formatWhole(bestCycle[next].value)}</h1>
                    </button>
                </div>
            </>
        };
        hubModalFooter.value = (
            <div style="display: flex; text-align: center; --layer-color: #dadafa">
                <button
                    class="feature can"
                    onClick={() => {
                        hubModalOpen.value = false;
                    }}
                >
                    Back
                </button>
                <div style="flex-grow: 1" />
                <button
                    class="feature can"
                    onClick={() => {
                        player.tabs = ["game"];
                        gameLayer.startGame();
                        hubModalOpen.value = false;
                    }}
                >
                    Start game
                </button>
            </div>
        )
        hubModalOpen.value = true;
        console.log("show game modal");
    }

    let hubModalOpen = ref(false);
    let hubModalHeader = ref<Computable<JSX.Element | string>>("");
    let hubModalContent = ref<Computable<JSX.Element | string>>("");
    let hubModalFooter = ref<Computable<JSX.Element | string>>("");

    return {
        name: "Tree",
        color: "#afcfef",
        classes: { "hub": true },
        minimizable: false,

        points,
        total,
        
        bestCycle,

        selectedGameMode,

        board,

        display: jsx(() => (
            <>
                {render(board)}
                <div class="game-top">
                    <div style="display: flex; height: 31px">
                        <span class="bar-label">
                            {formatWhole(points.value)} xp
                        </span>
                    </div>
                </div>
                <ModalVue 
                    modelValue={hubModalOpen.value} 
                    onUpdate:modelValue={x => hubModalOpen.value = x}
                    v-slots={{
                        header: hubModalHeader.value,
                        body: hubModalContent.value,
                        footer: hubModalFooter.value,
                    }}
                />
            </>
        )),
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<Player>
): Array<GenericLayer> => [main, gameLayer];

/**
 * A computed ref whose value is true whenever the game is over.
 */
export const hasWon = computed(() => {
    return false;
});

/**
 * Given a player save data object being loaded with a different version, update the save data object to match the structure of the current version.
 * @param oldVersion The version of the save being loaded in
 * @param player The save data being loaded in
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<Player>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
