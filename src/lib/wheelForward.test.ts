import { afterEach, describe, expect, it } from 'vitest';
import { forwardedWheelDelta } from './wheelForward';

const base = { deltaY: 100, deltaMode: 0, ctrlKey: false };
const mount = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
};
afterEach(() => (document.body.innerHTML = ''));

describe('forwardedWheelDelta', () => {
  it('forwards a wheel turn over plain interface elements', () => {
    const host = mount('<div><button id="b">x</button></div>');
    expect(forwardedWheelDelta({ ...base, target: host.querySelector('#b') })).toBe(100);
  });
  it('leaves the scene itself alone: the scroll proxy handles its own wheel', () => {
    const host = mount('<div data-scroll-proxy><div id="inner"></div></div>');
    expect(forwardedWheelDelta({ ...base, target: host.querySelector('#inner') })).toBeNull();
  });
  it('leaves things that scroll on their own alone (an open Learn more panel)', () => {
    const host = mount('<div id="panel" style="overflow-y:auto;height:50px"><p id="p">x</p></div>');
    const panel = host.querySelector('#panel') as HTMLElement;
    Object.defineProperty(panel, 'scrollHeight', { value: 400 });
    Object.defineProperty(panel, 'clientHeight', { value: 50 });
    expect(forwardedWheelDelta({ ...base, target: host.querySelector('#p') })).toBeNull();
  });
  it('still forwards over a scroll container that has nothing to scroll', () => {
    const host = mount('<div id="panel" style="overflow-y:auto"><p id="p">x</p></div>');
    expect(forwardedWheelDelta({ ...base, target: host.querySelector('#p') })).toBe(100);
  });
  it('ignores pinch-zoom (ctrl+wheel), already-handled events, zero deltas and non-element targets', () => {
    const host = mount('<button id="b">x</button>');
    const b = host.querySelector('#b');
    expect(forwardedWheelDelta({ ...base, ctrlKey: true, target: b })).toBeNull();
    expect(forwardedWheelDelta({ ...base, defaultPrevented: true, target: b })).toBeNull();
    expect(forwardedWheelDelta({ ...base, deltaY: 0, target: b })).toBeNull();
    expect(forwardedWheelDelta({ ...base, target: document })).toBeNull();
    expect(forwardedWheelDelta({ ...base, target: null })).toBeNull();
  });
  it('converts line and page deltas to pixels', () => {
    const b = mount('<button id="b">x</button>').querySelector('#b');
    expect(forwardedWheelDelta({ ...base, deltaY: 3, deltaMode: 1, target: b })).toBe(48);
    expect(forwardedWheelDelta({ ...base, deltaY: 1, deltaMode: 2, target: b })).toBe(600);
  });
});
