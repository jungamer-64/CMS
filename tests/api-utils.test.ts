import { describe, expect, it } from 'vitest';
import { getCommaSeparatedList, getEnumParam, getOptionalString } from '../app/lib/api-utils';

describe('api-utils', () => {
    it('getOptionalString returns undefined for missing and empty values', () => {
        const params = new URLSearchParams();
        expect(getOptionalString(params, 'a')).toBeUndefined();

        params.set('a', '   ');
        expect(getOptionalString(params, 'a')).toBeUndefined();
    });

    it('getOptionalString trims values', () => {
        const params = new URLSearchParams();
        params.set('q', '  hello world  ');
        expect(getOptionalString(params, 'q')).toBe('hello world');
    });

    it('getCommaSeparatedList parses and trims items and returns undefined for empty', () => {
        const params = new URLSearchParams();
        expect(getCommaSeparatedList(params, 'tags')).toBeUndefined();

        params.set('tags', '');
        expect(getCommaSeparatedList(params, 'tags')).toBeUndefined();

        params.set('tags', 'a,  ,b , c');
        expect(getCommaSeparatedList(params, 'tags')).toEqual(['a', 'b', 'c']);
    });

    it('getEnumParam returns allowed values only', () => {
        const params = new URLSearchParams();
        const allowed = ['x', 'y'];
        expect(getEnumParam(params, 'opt', allowed)).toBeUndefined();

        params.set('opt', 'z');
        expect(getEnumParam(params, 'opt', allowed)).toBeUndefined();

        params.set('opt', 'x');
        expect(getEnumParam(params, 'opt', allowed)).toBe('x');
    });
});
