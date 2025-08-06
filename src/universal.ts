import * as s from 'solid-js';
import type * as su from 'solid-js/universal/types/universal.js';
import * as lng from '@lightningtv/core';
import { SolidNode } from './types.js';

declare module '@lightningtv/core' {
  interface ElementNode {
    /** @internal for managing series of insertions and deletions */
    _queueDelete?: number;
    preserve?: boolean;
    _childrenChunks?: NodeChunk[] | TextChunk[];
  }
}

type JSXChildren = s.JSX.Element | (() => JSXChildren);
type NodeChildren = (lng.ElementNode | lng.ElementText)[];
type NodeChunk = NodeChildren;
type TextChunk = string[];

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
    for (let chunk of el._childrenChunks as TextChunk[]) {
      text += chunk.join('');
    }
    el.text = text;
  } else {
    el.children = (el._childrenChunks as NodeChunk[]).flat();
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

function insertChunk(el: lng.ElementNode, before: any): NodeChunk;
function insertChunk(el: lng.ElementText, before: any): TextChunk;
function insertChunk(
  el: lng.ElementNode | lng.ElementText,
  before: any,
): TextChunk | NodeChunk {
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
  if (lng.isElementText(parent)) {
    let chunk = insertChunk(parent, before);
    if (typeof accessor === 'function') {
      s.createRenderEffect(() => {
        chunk.length = 0;
        resolveTextJSXChildren(accessor(), chunk);
        commitChunks(parent);
      });
    } else {
      resolveTextJSXChildren(accessor, chunk);
      commitChunks(parent);
    }
  } else {
    let el = parent as lng.ElementNode;
    let chunk = insertChunk(el, before);
    if (typeof accessor === 'function') {
      s.createRenderEffect(() => {
        let prev = chunk.slice();
        for (let c of prev) c.parent = undefined;
        chunk.length = 0;
        resolveNodeJSXChildren(accessor(), chunk);
        commitChunks(el);
        for (let c of chunk) commitChild(el, c);
        for (let c of prev) {
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
      resolveNodeJSXChildren(accessor, chunk);
      commitChunks(el);
      for (let c of chunk) commitChild(el, c);
    }
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
  } else if ('ref' in accessor && typeof accessor.ref === 'function') {
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
