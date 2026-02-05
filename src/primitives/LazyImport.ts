import {
  createSignal,
  createResource,
  createMemo,
  untrack,
  Component,
  JSX,
  sharedConfig,
} from 'solid-js';

// lazy load a function component asynchronously
export function lazy<T extends Component<any>>(
  fn: () => Promise<{ default: T }>,
): T & { preload: () => Promise<{ default: T }> } {
  let comp: () => T | undefined;
  let p: Promise<{ default: T }> | undefined;
  const wrap: T & { preload?: () => void } = ((props: any) => {
    const ctx = sharedConfig.context;
    if (ctx) {
      const [s, set] = createSignal<T>();
      sharedConfig.count || (sharedConfig.count = 0);
      sharedConfig.count++;
      (p || (p = fn())).then((mod) => {
        !sharedConfig.done && (sharedConfig.context = ctx);
        sharedConfig.count!--;
        set(() => mod.default);
        sharedConfig.context = undefined;
      });
      comp = s;
    } else if (!comp) {
      const [s] = createResource<T>(() =>
        (p || (p = fn())).then((mod) => mod.default),
      );
      comp = s;
    }
    let Comp: T | undefined;
    return createMemo(() =>
      (Comp = comp())
        ? untrack(() => {
            if (!ctx || sharedConfig.done) return Comp!(props);
            const c = sharedConfig.context;
            sharedConfig.context = ctx;
            const r = Comp!(props);
            sharedConfig.context = c;
            return r;
          })
        : null,
    ) as unknown as JSX.Element;
  }) as T;
  wrap.preload = () =>
    p || ((p = fn()).then((mod) => (comp = () => mod.default)), p);
  return wrap as T & { preload: () => Promise<{ default: T }> };
}
