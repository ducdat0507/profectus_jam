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
import { createBoard } from "features/boards/board";
import { persistent } from "game/persistence";
import InfoVue from "components/Info.vue";
import OptionsVue from "components/Options.vue";
import SavesManagerVue from "components/SavesManager.vue";
import ChangelogVue from "./Changelog.vue";

/**
 * @hidden
 */
export const main = createLayer("main", function (this: BaseLayer) {
    const points = createResource<number>(0);
    const total = trackTotal(points);

    let info = ref<JSX.Element | null>(null);
    let changelog = <ChangelogVue />;
    let savesManager = <SavesManagerVue />;
    let options = <OptionsVue />;

    let finishedSetup = false;

    globalBus.on("update", delta => {
        if (changelog.component && !info.value) {
            info.value = <InfoVue changelog={changelog.component?.exposed as typeof ChangelogVue} />
        }
        if (info.value?.el && !finishedSetup) {
            let root = document.querySelector("#modal-root") as Element;
            root.append(root.firstElementChild as Element);
            if ((root.lastElementChild?.querySelector?.(".modal-header") as HTMLElement)?.innerText == "Changelog") {
                finishedSetup = true;
            }
        }
    });


    return {
        name: "Tree",
        display: jsx(() => (
            <>
                XP: {formatWhole(points.value)}<br/>
                Hub is coming soon<br/>
                <button class="feature can" onClick={() => {
                    player.tabs = ["game"];
                    gameLayer.startGame();
                }}>
                    Start game
                </button><br/>
                <button class="feature can" onClick={() => info.value?.component?.exposed?.open()}> Info </button>
                <button class="feature can" onClick={() => savesManager.component?.exposed?.open()}> Saves manager </button>
                <button class="feature can" onClick={() => options.component?.exposed?.open()}> Options </button>
                {info.value}
                {changelog}
                {savesManager}
                {options}
            </>
        )),
        minimizable: false,
        points,
        total,
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
