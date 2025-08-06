import * as s from 'solid-js';
import type * as su from 'solid-js/universal/types/universal.js';
import * as lng from '@lightningtv/core';
import { SolidNode } from './types.js';

declare module '@lightningtv/core' {
  interface ElementNode {
    /** @internal for managing series of insertions and deletions */
    _queueDelete?: number;
    preserve?: boolean;
    _childrenChunks?: NodeChildren[] | string[][];
  }
}

type JSXChildren = s.JSX.Element | (() => JSXChildren);
type NodeChildren = (lng.ElementNode | lng.ElementText)[];

Object.defineProperty(lng.ElementNode.prototype, 'preserve', {
  get(): boolean | undefined {
    return this._queueDelete === 0;
  },
  set(v: boolean) {
    this._queueDelete = v ? 0 : undefined;
  },
});

let elementDeleteQueue: lng.ElementNode[] = [];

function flushDeleteQueue(): void {
  for (let el of elementDeleteQueue) {
    if (Number(el._queueDelete) < 0) {
      el.destroy();
    }
    el._queueDelete = undefined;
  }
  elementDeleteQueue.length = 0;
}

function pushDeleteQueue(node: lng.ElementNode, n: number): void {
  if (node._queueDelete === undefined) {
    node._queueDelete = n;
    if (elementDeleteQueue.push(node) === 1) {
      queueMicrotask(flushDeleteQueue);
    }
  } else {
    node._queueDelete += n;
  }
}

function resolveNodeJSXChildren(
  jsx: JSXChildren,
  out: NodeChildren = [],
): NodeChildren {
  while (typeof jsx === 'function') jsx = jsx();
  if (Array.isArray(jsx)) {
    for (let i = 0; i < jsx.length; i++) {
      resolveNodeJSXChildren(jsx[i], out);
    }
  } else if (jsx instanceof lng.ElementNode) {
    out.push(jsx);
  }
  return out;
}
function resolveTextJSXChildren(
  jsx: JSXChildren,
  out: string[] = [],
): string[] {
  while (typeof jsx === 'function') jsx = jsx();
  if (Array.isArray(jsx)) {
    for (let i = 0; i < jsx.length; i++) {
      resolveTextJSXChildren(jsx[i], out);
    }
  } else if (typeof jsx === 'string' || typeof jsx === 'number') {
    out.push(jsx.toString());
  }
  return out;
}

function commitChunks(el: lng.ElementNode | lng.ElementText): void {
  if (lng.isElementText(el)) {
    let text = '';
    for (let chunk of el._childrenChunks as string[][]) {
      text += chunk.join('');
    }
    el.text = text;
  } else {
    el.children = (el._childrenChunks as NodeChildren[]).flat();
  }
}
function commitChild(
  parent: lng.ElementNode,
  child: lng.ElementNode | lng.ElementText,
): void {
  let prevParent = child.parent;
  child.parent = parent;
  if (parent.rendered) child.render(true);
  if (prevParent) pushDeleteQueue(child as lng.ElementNode, 1);
}

function insertChunk(el: lng.ElementNode, before: any): NodeChildren;
function insertChunk(el: lng.ElementText, before: any): string[];
function insertChunk(
  el: lng.ElementNode | lng.ElementText,
  before: any,
): string[] | NodeChildren {
  let chunks = (el._childrenChunks ??= []);
  let chunk: any[] = [];
  if (before != null) {
    for (let i = 0; i < chunks.length; i++) {
      if (before === chunks[i]![0]) {
        chunks.splice(i, 0, chunk);
        return chunk;
      }
    }
  }
  chunks.push(chunk);
  return chunk;
}

