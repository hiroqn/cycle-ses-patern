import { run } from '@cycle/run';
import { button, div, DOMSource, makeDOMDriver } from '@cycle/dom';
import isolate, { Component } from '@cycle/isolate';
import Stream from "xstream";
import { VNode } from 'snabbdom/vnode';
import { Endo, modifyC, modifyToC } from "./endo";

export type SoDOM = { DOM: DOMSource };
export type SiDOM = { DOM: Stream<VNode> };

type State = {
    component: Component<SoDOM, SiDOM>
}

run<SoDOM, SiDOM>(function ({ DOM }) {
    const countUpService: Component<SoDOM, SiDOM> = isolate(countUp);
    const mouseStalkerService: Component<SoDOM, SiDOM> = isolate(mouseStalker);
    const ses: Stream<Endo<State>> = Stream.merge(
        DOM.select('.event-click-count-up').events('click')
            .mapTo(modifyToC('component', countUpService)),
        DOM.select('.event-click-mouse-stalker').events('click')
            .mapTo(modifyToC('component', mouseStalkerService)),
    )


    const state$ = ses.fold((acc, f) => f(acc), {
        component: countUpService
    });

    const vNode$: Stream<VNode> = state$.map(state => state.component({ DOM }).DOM).flatten();

    return {
        DOM: vNode$.map(vNode => div('.application', [
            div('.nav', [
                button('.event-click-count-up', ["Count up"]),
                button('.event-click-mouse-stalker', ["MouseStalker"]),
            ]),
            vNode
        ]))
    }
}, {
    DOM: makeDOMDriver('#app'),
});

function accumulator<T>(state: T, endo: Endo<T>): T {
    return endo(state);
}

type CountUpState = {
    count: number
}

function countUp({ DOM }: SoDOM): SiDOM {

    const state$: Stream<CountUpState> = DOM.select(`.evt-click-btn`).events('click')
        .mapTo(modifyC('count', (x: number): number => x + 1))
        .fold(accumulator, { count: 0 });

    return {
        DOM: state$.map(({ count }) => div('.frame', [
            button('.evt-click-btn', {
                style: {
                    height: `${20 + count * 5}px`
                }
            }, [`Button ${count}`])
        ]))
    }
}

type MouseStalkerState = {
    position: [number, number]
    past: [number, number][]
    color: string
}


function mouseStalker({ DOM }: SoDOM): SiDOM {
    type SES = Stream<Endo<MouseStalkerState>>
    const ses1:SES = DOM.select(`.evt-mousemove-pane`).events('mousemove').map(evt => modifyToC('position', [evt.offsetX, evt.offsetY]))
    const ses2:SES = Stream.periodic(100).map(_ => (state: MouseStalkerState): MouseStalkerState => ({
        ...state,
        past: [state.position, ...state.past].slice(0, 5)
    }));

    const ses3:SES = DOM.select(`.evt-click-pane`).events('click')
        .map(evt => {
            const r = evt.offsetY * 73;
            const g = evt.offsetX * 103;
            const b = evt.offsetY * evt.offsetX * 19;
            return Stream.periodic(75)
                .map(n => modifyToC('color', `rgb(${r * n % 256}, ${g * n % 256}, ${b * n % 256})`))
                .take(30)
        }).flatten();

    const ses: SES = Stream.merge(ses1, ses2, ses3);

    const state$: Stream<MouseStalkerState> = ses.fold<MouseStalkerState>(accumulator, {
        position: [0, 0],
        past: [],
        color: '#13bd7b'
    });

    return {
        DOM: state$.map(state => div('.frame', [
            div('.pane.evt-mousemove-pane.evt-click-pane', [
                `x: ${state.position[0]}, y: ${state.position[1]}`,
                ...state.past.map((position, i) => div('.circle', {
                    style: {
                        position: 'absolute',
                        left: `${position[0]}px`,
                        top: `${position[1]}px`,
                        'background-color': state.color,
                        transform: `scale(${3 / (i + 3)})`
                    }
                }))

            ])
        ]))
    }
}
