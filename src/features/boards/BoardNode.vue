<template>
    <!-- Ugly casting to prevent TS compiler error about style because vue doesn't think it supports arrays when it does -->
    <g
        class="boardnode"
        :class="{ [node.type]: true, isSelected, isDraggable, ...classes }"
        :style="[{ opacity: dragging?.id === node.id && hasDragged ? 0.5 : 1 }, style ?? []] as unknown as (string | CSSProperties)"
        :transform="`translate(${position.x},${position.y})`"
    >
        <BoardNodeAction
            :actions="actions ?? []"
            :is-selected="isSelected"
            :node="node"
            :node-type="nodeType"
            :selected-action="selectedAction"
            @click-action="(actionId: string) => emit('clickAction', actionId)"
        />

        <g
            class="node-container"
            @mousedown="mouseDown"
            @touchstart.passive="mouseDown"
            @mouseup="mouseUp"
            @touchend.passive="mouseUp"
        >
            <g>
                <path
                    v-if="canAccept"
                    class="receiver"
                    :d="getPath(size + 8)"
                    :fill="backgroundColor"
                    :stroke="receivingNode ? '#0F0' : '#0F03'"
                    :stroke-width="2"
                />

                <path
                    class="body"
                    :d="getPath(size)"
                    :fill="fillColor"
                    :stroke="outlineColor"
                    :stroke-width="4"
                />

                <path
                    class="progress progressFill"
                    v-if="progressDisplay === ProgressDisplay.Fill"
                    :d="getPath(Math.max(size * progress - 2, 0))"
                    :fill="progressColor"
                />
                <path
                    v-else
                    :d="getPath(size + 3.5)"
                    class="progress progressRing"
                    fill="transparent"
                    pathLength="1"
                    stroke-dasharray="0 1 0"
                    :stroke-width="3"
                    :stroke-dashoffset="-progress"
                    :stroke="progressColor"
                />
            </g>

            <text :fill="titleColor" class="node-title">{{ title }}</text>
        </g>
        <transition name="fade" appear>
            <g v-if="label">
                <text
                    :fill="label.color ?? titleColor"
                    class="node-title"
                    :class="{ pulsing: label.pulsing }"
                    :y="-size - 20"
                    >{{ label.text }}
                </text>
            </g>
        </transition>

        <transition name="fade" appear>
            <text
                v-if="isSelected && selectedAction"
                :fill="confirmationLabel.color ?? titleColor"
                class="node-title"
                :class="{ pulsing: confirmationLabel.pulsing }"
                :y="size + 75"
                >{{ confirmationLabel.text }}</text
            >
        </transition>
    </g>
</template>

<script setup lang="ts">
import themes from "data/themes";
import type { BoardNode, GenericBoardNodeAction, GenericNodeType } from "features/boards/board";
import { ProgressDisplay, Shape, getNodeProperty } from "features/boards/board";
import { isVisible } from "features/feature";
import settings from "game/settings";
import { CSSProperties, computed, toRefs, unref, watch } from "vue";
import BoardNodeAction from "./BoardNodeAction.vue";
import { coerceComponent, isCoercableComponent } from "util/vue";

const sqrtTwo = Math.sqrt(2);

const _props = defineProps<{
    node: BoardNode;
    nodeType: GenericNodeType;
    dragging: BoardNode | null;
    dragged?: {
        x: number;
        y: number;
    };
    hasDragged?: boolean;
    receivingNode?: boolean;
    isSelected: boolean;
    selectedAction: GenericBoardNodeAction | null;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent, node: BoardNode, isDraggable: boolean): void;
    (e: "endDragging", node: BoardNode): void;
    (e: "clickAction", actionId: string): void;
}>();

const isDraggable = computed(() =>
    getNodeProperty(props.nodeType.value.draggable, unref(props.node))
);

watch(isDraggable, value => {
    const node = unref(props.node);
    if (unref(props.dragging) === node && !value) {
        emit("endDragging", node);
    }
});

const actions = computed(() => {
    const node = unref(props.node);
    return getNodeProperty(props.nodeType.value.actions, node)?.filter(action =>
        isVisible(getNodeProperty(action.visibility, node))
    );
});

