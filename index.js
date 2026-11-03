/**
 * dsh-code-review — Host 半。
 *
 * 只做三件事：
 * 1. 在 `webServer` 上挂五条 exact 路由（懒挂载，webServer 先到后到都接住）；
 * 2. 把 git / gh / llm 的调用都留在 Host，浏览器只拿 JSON 与 NDJSON；
 * 3. 不写 profile、不改用户文件、不向 GitHub 写评论。
 *
 * @module @uponnoise/dsh-code-review
 */
import { createRoutes } from './lib/routes.js';

export const name = 'code-review';

/** Host 半不硬依赖任何服务：webServer / llm / gh 全部可选、按需探测。 */
export const inject = [];

/**
 * 安全地取一个可选服务。
 *
 * @param {any} ctx
 * @param {string} name
 * @returns {any}
 */
function tryGet(ctx, name) {
  try {
    return typeof ctx?.get === 'function' ? ctx.get(name) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 挂载路由；webServer 可能先于本插件存在，也可能后到。
 *
 * @param {any} ctx
 * @param {Record<string, any>} [config]
 */
export function apply(ctx, config = {}) {
  ctx.effect(() => {
    const routes = createRoutes(ctx, config ?? {});
    /** @type {null | (() => void)} */
    let dispose = null;

    const mount = (server) => {
      const disposers = [];
      try {
        for (const route of routes) {
          disposers.push(server.register({
            kind: 'exact',
            path: route.path,
            handler: route.handler,
          }));
        }
      } catch (error) {
        // 注册冲突是 composition 级配置错误：回滚已挂载的路由再抛出，避免半套路由。
        for (const off of disposers.reverse()) {
          try {
            off();
          } catch {
            // 忽略回滚时的次级错误。
          }
        }
        throw error;
      }
      return () => {
        for (const off of disposers.reverse()) {
          try {
            off();
          } catch {
            // 已卸载。
          }
        }
      };
    };

    const present = tryGet(ctx, 'webServer');
    if (present !== undefined) {
      dispose = mount(present);
      return () => {
        dispose?.();
        dispose = null;
      };
    }

    const off = ctx.on('internal/service', (serviceName, value) => {
      if (serviceName !== 'webServer' || dispose !== null) return;
      dispose = mount(value);
    });
    return () => {
      off();
      dispose?.();
      dispose = null;
    };
  }, 'code-review: http routes');
}
