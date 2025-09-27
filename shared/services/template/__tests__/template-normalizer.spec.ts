import { normalizeTemplate, normalizeTemplateCollection } from "../template-normalizer"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { TemplateModel } from "@/shared/models/template/template.model"

type TestCallback = () => void

const describe = (title: string, fn: TestCallback) => {
  console.info(`\n[spec] ${title}`)
  fn()
}

const it = (title: string, fn: TestCallback) => {
  try {
    fn()
    console.info(`[spec] ✅ ${title}`)
  } catch (error) {
    console.error(`[spec] ❌ ${title}`, error)
  }
}

const expect = <T>(value: T) => ({
  toBe(expected: T) {
    if (value !== expected) {
      throw new Error(`Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`)
    }
  },
  toEqual(expected: T) {
    const serializedValue = JSON.stringify(value)
    const serializedExpected = JSON.stringify(expected)
    if (serializedValue !== serializedExpected) {
      throw new Error(`Expected ${serializedValue} to equal ${serializedExpected}`)
    }
  },
  toBeNull() {
    if (value !== null) {
      throw new Error(`Expected ${JSON.stringify(value)} to be null`)
    }
  },
  toHaveLength(expected: number) {
    if (value == null || typeof (value as unknown as { length?: unknown }).length !== "number") {
      throw new Error("Value does not have a length property")
    }
    const length = (value as unknown as { length: number }).length
    if (length !== expected) {
      throw new Error(
        `Expected length ${length} to equal ${expected}`,
      )
    }
  },
})

describe("template-normalizer", () => {
  const baseTemplate: TemplateModel = {
    id: 1,
    name: "Factura mensual",
    nameTemplate: "Factura mensual",
    textTemplate: "Hola {{1}}",
    categoryTemplateWhatsapp: "UTILITY",
    statusTemplateWhatsapp: "APPROVED",
    interactive_type: "none",
    interactive_buttons: null,
    interactive_sections: null,
  }

  it("should keep valid strings intact", () => {
    const normalized = normalizeTemplate(baseTemplate)

    expect(normalized.name).toBe("Factura mensual")
    expect(normalized.textTemplate).toBe("Hola {{1}}")
    expect(normalized.categoryTemplateWhatsapp).toBe("UTILITY")
    expect(normalized.statusTemplateWhatsapp).toBe("APPROVED")
  })

  it("should fallback to defaults when values are null", () => {
    const normalized = normalizeTemplate({
      ...baseTemplate,
      name: null as unknown as string,
      textTemplate: null as unknown as string,
      categoryTemplateWhatsapp: null as unknown as string,
      statusTemplateWhatsapp: null as unknown as string,
    })

    expect(normalized.name).toBe("(Sin nombre)")
    expect(normalized.textTemplate).toBe("")
    expect(normalized.categoryTemplateWhatsapp).toBe("UNKNOWN")
    expect(normalized.statusTemplateWhatsapp).toBe("PENDING")
  })

  it("should convert non-string primitives to string", () => {
    const normalized = normalizeTemplate({
      ...baseTemplate,
      name: 123 as unknown as string,
      textTemplate: true as unknown as string,
    })

    expect(normalized.name).toBe("123")
    expect(normalized.textTemplate).toBe("true")
  })

  it("should fallback to defaults when interactive values are missing", () => {
    const normalized = normalizeTemplate({
      ...baseTemplate,
      interactive_type: undefined,
      interactive_buttons: undefined,
      interactive_sections: undefined,
    })

    expect(normalized.interactive_type).toBe("none")
    expect(normalized.interactive_buttons).toBeNull()
    expect(normalized.interactive_sections).toBeNull()
  })

  it("should normalize a collection of templates", () => {
    const normalizedCollection = normalizeTemplateCollection([
      baseTemplate,
      {
        ...baseTemplate,
        id: 2,
        name: null as unknown as string,
        textTemplate: undefined,
      },
    ])

    expect(normalizedCollection).toHaveLength(2)
    expect(normalizedCollection[0].name).toBe("Factura mensual")
    expect(normalizedCollection[1].name).toBe("(Sin nombre)")
    expect(normalizedCollection[1].textTemplate).toBe("")
  })

  it("should return empty array for invalid collections", () => {
    expect(normalizeTemplateCollection(undefined)).toEqual([])
    expect(normalizeTemplateCollection(null)).toEqual([])
  })
})