// Core renderer functions - adapted from solid-js/universal
export const insert: su.Renderer<SolidNode>['insert'] = (
  parent,
  accessor: any,
  before,
) => {
  /* <text> */
  if (lng.isElementText(parent)) {
    let chunk = insertChunk(parent, before);

    /* dynamic chunk */
    if (typeof accessor === 'function') {
      s.createRenderEffect(() => {
        chunk.length = 0;
        resolveTextJSXChildren(accessor(), chunk);
        commitChunks(parent);
      });
    } else {
    /* constant chunk */
      resolveTextJSXChildren(accessor, chunk);
      commitChunks(parent);
    }

    return chunk[0] || '';
  } else {
  /* <view> */
    let el = parent as lng.ElementNode;
    let chunk = insertChunk(el, before);

    /* dynamic chunk */
    if (typeof accessor === 'function') {
      s.createRenderEffect(() => {
        let prev = chunk.slice();
        for (let i = 0; i < prev.length; i++) {
          prev[i]!.parent = undefined; // commitChild will set the parent again
        }
        chunk.length = 0;
        resolveNodeJSXChildren(accessor(), chunk);
        commitChunks(el);
        for (let i = 0; i < chunk.length; i++) {
          commitChild(el, chunk[i]!);
        }
        /* Handle removed children */
        for (let i = 0; i < prev.length; i++) {
          let c = prev[i]!;
          if (c.parent !== el) {
            (c as lng.ElementNode).onRemove?.(c as lng.ElementNode);
            if (el.requiresLayout()) {
              lng.addToLayoutQueue(el);
            }
            pushDeleteQueue(c as lng.ElementNode, -1);
          }
        }
      });
    } else {
    /* constant chunk */
      resolveNodeJSXChildren(accessor, chunk);
      commitChunks(el);
      for (let i = 0; i < chunk.length; i++) {
        commitChild(el, chunk[i]!);
      }
    }

    return chunk[0] as any;
  }
};

export const insertNode: su.Renderer<SolidNode>['insertNode'] = (
  parent,
  node,
  before,
) => {
  if (lng.isElementText(parent)) {
    let chunk = insertChunk(parent, before);
    resolveTextJSXChildren(node as any, chunk);
    commitChunks(parent);
  } else {
    let el = parent as lng.ElementNode;
    let chunk = insertChunk(el, before);
    chunk.push(node as lng.ElementNode);
    commitChunks(el);
    commitChild(el, node as lng.ElementNode);
  }
};

export const spread: su.Renderer<SolidNode>['spread'] = (
  node,
  accessor: any,
  skipChildren,
) => {
  /* Ref */
  if (typeof accessor === 'function') {
    s.createRenderEffect(() => {
      let { ref } = accessor();
      if (ref) ref(node);
    });
  } else if (typeof accessor.ref === 'function') {
    accessor.ref(node);
  }

  /* Children */
  if (!skipChildren) {
    if (typeof accessor === 'function') {
      insert(node, () => accessor().children);
    } else if ('children' in accessor) {
      insert(node, () => accessor.children);
    }
  }

  /* Rest */
  let prevProps: any = {};
  s.createRenderEffect(() => {
    let props = typeof accessor === 'function' ? accessor() : accessor;
    for (let prop in props) {
      if (prop === 'children' || prop === 'ref') continue;
      let value = props[prop];
      if (value === prevProps[prop]) continue;
      node[prop] = value;
      prevProps[prop] = value;
    }
  });
};

export const setProp: su.Renderer<SolidNode>['setProp'] = (
  node,
  name,
  value,
) => {
  return (node[name] = value);
};

// Lightning TV specific renderer functions
export const createElement: su.Renderer<SolidNode>['createElement'] = (
  name,
) => {
  return new lng.ElementNode(name);
};

export const createTextNode: su.Renderer<SolidNode>['createTextNode'] = (
  text,
) => {
  // A text node is just a string - not the <text> node
  // return { _type: lng.NodeType.Text, text };
  return text;
};

export const render: su.Renderer<SolidNode>['render'] = (code, element) => {
  let disposer: (() => void) | undefined;
  s.createRoot((dispose) => {
    disposer = dispose;
    insert(element, code());
  });
  return disposer!;
};

export const mergeProps: su.Renderer<SolidNode>['mergeProps'] = s.mergeProps;
export const effect: su.Renderer<SolidNode>['effect'] = s.createRenderEffect;
export const memo: su.Renderer<SolidNode>['memo'] = s.createMemo;
export const createComponent: su.Renderer<SolidNode>['createComponent'] =
  s.createComponent as any;

export const use: su.Renderer<SolidNode>['use'] = (fn, element, arg) => {
  return s.untrack(() => fn(element, arg));
};
