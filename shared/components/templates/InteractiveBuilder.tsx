"use client"

import { useMemo } from "react"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { InputText } from "primereact/inputtext"
import { FieldErrors, FieldValues, useFieldArray, useFormContext } from "react-hook-form"
import {
  TemplateFormValues,
  TemplateInteractiveFormValues,
  defaultInteractiveValues,
} from "@/shared/schemas/template/template-form.schema"
import { TemplateInteractiveType } from "@/shared/models/template/template.model"

type InteractiveErrors = FieldErrors<TemplateInteractiveFormValues> | undefined

const interactiveTypeOptions = [
  { label: "Sin interacción", value: "none" },
  { label: "Quick Replies", value: "quick_reply" },
  { label: "CTA", value: "cta" },
  { label: "Lista", value: "list" },
] satisfies { label: string; value: TemplateInteractiveType }[]

const CTA_TYPE_OPTIONS = [
  { label: "Teléfono", value: "call" },
  { label: "URL", value: "url" },
]

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined
  if (typeof error === "string") return error
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : undefined
  }
  return undefined
}

const toErrorsArray = <T extends FieldValues>(errors: unknown): FieldErrors<T>[] | undefined => {
  if (Array.isArray(errors)) return errors as FieldErrors<T>[]
  return undefined
}

const toFieldErrors = <T extends FieldValues>(errors: unknown): FieldErrors<T> | undefined => {
  if (errors && typeof errors === "object") return errors as FieldErrors<T>
  return undefined
}

interface ListSectionEditorProps {
  index: number
  totalRows: number
  errors: InteractiveErrors
  onRemove: () => void
}

