export type Endo<T> = (x: T) => T;

export function evolveC<T extends object>(transformations: { [P in keyof T]: Endo<T[P]> }): <U extends {[P in keyof T]: T[P]}>(x: U) => U {
    return function <U extends {[P in keyof T]: T[P]}>(x: U): U {
        const newStruct: U = Object.assign({}, x);

        for (const key in transformations) {
            const f = transformations[key];
            newStruct[key] = f(newStruct[key]);
        }

        return newStruct;
    }
}

export function modifyC<K extends string, T>(key: K, f: Endo<T>): <U extends {[P in K]: T}>(x: U) => U {
    return function <U extends {[P in K]: T}>(struct: U): U {
        const newStruct: U = Object.assign({}, struct);
        newStruct[key] = f(struct[key]);
        return newStruct;
    }
}

export function modifyToC<K extends string, T>(key: K, v: T): <U extends {[P in K]: T}>(x: U) => U {
    return function <U extends {[P in K]: T}>(struct: U): U {
        const newStruct: U = Object.assign({}, struct);
        newStruct[key] = v;
        return newStruct;
    }
}
