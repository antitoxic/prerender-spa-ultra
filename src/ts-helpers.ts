import { PrerenderUltraOptions } from './prerenderer/prerender';

/**
 * Courtesy of: https://stackoverflow.com/a/75347394/339872
 */
type NestedKeyOf<T extends object> = {
  [Key in keyof T & (string | number)]: Exclude<
    T[Key],
    undefined
  > extends object
    ? `${Key}.${NestedKeyOf<Exclude<T[Key], undefined>>}`
    : `${Key}`;
}[keyof T & (string | number)];

export interface BooleanParam {
  isBoolean: true;
  cliParamName: string;
  correspondingProgrammaticOption: NestedKeyOf<PrerenderUltraOptions>;
  helpText: string;
}

export interface NonBooleanParam extends Omit<BooleanParam, 'isBoolean'> {
  isBoolean: false;
  exampleValue: string | number;
  cast: (value: string) => unknown;
}
export type CliParam = BooleanParam | NonBooleanParam;

export const setNestedKey = <
  T extends Record<string, unknown>,
  KeyPath extends NestedKeyOf<T>
>(
  targetObject: T,
  pathToKey: KeyPath,
  value: unknown
): T => {
  const [key, ...pathToNestedKey] = pathToKey.split('.');
  return {
    ...targetObject,
    // @ts-expect-error TS is pretending `key` might not be a string
    [key]: pathToNestedKey.length
      ? setNestedKey(
          // @ts-expect-error TS is pretending `key` might not be a string
          targetObject?.[key] as Record<string, unknown>,
          pathToNestedKey.join('.'),
          value
        )
      : value,
  };
};