const ListSectionEditor = ({ index, totalRows, errors, onRemove }: ListSectionEditorProps) => {
  const { control, watch, setValue } = useFormContext<TemplateFormValues>()

  // Field array para las filas de la sección actual
  const rowsArray = useFieldArray({
    control,
    name: `interactive.listSections.${index}.rows` as const,
  })

  const interactive = watch("interactive") ?? defaultInteractiveValues
  const section = interactive.listSections?.[index]

  const sectionsErrors = toErrorsArray<TemplateInteractiveFormValues["listSections"][number]>(
    errors?.listSections
  )
  const sectionErrors = sectionsErrors?.[index]
  const sectionTitleError = getErrorMessage(sectionErrors?.title)

  const rowsErrors = toErrorsArray<
    TemplateInteractiveFormValues["listSections"][number]["rows"][number]
  >(sectionErrors?.rows)

  const handleAddRow = () => {
    // Límite de 10 filas totales y 10 por sección
    if (rowsArray.fields.length >= 10 || totalRows >= 10) return
    rowsArray.append({ id: "", title: "", description: "" })
  }

  return (
    <Card className="mb-3 border-dashed" title="Sección">
      <div className="grid align-items-end">
        <div className="col-12 md:col-5">
          <label className="font-medium text-900 block mb-2">Título de la sección</label>
          <InputText
            value={section?.title || ""}
            onChange={(event) =>
              setValue(`interactive.listSections.${index}.title`, event.target.value, {
                shouldDirty: true,
              })
            }
            className="w-full"
          />
          {sectionTitleError && (
            <span className="text-sm text-red-500">{sectionTitleError}</span>
          )}
        </div>
        <div className="col-12 md:col-2 flex align-items-center gap-2">
          <Button icon="pi pi-trash" type="button" severity="danger" onClick={onRemove} />
        </div>
      </div>

      {rowsArray.fields.map((rowField, rowIndex) => {
        const rowValue = section?.rows?.[rowIndex]
        const rowErrors = rowsErrors?.[rowIndex]
        const idError = getErrorMessage(rowErrors?.id)
        const titleError = getErrorMessage(rowErrors?.title)
        const descriptionError = getErrorMessage(rowErrors?.description)

        return (
          <div key={rowField.id} className="grid align-items-end mb-2">
            <div className="col-12 md:col-3">
              <label className="font-medium text-900 block mb-2">ID</label>
              <InputText
                value={rowValue?.id || ""}
                onChange={(event) =>
                  setValue(
                    `interactive.listSections.${index}.rows.${rowIndex}.id`,
                    event.target.value,
                    { shouldDirty: true }
                  )
                }
                className="w-full"
              />
              {idError && <span className="text-sm text-red-500">{idError}</span>}
            </div>
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">Título</label>
              <InputText
                value={rowValue?.title || ""}
                onChange={(event) =>
                  setValue(
                    `interactive.listSections.${index}.rows.${rowIndex}.title`,
                    event.target.value,
                    { shouldDirty: true }
                  )
                }
                className="w-full"
              />
              {titleError && <span className="text-sm text-red-500">{titleError}</span>}
            </div>
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">Descripción</label>
              <InputText
                value={rowValue?.description || ""}
                onChange={(event) =>
                  setValue(
                    `interactive.listSections.${index}.rows.${rowIndex}.description`,
                    event.target.value,
                    { shouldDirty: true }
                  )
                }
                className="w-full"
              />
              {descriptionError && (
                <span className="text-sm text-red-500">{descriptionError}</span>
              )}
            </div>
            <div className="col-12 md:col-1">
              <Button
                icon="pi pi-trash"
                type="button"
                severity="danger"
                onClick={() => rowsArray.remove(rowIndex)}
              />
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        label="Agregar opción"
        icon="pi pi-plus"
        className="mt-2"
        onClick={handleAddRow}
        disabled={rowsArray.fields.length >= 10 || totalRows >= 10}
      />
      {getErrorMessage(sectionErrors?.rows) && (
        <span className="block text-sm text-red-500 mt-2">
          {getErrorMessage(sectionErrors?.rows)}
        </span>
      )}
    </Card>
  )
}

export default function InteractiveBuilder() {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TemplateFormValues>()

  const interactive = watch("interactive") ?? defaultInteractiveValues
  const interactiveErrors = errors.interactive as InteractiveErrors

  // TEMP DEBUG LOGS - REMOVE AFTER FIXING
  console.log('DEBUG InteractiveBuilder: interactive raw:', watch("interactive"), typeof watch("interactive"))
  console.log('DEBUG InteractiveBuilder: listSections:', interactive?.listSections, typeof interactive?.listSections)
  console.log('DEBUG InteractiveBuilder: totalRows calculation attempt:', Array.isArray(interactive?.listSections) ? 'OK' : 'FAIL')

  const quickRepliesArray = useFieldArray({
    control,
    name: "interactive.quickReplies",
  })

  const ctaButtonsArray = useFieldArray({
    control,
    name: "interactive.ctaButtons",
  })

  const listSectionsArray = useFieldArray({
    control,
    name: "interactive.listSections",
  })

  const totalRows = useMemo(
    () =>
      (interactive.listSections ?? []).reduce(
        (acc, section) => acc + (section?.rows?.length ?? 0),
        0
      ),
    [interactive.listSections]
  )

  const quickRepliesErrors = toErrorsArray<
    TemplateInteractiveFormValues["quickReplies"][number]
  >(interactiveErrors?.quickReplies)

  const ctaButtonsErrors = toErrorsArray<
    TemplateInteractiveFormValues["ctaButtons"][number]
  >(interactiveErrors?.ctaButtons)

  const listButtonErrors =
  toFieldErrors<NonNullable<TemplateInteractiveFormValues["listButton"]>>(
    interactiveErrors?.listButton
  )

  const typeError = getErrorMessage(interactiveErrors?.type)
  const quickRepliesError = getErrorMessage(interactiveErrors?.quickReplies)
  const ctaButtonsError = getErrorMessage(interactiveErrors?.ctaButtons)
  const listButtonTextError = getErrorMessage(listButtonErrors?.buttonText)
  const listSectionsError = getErrorMessage(interactiveErrors?.listSections)

  const handleTypeChange = (value: TemplateInteractiveType) => {
    setValue("interactive.type", value, { shouldDirty: true })
    if (value === "none") {
      setValue("interactive.quickReplies", [], { shouldDirty: true })
      setValue("interactive.ctaButtons", [], { shouldDirty: true })
      setValue("interactive.listButton", undefined, { shouldDirty: true })
      setValue("interactive.listSections", [], { shouldDirty: true })
    }
  }

  const handleAddQuickReply = () => {
    if (quickRepliesArray.fields.length >= 3) return
    quickRepliesArray.append({
      type: "reply",
      id: `btn_${Date.now()}`,
      title: "",
    })
  }

  const handleAddCtaButton = () => {
    if (ctaButtonsArray.fields.length >= 2) return
    const hasCall = ctaButtonsArray.fields.some((field) => field.type === "call")
    ctaButtonsArray.append({
      type: hasCall ? "url" : "call",
      title: "",
    })
  }

  const handleAddListSection = () => {
    if (listSectionsArray.fields.length >= 10) return
    listSectionsArray.append({ title: "", rows: [] })
  }

  return (
    <Card className="mt-3" title="Configuración Interactiva">
      <div className="grid">
        <div className="col-12 md:col-4">
          <label className="font-medium text-900 block mb-2">Tipo interactivo</label>
          <Dropdown
            value={interactive.type}
            options={interactiveTypeOptions}
            onChange={(event) => handleTypeChange(event.value as TemplateInteractiveType)}
            className="w-full"
          />
          {typeError && <span className="text-red-500 text-sm">{typeError}</span>}
        </div>
      </div>

      {interactive.type === "quick_reply" && (
        <section>
          <Divider align="left" type="dashed">
            <span className="text-sm text-900">Botones de Quick Reply</span>
          </Divider>

          {quickRepliesArray.fields.map((field, index) => {
            const fieldErrors = quickRepliesErrors?.[index]
            const idError = getErrorMessage(fieldErrors?.id)
            const titleError = getErrorMessage(fieldErrors?.title)

            return (
              <div key={field.id} className="grid align-items-end mb-3">
                <div className="col-12 md:col-4">
                  <label className="font-medium text-900 block mb-2">ID</label>
                  <InputText
                    value={interactive.quickReplies?.[index]?.id || ""}
                    onChange={(event) =>
                      setValue(
                        `interactive.quickReplies.${index}.id`,
                        event.target.value,
                        { shouldDirty: true }
                      )
                    }
                    className="w-full"
                  />
                  {idError && <span className="text-sm text-red-500">{idError}</span>}
                </div>
                <div className="col-12 md:col-5">
                  <label className="font-medium text-900 block mb-2">Título</label>
                  <InputText
                    value={interactive.quickReplies?.[index]?.title || ""}
                    onChange={(event) =>
                      setValue(
                        `interactive.quickReplies.${index}.title`,
                        event.target.value,
                        { shouldDirty: true }
                      )
                    }
                    className="w-full"
                  />
                  {titleError && (
                    <span className="text-sm text-red-500">{titleError}</span>
                  )}
                </div>
                <div className="col-12 md:col-3 flex gap-2">
                  <InputNumber
                    value={(interactive.quickReplies?.[index]?.title || "").length}
                    disabled
                    suffix="/20"
                    className="w-full"
                  />
                  <Button
                    icon="pi pi-trash"
                    type="button"
                    severity="danger"
                    onClick={() => quickRepliesArray.remove(index)}
                  />
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            label="Agregar botón"
            icon="pi pi-plus"
            className="mt-2"
            onClick={handleAddQuickReply}
            disabled={quickRepliesArray.fields.length >= 3}
          />
          {quickRepliesError && (
            <span className="block text-sm text-red-500 mt-2">{quickRepliesError}</span>
          )}
        </section>
      )}

      {interactive.type === "cta" && (
        <section>
          <Divider align="left" type="dashed">
            <span className="text-sm text-900">Botones CTA</span>
          </Divider>

          {ctaButtonsArray.fields.map((field, index) => {
            const fieldErrors = ctaButtonsErrors?.[index]
            const titleError = getErrorMessage(fieldErrors?.title)
            const phoneError = getErrorMessage(fieldErrors?.phoneNumber)
            const urlError = getErrorMessage(fieldErrors?.url)

            return (
              <div key={field.id} className="grid align-items-end mb-3">
                <div className="col-12 md:col-3">
                  <label className="font-medium text-900 block mb-2">Tipo</label>
                  <Dropdown
                    value={interactive.ctaButtons?.[index]?.type}
                    options={CTA_TYPE_OPTIONS}
                    onChange={(event) =>
                      setValue(
                        `interactive.ctaButtons.${index}.type`,
                        event.value,
                        { shouldDirty: true }
                      )
                    }
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-4">
                  <label className="font-medium text-900 block mb-2">Título</label>
                  <InputText
                    value={interactive.ctaButtons?.[index]?.title || ""}
                    onChange={(event) =>
                      setValue(
                        `interactive.ctaButtons.${index}.title`,
                        event.target.value,
                        { shouldDirty: true }
                      )
                    }
                    className="w-full"
                  />
                  {titleError && (
                    <span className="text-sm text-red-500">{titleError}</span>
                  )}
                </div>
                {interactive.ctaButtons?.[index]?.type === "call" && (
                  <div className="col-12 md:col-4">
                    <label className="font-medium text-900 block mb-2">Teléfono</label>
                    <InputText
                      value={interactive.ctaButtons?.[index]?.phoneNumber || ""}
                      onChange={(event) =>
                        setValue(
                          `interactive.ctaButtons.${index}.phoneNumber`,
                          event.target.value,
                          { shouldDirty: true }
                        )
                      }
                      className="w-full"
                    />
                    {phoneError && (
                      <span className="text-sm text-red-500">{phoneError}</span>
                    )}
                  </div>
                )}
                {interactive.ctaButtons?.[index]?.type === "url" && (
                  <div className="col-12 md:col-4">
                    <label className="font-medium text-900 block mb-2">URL</label>
                    <InputText
                      value={interactive.ctaButtons?.[index]?.url || ""}
                      onChange={(event) =>
                        setValue(
                          `interactive.ctaButtons.${index}.url`,
                          event.target.value,
                          { shouldDirty: true }
                        )
                      }
                      className="w-full"
                    />
                    {urlError && (
                      <span className="text-sm text-red-500">{urlError}</span>
                    )}
                  </div>
                )}
                <div className="col-12 md:col-1">
                  <Button
                    icon="pi pi-trash"
                    type="button"
                    severity="danger"
                    onClick={() => ctaButtonsArray.remove(index)}
                  />
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            label="Agregar CTA"
            icon="pi pi-plus"
            className="mt-2"
            onClick={handleAddCtaButton}
            disabled={ctaButtonsArray.fields.length >= 2}
          />
          {ctaButtonsError && (
            <span className="block text-sm text-red-500 mt-2">{ctaButtonsError}</span>
          )}
        </section>
      )}

      {interactive.type === "list" && (
        <section>
          <Divider align="left" type="dashed">
            <span className="text-sm text-900">Mensaje tipo lista</span>
          </Divider>

          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">Texto del botón</label>
              <InputText
                value={interactive.listButton?.buttonText || ""}
                onChange={(event) =>
                  setValue(
                    "interactive.listButton",
                    { buttonText: event.target.value },
                    { shouldDirty: true }
                  )
                }
                className="w-full"
              />
              {listButtonTextError && (
                <span className="text-sm text-red-500">{listButtonTextError}</span>
              )}
            </div>
          </div>

          {listSectionsArray.fields.map((field, sectionIndex) => (
            <ListSectionEditor
              key={field.id}
              index={sectionIndex}
              totalRows={totalRows}
              errors={interactiveErrors}
              onRemove={() => listSectionsArray.remove(sectionIndex)}
            />
          ))}

          <Button
            type="button"
            label="Agregar sección"
            icon="pi pi-plus"
            className="mt-3"
            onClick={handleAddListSection}
            disabled={listSectionsArray.fields.length >= 10 || totalRows >= 10}
          />
          {listSectionsError && (
            <span className="block text-sm text-red-500 mt-2">{listSectionsError}</span>
          )}
        </section>
      )}
    </Card>
  )
}
