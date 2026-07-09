"use client";

import {
  PatientKind,
  PatientStatus,
} from "@prisma/client";
import { PencilLine } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import { createPatient } from "../actions/create-patient";
import { removePatientDependency } from "../actions/remove-patient-dependency";

import { updatePatient } from "../actions/update-patient";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";
import { formatDateForInput } from "@/features/shared/utils/format-date-for-input";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/provider";
import { normalizeDigits } from "../services/patient-family-utils";

type Props = {
  mode?: "create" | "edit";

  initialData?: {
    id: string;

    fullName: string;

    email: string;

    phone: string;

    birthDate: Date;

    document: string;

    zipCode: string;

    city: string;

    state: string;

    address: string;
    kind: PatientKind;
    responsiblePatientId?: string | null;
    responsiblePatientDocument?: string | null;
    responsiblePatientName?: string | null;
  };

  trigger?: React.ReactNode;
  defaultKind?: PatientKind;
  defaultResponsiblePatientId?: string;
  responsibleOptions?: Array<{
    id: string;
    fullName: string;
    document: string;
    kind: PatientKind;
    status: "ACTIVE" | "INACTIVE";
  }>;
};

export function PatientDialog({
  mode = "create",
  initialData,
  trigger,
  defaultKind = PatientKind.TITULAR,
  defaultResponsiblePatientId,
  responsibleOptions = [],
}: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");

  const form = useForm<PatientSchema>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      birthDate: "",
      document: "",
      zipCode: "",
      city: "",
      state: "",
      address: "",
      kind: defaultKind,
      responsibleDocument: "",
    },
  });
  const errors = form.formState.errors;
  const kind = useWatch({
    control: form.control,
    name: "kind",
  });
  const responsibleDocument = useWatch({
    control: form.control,
    name: "responsibleDocument",
  });

  const selectedResponsible =
    useMemo(() => {
      const normalizedDocument =
        normalizeDigits(
          responsibleDocument ?? ""
        );

      if (!normalizedDocument) {
        return (
          responsibleOptions.find(
            (option) =>
              option.id ===
              defaultResponsiblePatientId
          ) ?? null
        );
      }

      return (
        responsibleOptions.find(
          (option) =>
            normalizeDigits(
              option.document
            ) === normalizedDocument
        ) ?? null
      );
    }, [
      defaultResponsiblePatientId,
      responsibleDocument,
      responsibleOptions,
    ]);

  const getDefaultValues =
    useCallback(() => {
      return {
        fullName: "",
        email: "",
        phone: "",
        birthDate: "",
        document: "",
        zipCode: "",
        city: "",
        state: "",
        address: "",
        kind: defaultKind,
        responsibleDocument:
          defaultResponsiblePatientId
            ? (responsibleOptions.find(
                (option) =>
                  option.id ===
                  defaultResponsiblePatientId
              )?.document ?? "")
            : "",
      };
    }, [
      defaultKind,
      defaultResponsiblePatientId,
      responsibleOptions,
    ]);

  const getInitialFormValues =
    useCallback(() => {
      if (
        mode === "edit" &&
        initialData
      ) {
        return {
          fullName: initialData.fullName,
          email: initialData.email,
          phone: initialData.phone,
          birthDate: formatDateForInput(
            initialData.birthDate
          ),
          document:
            initialData.document,
          zipCode:
            initialData.zipCode,
          city: initialData.city,
          state: initialData.state,
          address:
            initialData.address,
          kind: initialData.kind,
          responsibleDocument:
            initialData.responsiblePatientDocument ??
            "",
        };
      }

      return getDefaultValues();
    }, [
      getDefaultValues,
      initialData,
      mode,
    ]);

  useEffect(() => {
    form.reset(getInitialFormValues());
  }, [
    form,
    getInitialFormValues,
    initialData,
    mode,
  ]);

  async function onSubmit(
    values: PatientSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updatePatient(
          initialData.id,
          values
        );

        toast.success(
          t("patients.dialog.saveSuccess")
        );
      } else {
        await createPatient(values);

        toast.success(
          t("patients.dialog.createSuccess")
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        t("patients.dialog.saveError")
      );
    }
  }

  async function handleRemoveDependency(
    nextStatus: PatientStatus
  ) {
    if (!initialData) {
      return;
    }

    try {
      await removePatientDependency(
        initialData.id,
        nextStatus
      );
      toast.success(
        nextStatus ===
          PatientStatus.ACTIVE
          ? "Dependência removida e paciente convertido em titular ativo."
          : "Dependência removida. O paciente ficou inativo até nova regularização."
      );
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a dependência."
      );
    }
  }

  function onInvalid() {
    toast.error(
      "Revise os campos destacados do paciente antes de continuar."
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setEditingEnabled(
            mode === "create"
          );
          form.reset(
            getInitialFormValues()
          );
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>{t("patients.new")}</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("patients.dialog.editTitle")
              : t("patients.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Revise o cadastro do cliente, habilite a edição quando necessário e confirme ao final."
              : "Cadastre um novo cliente e indique responsável quando for dependente."}
          </DialogDescription>
        </DialogHeader>

        <form className="form-shell-body grid grid-cols-2 gap-4">
          <div className="col-span-2 form-section border-dashed px-4 py-3 text-sm text-muted-foreground">
            Se o cliente for menor de idade ou dependente, será necessário cadastrar primeiro o responsável antes da etapa completa de vínculo familiar.
          </div>

          <div className="col-span-2 form-section">
            <div>
              <h3 className="form-section-title">
                Identidade do cliente
              </h3>
              <p className="form-section-description">
                Defina o tipo de vínculo, dados principais e responsável quando aplicável.
              </p>
            </div>
          </div>

          <div className="col-span-2 field-stack">
            <label className="field-label">
              Tipo do cliente
            </label>
            <select
              disabled={!editingEnabled}
              aria-invalid={
                errors.kind
                  ? "true"
                  : "false"
              }
              {...form.register("kind")}
              className="field-select"
            >
              <option value={PatientKind.TITULAR}>
                Titular
              </option>
              <option value={PatientKind.DEPENDENT}>
                Dependente
              </option>
            </select>
            {errors.kind ? (
              <p className="field-error">
                {errors.kind.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.fullName")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.fullName"
              )}
              disabled={!editingEnabled}
              aria-invalid={
                errors.fullName
                  ? "true"
                  : "false"
              }
              {...form.register(
                "fullName"
              )}
            />
            {errors.fullName ? (
              <p className="field-error">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.email")}
            </label>
            <Input
              placeholder={t("shared.labels.email")}
              disabled={!editingEnabled}
              aria-invalid={
                errors.email
                  ? "true"
                  : "false"
              }
              {...form.register("email")}
            />
            {errors.email ? (
              <p className="field-error">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.phone")}
            </label>
            <Input
              placeholder={t("shared.labels.phone")}
              disabled={!editingEnabled}
              aria-invalid={
                errors.phone
                  ? "true"
                  : "false"
              }
              {...form.register("phone")}
            />
            {errors.phone ? (
              <p className="field-error">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.birthDate")}
            </label>
            <Input
              type="date"
              disabled={!editingEnabled}
              aria-invalid={
                errors.birthDate
                  ? "true"
                  : "false"
              }
              {...form.register(
                "birthDate"
              )}
            />
            {errors.birthDate ? (
              <p className="field-error">
                {errors.birthDate.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.document")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.document"
              )}
              disabled={!editingEnabled}
              aria-invalid={
                errors.document
                  ? "true"
                  : "false"
              }
              {...form.register(
                "document"
              )}
            />
            {errors.document ? (
              <p className="field-error">
                {errors.document.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.zipCode")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.zipCode"
              )}
              disabled={!editingEnabled}
              aria-invalid={
                errors.zipCode
                  ? "true"
                  : "false"
              }
              {...form.register(
                "zipCode"
              )}
            />
            {errors.zipCode ? (
              <p className="field-error">
                {errors.zipCode.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.city")}
            </label>
            <Input
              placeholder={t("shared.labels.city")}
              disabled={!editingEnabled}
              aria-invalid={
                errors.city
                  ? "true"
                  : "false"
              }
              {...form.register("city")}
            />
            {errors.city ? (
              <p className="field-error">
                {errors.city.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              {t("shared.labels.state")}
            </label>
            <Input
              placeholder={t("shared.labels.state")}
              disabled={!editingEnabled}
              maxLength={2}
              aria-invalid={
                errors.state
                  ? "true"
                  : "false"
              }
              {...form.register("state")}
            />
            {errors.state ? (
              <p className="field-error">
                {errors.state.message}
              </p>
            ) : null}
          </div>

          <div className="col-span-2 field-stack">
            <label className="field-label">
              {t("shared.labels.address")}
            </label>
            <Input
              placeholder={t("shared.labels.address")}
              disabled={!editingEnabled}
              aria-invalid={
                errors.address
                  ? "true"
                  : "false"
              }
              {...form.register(
                "address"
              )}
            />
            {errors.address ? (
              <p className="field-error">
                {errors.address.message}
              </p>
            ) : null}
          </div>

          {kind ===
          PatientKind.DEPENDENT ? (
            <div className="col-span-2 form-section bg-surface-subtle">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="field-stack">
                  <label className="field-label">
                    Documento do responsável
                  </label>
                  <Input
                    placeholder="CPF do responsável"
                    disabled={!editingEnabled}
                    aria-invalid={
                      errors.responsibleDocument
                        ? "true"
                        : "false"
                    }
                    {...form.register(
                      "responsibleDocument"
                    )}
                  />
                  {errors.responsibleDocument ? (
                    <p className="field-error">
                      {
                        errors
                          .responsibleDocument
                          .message
                      }
                    </p>
                  ) : null}
                </div>

                <div className="field-stack">
                  <label className="field-label">
                    Responsável localizado
                  </label>
                  <Input
                    readOnly
                    value={
                      selectedResponsible?.fullName ??
                      "Nenhum responsável encontrado."
                    }
                  />
                  <p className="field-help">
                    O plano e a cobrança do dependente seguirão o titular responsável.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="col-span-2">
            {mode === "edit" ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {!editingEnabled ? (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() =>
                        setEditingEnabled(true)
                      }
                    >
                      <PencilLine className="mr-2 size-4" />
                      Habilitar edição
                    </Button>
                  ) : (
                    <>
                      <ConfirmDialog
                        title={t(
                          "patients.dialog.confirmEditTitle"
                        )}
                        description={t(
                          "patients.dialog.confirmEditDescription"
                        )}
                        actionLabel={t("shared.actions.saveChanges")}
                        trigger={
                          <Button
                            type="button"
                            className="w-full"
                          >
                            {t("shared.actions.saveChanges")}
                          </Button>
                        }
                        onConfirm={() =>
                          void form.handleSubmit(
                            onSubmit,
                            onInvalid
                          )()
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setEditingEnabled(
                            false
                          );
                          form.reset(
                            getInitialFormValues()
                          );
                        }}
                      >
                        Cancelar edição
                      </Button>
                    </>
                  )}
                </div>

                {initialData?.kind ===
                  PatientKind.DEPENDENT &&
                editingEnabled ? (
                  <div className="form-section border-dashed">
                    <p className="form-section-title">
                      Remover dependência
                    </p>
                    <p className="form-section-description">
                      Ao remover o vínculo, o cliente volta a ser titular. Para menores de idade, mantenha inativo até indicar um novo responsável.
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <ConfirmDialog
                        title="Converter em titular ativo?"
                        description="Use esta opção apenas quando o cliente puder seguir como titular sem responsável."
                        actionLabel="Converter em titular"
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                          >
                            Tornar titular ativo
                          </Button>
                        }
                        onConfirm={() =>
                          void handleRemoveDependency(
                            PatientStatus.ACTIVE
                          )
                        }
                      />
                      <ConfirmDialog
                        title="Remover dependência e inativar?"
                        description="O cliente ficará inativo até receber um novo titular responsável ou até regularização cadastral."
                        actionLabel="Remover e inativar"
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                          >
                            Remover e inativar
                          </Button>
                        }
                        onConfirm={() =>
                          void handleRemoveDependency(
                            PatientStatus.INACTIVE
                          )
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <ConfirmDialog
                title={t(
                  "patients.dialog.confirmCreateTitle"
                )}
                description={t(
                  "patients.dialog.confirmCreateDescription"
                )}
                actionLabel={t("patients.dialog.createAction")}
                trigger={
                  <Button
                    type="button"
                    className="w-full"
                  >
                    {t("patients.dialog.createAction")}
                  </Button>
                }
                onConfirm={() =>
                  void form.handleSubmit(
                    onSubmit,
                    onInvalid
                  )()
                }
              />
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
