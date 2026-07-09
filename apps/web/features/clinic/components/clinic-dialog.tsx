"use client";

import { Eye, EyeOff, Mail, PencilLine, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useForm,
  useWatch,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

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

import { createClinic } from "../actions/create-clinic";
import { resetClinicMasterPasswordAction } from "../actions/reset-clinic-master-password";
import { sendClinicMasterPasswordEmailAction } from "../actions/send-clinic-master-password-email";
import { updateClinic } from "../actions/update-clinic";
import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

type Props = {
  mode?: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    brandName: string | null;
    logoUrl: string | null;
    slug: string;
    document: string;
    email: string;
    phone: string;
    zipCode: string;
    city: string;
    state: string;
    address: string;
  };
  trigger?: React.ReactNode;
  isPlatformView?: boolean;
};

const EMPTY_VALUES: ClinicSchema = {
  name: "",
  brandName: "",
  logoUrl: "",
  slug: "",
  document: "",
  email: "",
  phone: "",
  zipCode: "",
  city: "",
  state: "",
  address: "",
};

export function ClinicDialog({
  mode = "create",
  initialData,
  trigger,
  isPlatformView = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");
  const [
    clinicMasterTemporaryPassword,
    setClinicMasterTemporaryPassword,
  ] = useState("");
  const [
    clinicMasterPasswordVisible,
    setClinicMasterPasswordVisible,
  ] = useState(false);

  const form = useForm<ClinicSchema>({
    resolver: zodResolver(clinicSchema),
    defaultValues: EMPTY_VALUES,
  });
  const logoPreview =
    useWatch({
      control: form.control,
      name: "logoUrl",
    }) || "";

  function syncDialogState(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (!nextOpen) {
      return;
    }

    setEditingEnabled(mode === "create");
    setClinicMasterTemporaryPassword("");
    setClinicMasterPasswordVisible(false);
  }

  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset({
        name: initialData.name,
        brandName:
          initialData.brandName ?? "",
        logoUrl:
          initialData.logoUrl ?? "",
        slug: initialData.slug,
        document: initialData.document,
        email: initialData.email,
        phone: initialData.phone,
        zipCode: initialData.zipCode,
        city: initialData.city,
        state: initialData.state,
        address: initialData.address,
      });

      return;
    }

    form.reset(EMPTY_VALUES);
  }, [form, initialData, mode]);

  const errors = form.formState.errors;

  function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !== "image/png" &&
      file.type !== "image/svg+xml"
    ) {
      toast.error(
        "Envie um arquivo SVG ou PNG."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result =
        typeof reader.result ===
        "string"
          ? reader.result
          : "";
      form.setValue("logoUrl", result, {
        shouldDirty: true,
        shouldValidate: true,
      });
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(
    values: ClinicSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updateClinic(
          initialData.id,
          values
        );

        toast.success(
          "Clínica atualizada."
        );
      } else {
        const result =
          await createClinic(values);

        toast.success(
          `Clínica criada. Master: ${result.clinicMasterEmail}. Senha temporária: ${result.clinicMasterTemporaryPassword}`
        );
      }

      form.reset(EMPTY_VALUES);
      setEditingEnabled(mode === "create");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a clínica."
      );
    }
  }

  function onInvalid() {
    toast.error(
      "Revise os campos destacados da clínica antes de continuar."
    );
  }

  async function handleResetClinicMasterPassword() {
    if (!initialData) {
      return;
    }

    try {
      const result =
        await resetClinicMasterPasswordAction(
          initialData.id
        );

      setClinicMasterTemporaryPassword(
        result.temporaryPassword
      );
      setClinicMasterPasswordVisible(false);
      toast.success(
        `Senha do master redefinida para ${result.clinicMasterEmail}.`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel redefinir a senha do master da clinica."
      );
    }
  }

  async function handleSendClinicMasterPassword() {
    if (
      !initialData ||
      !clinicMasterTemporaryPassword
    ) {
      return;
    }

    try {
      const result =
        await sendClinicMasterPasswordEmailAction(
          initialData.id,
          clinicMasterTemporaryPassword
        );

      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel preparar o envio da senha."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={syncDialogState}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>Nova empresa</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Editar empresa"
              : "Criar empresa"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Revise os dados da empresa, habilite a edição quando necessário e confirme as alterações ao final."
              : "Cadastre uma nova empresa cliente com dados operacionais e identidade visual."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="form-shell-body grid grid-cols-2 gap-4"
          noValidate
        >
          <div className="col-span-2 form-section">
            <div>
              <h3 className="form-section-title">
                Identidade da empresa
              </h3>
              <p className="form-section-description">
                Estes dados definem como a empresa aparece na plataforma e para sua equipe.
              </p>
            </div>
          </div>

          <div className="field-stack">
            <label className="field-label">
              Nome
            </label>
            <Input
              placeholder="Razão social ou nome operacional"
              disabled={!editingEnabled}
              aria-invalid={
                errors.name
                  ? "true"
                  : "false"
              }
              {...form.register("name")}
            />
            {errors.name ? (
              <p className="field-error">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              Nome de exibição
            </label>
            <Input
              placeholder="Nome da empresa na interface"
              disabled={!editingEnabled}
              {...form.register(
                "brandName"
              )}
            />
            <p className="field-help">
              Se vazio, usamos o nome principal da empresa.
            </p>
          </div>

          <div className="col-span-2 form-section border-dashed">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
              <div className="space-y-3">
                <div>
                  <label className="field-label">
                    Logo da empresa
                  </label>
                  <p className="field-help">
                    Aceita SVG ou PNG. O arquivo fica salvo na identidade desta
                    empresa.
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".svg,.png,image/svg+xml,image/png"
                  disabled={!editingEnabled}
                  onChange={handleLogoFileChange}
                />
                <Input
                  placeholder="Cole um caminho interno como /logo.svg se preferir"
                  disabled={!editingEnabled}
                  aria-invalid={
                    errors.logoUrl
                      ? "true"
                      : "false"
                  }
                  {...form.register("logoUrl")}
                />
                {errors.logoUrl ? (
                  <p className="field-error">
                    {errors.logoUrl.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <p className="field-label">
                  Pré-visualização
                </p>
                <div className="flex min-h-40 items-center justify-center rounded-[1.25rem] border border-border/70 bg-surface-subtle p-4">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Logo da empresa"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      O logo aparecerá aqui após seleção.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 form-section">
            <div>
              <h3 className="form-section-title">
                Cadastro e localização
              </h3>
              <p className="form-section-description">
                Informações usadas para identificação da conta, contato e governança.
              </p>
            </div>
          </div>

          <div className="field-stack">
            <label className="field-label">
              Slug
            </label>
            <Input
              placeholder="gerado-automaticamente"
              disabled={!editingEnabled}
              aria-invalid={
                errors.slug
                  ? "true"
                  : "false"
              }
              {...form.register("slug")}
            />
            <p className="field-help">
              Opcional. Se ficar em branco, o sistema gera o slug automaticamente.
            </p>
            {errors.slug ? (
              <p className="field-error">
                {errors.slug.message}
              </p>
            ) : null}
          </div>

          <div className="field-stack">
            <label className="field-label">
              Documento
            </label>
            <Input
              placeholder="CNPJ ou documento"
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
              E-mail
            </label>
            <Input
              placeholder="contato@clinica.com"
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
              Telefone
            </label>
            <Input
              placeholder="(11) 99999-9999"
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
              CEP
            </label>
            <Input
              placeholder="00000-000"
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
              Cidade
            </label>
            <Input
              placeholder="Cidade"
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
              Estado
            </label>
            <Input
              placeholder="UF"
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
              Endereço
            </label>
            <Input
              placeholder="Rua, número e complemento"
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

          <div className="col-span-2">
            {mode === "edit" ? (
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
                      title="Salvar alterações da clínica?"
                      description="Isso atualiza os dados da empresa selecionada."
                      actionLabel="Salvar alterações"
                      trigger={
                        <Button
                          type="button"
                          className="w-full"
                        >
                          Confirmar alterações
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
                        form.reset({
                          name:
                            initialData?.name ??
                            "",
                          brandName:
                            initialData?.brandName ??
                            "",
                          logoUrl:
                            initialData?.logoUrl ??
                            "",
                          slug:
                            initialData?.slug ??
                            "",
                          document:
                            initialData?.document ??
                            "",
                          email:
                            initialData?.email ??
                            "",
                          phone:
                            initialData?.phone ??
                            "",
                          zipCode:
                            initialData?.zipCode ??
                            "",
                          city:
                            initialData?.city ??
                            "",
                          state:
                            initialData?.state ??
                            "",
                          address:
                            initialData?.address ??
                            "",
                        });
                      }}
                    >
                      Cancelar edição
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <ConfirmDialog
                title="Criar clínica?"
                description="Isso cria uma nova empresa cliente na plataforma."
                actionLabel="Criar empresa"
                trigger={
                  <Button
                    type="button"
                    className="w-full"
                  >
                    Criar empresa
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

          {mode === "edit" &&
          initialData &&
          isPlatformView ? (
            <div className="col-span-2 form-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="form-section-title">
                    Credencial do master da empresa
                  </h3>
                  <p className="form-section-description">
                    Redefina a senha temporária e prepare o envio para o e-mail principal da empresa.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void handleResetClinicMasterPassword()
                  }
                >
                  <RefreshCcw className="mr-2 size-4" />
                  Resetar senha
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="field-stack">
                  <label className="field-label">
                    Nova senha temporária
                  </label>
                  <div className="relative">
                    <Input
                      readOnly
                      type={
                        clinicMasterPasswordVisible
                          ? "text"
                          : "password"
                      }
                      value={
                        clinicMasterTemporaryPassword
                      }
                      placeholder="A senha aparecerá após o reset."
                    />
                    <button
                      type="button"
                      aria-label={
                        clinicMasterPasswordVisible
                          ? "Ocultar senha temporária"
                          : "Mostrar senha temporária"
                      }
                      onClick={() =>
                        setClinicMasterPasswordVisible(
                          (current) =>
                            !current
                        )
                      }
                      className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground"
                    >
                      {clinicMasterPasswordVisible ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      !clinicMasterTemporaryPassword
                    }
                    onClick={() =>
                      void handleSendClinicMasterPassword()
                    }
                  >
                    <Mail className="mr-2 size-4" />
                    Enviar senha
                  </Button>
                </div>

                <div className="flex items-end">
                  <p className="text-xs text-muted-foreground">
                    O próximo acesso exigirá troca obrigatória da senha.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
