/* eslint-disable @typescript-eslint/no-empty-interface,no-void */
import _Ajv from "../ajv_jtd"
import type {JTDSchemaType} from "../../dist/jtd"
import chai from "../chai"
const should = chai.should()

/** type is true if T is identically E */
type TypeEquality<T, E> = [T] extends [E] ? ([E] extends [T] ? true : false) : false

interface A {
  type: "a"
  a: number
}

interface B {
  type: "b"
  b?: string
}

type MyData = A | B

const mySchema: JTDSchemaType<MyData> = {
  discriminator: "type",
  mapping: {
    a: {properties: {a: {type: "float64"}}},
    b: {optionalProperties: {b: {type: "string"}}},
  },
}

describe("JTDSchemaType", () => {
  it("validation should prove the data type", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile<MyData>(mySchema)
    const validData: unknown = {type: "a", a: 1}
    if (validate(validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(validate.errors)

    if (ajv.validate<MyData>(mySchema, validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(ajv.errors)
  })

  it("should typecheck number schemas", () => {
    const numf: JTDSchemaType<number> = {type: "float64"}
    const numi: JTDSchemaType<number> = {type: "int32"}
    // @ts-expect-error
    const numl: JTDSchemaType<number> = {type: "int64"}
    // number literals don't work
    // @ts-expect-error
    const nums: JTDSchemaType<1 | 2 | 3> = {type: "int32"}
    const numNull: JTDSchemaType<number | null> = {type: "int32", nullable: true}

    void [numf, numi, numl, nums, numNull]
  })

  it("should typecheck boolean schemas", () => {
    const bool: JTDSchemaType<boolean> = {type: "boolean"}
    // boolean literals don't
    // @ts-expect-error
    const boolTrue: JTDSchemaType<true> = {type: "boolean"}
    const boolNull: JTDSchemaType<boolean | null> = {type: "boolean", nullable: true}

    void [bool, boolTrue, boolNull]
  })

  it("should typecheck string schemas", () => {
    const str: JTDSchemaType<string> = {type: "string"}
    const time: JTDSchemaType<string> = {type: "timestamp"}
    const strNull: JTDSchemaType<string | null> = {type: "string", nullable: true}

    void [str, time, strNull]
  })

  it("should typecheck dates", () => {
    const time: JTDSchemaType<Date> = {type: "timestamp"}
    const timeNull: JTDSchemaType<Date | null> = {type: "timestamp", nullable: true}

    void [time, timeNull]
  })

  it("should typecheck enumeration schemas", () => {
    const enumerate: JTDSchemaType<"a" | "b"> = {enum: ["a", "b"]}
    // don't need to specify everything
    const enumerateMissing: JTDSchemaType<"a" | "b" | "c"> = {enum: ["a", "b"]}
    // must all be string literals
    // @ts-expect-error
    const enumerateNumber: JTDSchemaType<"a" | "b" | 5> = {enum: ["a", "b"]}
    // can't overgeneralize in schema
    // @ts-expect-error
    const enumerateString: JTDSchemaType<"a" | "b"> = {type: "string"}
    const enumerateNull: JTDSchemaType<"a" | "b" | null> = {enum: ["a", "b"], nullable: true}

    void [enumerate, enumerateMissing, enumerateNumber, enumerateString, enumerateNull]
  })

  it("should typecheck elements schemas", () => {
    const elements: JTDSchemaType<number[]> = {elements: {type: "float64"}}
    const readonlyElements: JTDSchemaType<readonly number[]> = {elements: {type: "float64"}}
    // tuples don't work
    // @ts-expect-error
    const tupleHomo: JTDSchemaType<[number, number]> = {elements: {type: "float64"}}
    const tupleHeteroNum: JTDSchemaType<[number, string]> = {
      // @ts-expect-error
      elements: {type: "float64"},
    }
    const tupleHeteroString: JTDSchemaType<[number, string]> = {
      // @ts-expect-error
      elements: {type: "string"},
    }
    const elemNull: JTDSchemaType<number[] | null> = {elements: {type: "float64"}, nullable: true}

    // can typecheck an array of unions
    const unionElem: TypeEquality<JTDSchemaType<(A | B)[]>, never> = false
    // can't typecheck a union of arrays
    const elemUnion: TypeEquality<JTDSchemaType<A[] | B[]>, never> = true

    void [
      elements,
      readonlyElements,
      tupleHomo,
      tupleHeteroNum,
      tupleHeteroString,
      elemNull,
      unionElem,
      elemUnion,
    ]
  })

  it("should typecheck values schemas", () => {
    const values: JTDSchemaType<Record<string, number>> = {values: {type: "float64"}}
    const readonlyValues: JTDSchemaType<Readonly<Record<string, number>>> = {
      values: {type: "float64"},
    }
    // values must be a whole mapping
    // @ts-expect-error
    const valuesDefined: JTDSchemaType<{prop: number}> = {values: {type: "float64"}}
    const valuesNull: JTDSchemaType<Record<string, number> | null> = {
      values: {type: "float64"},
      nullable: true,
    }

    // can typecheck a values of unions
    const unionValues: TypeEquality<JTDSchemaType<Record<string, A | B>>, never> = false
    // can't typecheck a union of values
    const valuesUnion: TypeEquality<
      JTDSchemaType<Record<string, A> | Record<string, B>>,
      never
    > = true

    void [values, readonlyValues, valuesDefined, valuesNull, unionValues, valuesUnion]
  })

  it("should typecheck properties schemas", () => {
    const properties: JTDSchemaType<{a: number; b: string}> = {
      properties: {a: {type: "float64"}, b: {type: "string"}},
    }
    const optionalProperties: JTDSchemaType<{a?: number; b?: string}> = {
      optionalProperties: {a: {type: "float64"}, b: {type: "string"}},
      additionalProperties: false,
    }
    const mixedProperties: JTDSchemaType<{a: number; b?: string}> = {
      properties: {a: {type: "float64"}},
      optionalProperties: {b: {type: "string"}},
      additionalProperties: true,
    }
    const fewerProperties: JTDSchemaType<{a: number; b: string}> = {
      // @ts-expect-error
      properties: {a: {type: "float64"}},
    }
    const propertiesNull: JTDSchemaType<{a: number; b: string} | null> = {
      properties: {a: {type: "float64"}, b: {type: "string"}},
      nullable: true,
    }

    // can't use properties for any object (e.g. keyof = never)
    const noProperties: TypeEquality<JTDSchemaType<unknown>, never> = true

    void [
      properties,
      optionalProperties,
      mixedProperties,
      fewerProperties,
      propertiesNull,
      noProperties,
    ]
  })

  it("should typecheck discriminator schemas", () => {
    const union: JTDSchemaType<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    // can't mess up, e.g. value type isn't a union
    const unionDuplicate: JTDSchemaType<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        // @ts-expect-error
        b: {properties: {a: {type: "float64"}}},
      },
    }
    // must specify everything
    const unionMissing: JTDSchemaType<A | B> = {
      discriminator: "type",
      // @ts-expect-error
      mapping: {
        a: {properties: {a: {type: "float64"}}},
      },
    }
    // can use any valid discrinimator
    type Mult = JTDSchemaType<(A & {typ: "alpha"}) | (B & {typ: "beta"})>
    const multOne: Mult = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}, typ: {enum: ["alpha"]}}},
        b: {
          properties: {typ: {enum: ["beta"]}},
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    const multTwo: Mult = {
      discriminator: "typ",
      mapping: {
        alpha: {properties: {a: {type: "float64"}, type: {enum: ["a"]}}},
        beta: {
          properties: {type: {enum: ["b"]}},
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    const unionNull: JTDSchemaType<A | B | null> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {
          optionalProperties: {b: {type: "string"}},
        },
      },
      nullable: true,
    }

    // properties must have common key
    const noCommon: TypeEquality<
      JTDSchemaType<{key1: "a"; a: number} | {key2: "b"; b: string}>,
      never
    > = true

    void [union, unionDuplicate, unionMissing, multOne, multTwo, unionNull, noCommon]
  })

  it("should typecheck empty schemas", () => {
    const empty: JTDSchemaType<Record<string, never>> = {}
    // can only use empty for empty and null
    // @ts-expect-error
    const emptyButFull: JTDSchemaType<{a: string}> = {}
    const emptyNull: JTDSchemaType<null> = {nullable: true}
    const emptyMeta: JTDSchemaType<Record<string, never>> = {metadata: {}}

    void [empty, emptyButFull, emptyNull, emptyMeta]
  })

  it("should typecheck ref schemas", () => {
    const refs: JTDSchemaType<number[], {num: number}> = {
      definitions: {
        num: {type: "float64"},
      },
      elements: {ref: "num"},
    }
    const missingDef: JTDSchemaType<number[], {num: number}> = {
      // @ts-expect-error
      definitions: {},
      elements: {ref: "num"},
    }
    const missingType: JTDSchemaType<number[]> = {
      definitions: {},
      // @ts-expect-error
      elements: {ref: "num"},
    }
    const nullRefs: JTDSchemaType<number | null, {num: number}> = {
      definitions: {
        num: {type: "float64"},
      },
      ref: "num",
      nullable: true,
    }
    const refsNullOne: JTDSchemaType<number | null, {num: number | null}> = {
      definitions: {
        num: {type: "float64", nullable: true},
      },
      ref: "num",
    }
    const refsNullTwo: JTDSchemaType<number | null, {num: number | null}> = {
      definitions: {
        num: {type: "float64", nullable: true},
      },
      ref: "num",
      nullable: true,
    }

    void [refs, missingDef, missingType, nullRefs, refsNullOne, refsNullTwo]
  })

  it("should typecheck metadata schemas", () => {
    const meta: JTDSchemaType<number> = {type: "float32", metadata: {key: "val"}}
    const emptyMeta: JTDSchemaType<Record<string, never>> = {metadata: {key: "val"}}
    const nullMeta: JTDSchemaType<null> = {nullable: true, metadata: {key: "val"}}

    void [meta, emptyMeta, nullMeta]
  })

  it("should typecheck nullable schemas", () => {
    const isNull: JTDSchemaType<null> = {nullable: true}
    // @ts-expect-error
    const numNotNull: JTDSchemaType<number | null> = {type: "float32"}

    void [isNull, numNotNull]
  })
})