const position = computed(() => {
    const node = unref(props.node);

    if (
        getNodeProperty(props.nodeType.value.draggable, node) &&
        unref(props.dragging)?.id === node.id &&
        unref(props.dragged) != null
    ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { x, y } = unref(props.dragged)!;
        return {
            x: node.position.x + Math.round(x / 25) * 25,
            y: node.position.y + Math.round(y / 25) * 25
        };
    }
    return node.position;
});

let paths = {
    "Circle": ["M", 0, -1, "A", 1, 1, "0", "0", "1", 0, 1, "A", 1, 1, "0", "0", "1", 0, -1],
    "Diamond": ["M", 0, -1, "L", 1, 0, "L", 0, 1, "L", -1, 0, "Z"],
    "Square": ["M", 0, -.9, "L", .9, -.9, "L", .9, .9, "L", -.9, .9, "L", -.9, -.9, "Z"],
    "Squircle": ["M", 0, -.95, "C", .95, -.95, .95, -.95, .95, 0, "S", .95, .95, 0, .95, "S", -.95, .95, -.95, 0, "S", -.95, -.95, 0, -.95],
} as { [key: string]: (number | string)[] }

function getPath(size: number) {
    return paths[shape.value].map(x => typeof x == "number" ? x * size : x).join(" ");
}

const shape = computed(() => getNodeProperty(props.nodeType.value.shape, unref(props.node)));
const title = computed(() => getNodeProperty(props.nodeType.value.title, unref(props.node)));
const label = computed(
    () =>
        (props.isSelected.value
            ? unref(props.selectedAction) &&
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              getNodeProperty(unref(props.selectedAction)!.tooltip, unref(props.node))
            : null) ?? getNodeProperty(props.nodeType.value.label, unref(props.node))
);
const confirmationLabel = computed(() =>
    getNodeProperty(
        unref(props.selectedAction)?.confirmationLabel ?? {
            text: "Tap again to confirm"
        },
        unref(props.node)
    )
);
const size = computed(() => getNodeProperty(props.nodeType.value.size, unref(props.node)));
const progress = computed(
    () => getNodeProperty(props.nodeType.value.progress, unref(props.node)) ?? 0
);
const backgroundColor = computed(() => themes[settings.theme].variables["--background"]);
const outlineColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.outlineColor, unref(props.node)) ??
        themes[settings.theme].variables["--outline"]
);
const fillColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.fillColor, unref(props.node)) ??
        themes[settings.theme].variables["--raised-background"]
);
const progressColor = computed(() =>
    getNodeProperty(props.nodeType.value.progressColor, unref(props.node))
);
const titleColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.titleColor, unref(props.node)) ??
        themes[settings.theme].variables["--foreground"]
);
const progressDisplay = computed(() =>
    getNodeProperty(props.nodeType.value.progressDisplay, unref(props.node))
);
const canAccept = computed(
    () =>
        props.dragging.value != null &&
        unref(props.hasDragged) &&
        getNodeProperty(props.nodeType.value.canAccept, unref(props.node), props.dragging.value)
);
const style = computed(() => getNodeProperty(props.nodeType.value.style, unref(props.node)));
const classes = computed(() => getNodeProperty(props.nodeType.value.classes, unref(props.node)));

function mouseDown(e: MouseEvent | TouchEvent) {
    emit("mouseDown", e, props.node.value, isDraggable.value);
}

function mouseUp(e: MouseEvent | TouchEvent) {
    if (!props.hasDragged?.value) {
        emit("endDragging", props.node.value);
        props.nodeType.value.onClick?.(props.node.value);
        e.stopPropagation();
    }
}
</script>

<style scoped>
.boardnode {
    cursor: pointer;
    transition-duration: 0s;
}

.node-title {
    text-anchor: middle;
    dominant-baseline: middle;
    font-family: monospace;
    font-size: 200%;
    pointer-events: none;
    filter: drop-shadow(3px 3px 2px var(--tooltip-background));
}

.progress {
    transition-duration: 0.05s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>

<style>
.grow-enter-from .node-container,
.grow-leave-to .node-container {
    transform: scale(0);
}
</style>
