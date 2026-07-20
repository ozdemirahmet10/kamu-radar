export const SOURCE_RESOLVER = Symbol('SOURCE_RESOLVER');

export interface ISourceResolver {
  getManualEntrySourceId(): Promise<string>;
}
