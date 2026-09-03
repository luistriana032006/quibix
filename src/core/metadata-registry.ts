/**
 * Internal registry for the metadata captured by the decorators.
 *
 * Indexed by `prototype` (the same object TypeScript passes as `target`
 * to both method and parameter decorators for an instance method), so
 * @Param and @Explain write into the same key space without needing to
 * coordinate.
 *
 * Execution order of TS legacy decorators this relies on: for each
 * member, its parameter decorators run first, then the method
 * decorator; class decorators (@Expose) run last, after every member.
 * That's why @Expose can read this metadata synchronously the moment
 * it's applied.
 */
import type { MethodMeta, ParamMeta } from "./types.js";

type PropertyKey = string | symbol;

const methodMetadata = new WeakMap<object, Map<PropertyKey, MethodMeta>>();
const paramMetadata = new WeakMap<object, Map<PropertyKey, ParamMeta[]>>();

export function setMethodMeta(prototype: object, propertyKey: PropertyKey, meta: MethodMeta): void {
  if (!methodMetadata.has(prototype)) {
    methodMetadata.set(prototype, new Map());
  }
  methodMetadata.get(prototype)!.set(propertyKey, meta);
}

/** Methods annotated with @Explain for this class, in declaration order. */
export function getMethodMetas(prototype: object): Map<PropertyKey, MethodMeta> {
  return methodMetadata.get(prototype) ?? new Map();
}

export function addParamMeta(prototype: object, propertyKey: PropertyKey, meta: ParamMeta): void {
  if (!paramMetadata.has(prototype)) {
    paramMetadata.set(prototype, new Map());
  }
  const byMethod = paramMetadata.get(prototype)!;
  if (!byMethod.has(propertyKey)) {
    byMethod.set(propertyKey, []);
  }
  byMethod.get(propertyKey)!.push(meta);
}

/** A method's @Param-annotated parameters, sorted by their real position. */
export function getParamMetas(prototype: object, propertyKey: PropertyKey): ParamMeta[] {
  const metas = paramMetadata.get(prototype)?.get(propertyKey) ?? [];
  return [...metas].sort((a, b) => a.index - b.index);
}
