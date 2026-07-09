"use client";

import { PencilLine } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useForm,
  useWatch,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { createMembershipBenefit } from "../actions/create-membership-benefit";

import { updateMembershipBenefit } from "../actions/update-membership-benefit";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

function getBenefitTypeLabel(
  type: BenefitType
) {
  switch (type) {
    case BenefitType.FREE:
      return "Livre";
    case BenefitType.PERCENTAGE_DISCOUNT:
      return "Desconto percentual";
    case BenefitType.FIXED_DISCOUNT:
      return "Desconto fixo";
    case BenefitType.LIMITED:
      return "Uso controlado";
    default:
      return type;
  }
}

type MembershipBenefitDialogInitialData = {
  id: string;
  membershipPlanId: string;
  type: BenefitType;
  title: string;
  description?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
};

type Props = {
  mode?: "create" | "edit";

  plans: Array<{
    id: string;
    name: string;
  }>;

  initialData?: MembershipBenefitDialogInitialData;

  defaultMembershipPlanId?: string;

  trigger?: React.ReactNode;
};

export function MembershipBenefitDialog({
  mode = "create",
  plans,
  initialData,
  defaultMembershipPlanId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");

  const form =
    useForm<MembershipBenefitSchema>({
      resolver: zodResolver(
        membershipBenefitSchema
      ),

      defaultValues: {
        membershipPlanId: "",

        type:
          BenefitType.PERCENTAGE_DISCOUNT,

        title: "",

        description: "",

        discountPercentage: 0,

        discountAmount: 0,

        usagePolicy: "UNLIMITED",

        usageLimit: undefined,

        resetPeriod: "",
      },
    });

  const getDefaultValues =
    useCallback(
      (): MembershipBenefitSchema => ({
        membershipPlanId:
          defaultMembershipPlanId ?? "",
        type:
          BenefitType.PERCENTAGE_DISCOUNT,
        title: "",
        description: "",
        discountPercentage: 0,
        discountAmount: 0,
        usagePolicy: "UNLIMITED",
        usageLimit: undefined,
        resetPeriod: "",
      }),
      [defaultMembershipPlanId]
    );

  const getInitialFormValues =
    useCallback(
      (): MembershipBenefitSchema => {
        if (
          mode === "edit" &&
          initialData
        ) {
          return {
            membershipPlanId:
              initialData.membershipPlanId,
            type: initialData.type,
            title: initialData.title,
            description:
              initialData.description ?? "",
            discountPercentage:
              initialData.discountPercentage ??
              0,
            discountAmount:
              initialData.discountAmount ??
              0,
            usagePolicy:
              initialData.resetPeriod ===
              ResetPeriod.MONTHLY
                ? "MONTHLY"
                : initialData.usageLimit != null
                  ? "TOTAL"
                  : "UNLIMITED",
            usageLimit:
              initialData.usageLimit ??
              undefined,
            resetPeriod:
              initialData.resetPeriod ?? "",
          };
        }

        return getDefaultValues();
      },
      [
        getDefaultValues,
        initialData,
        mode,
      ]
    );

  useEffect(() => {
    form.reset(getInitialFormValues());
  }, [
    defaultMembershipPlanId,
    form,
    getInitialFormValues,
    initialData,
    mode,
  ]);

  const type = useWatch({
    control: form.control,
    name: "type",
  });
  const usagePolicy = useWatch({
    control: form.control,
    name: "usagePolicy",
  });

  async function saveBenefit(
    values: MembershipBenefitSchema
  ) {
    try {
      if (
        mode === "edit" &&
        initialData
      ) {
        await updateMembershipBenefit(
          initialData.id,
          values
        );

        toast.success(
          "Benefício atualizado."
        );
      } else {
        await createMembershipBenefit(
          values
        );

        toast.success(
          "Benefício criado."
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Não foi possível salvar o benefício."
      );
    }
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
          <Button>
            Novo benefício
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Editar benefício"
              : "Criar benefício"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
        >
          <input
            type="hidden"
            {...form.register(
              "resetPeriod"
            )}
          />

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Plano
            </label>
            <select
              disabled={!editingEnabled}
              {...form.register(
                "membershipPlanId"
              )}
              className="h-10 rounded-md border px-3"
            >
              <option value="">
                Selecione um plano
              </option>

              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Tipo do benefício
            </label>
            <select
              disabled={!editingEnabled}
              {...form.register("type")}
              className="h-10 rounded-md border px-3"
            >
              {Object.values(
                BenefitType
              ).map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {getBenefitTypeLabel(
                    type
                  )}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Título do benefício
            </label>
            <Input
              placeholder="Título do benefício"
              disabled={!editingEnabled}
              {...form.register("title")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Descrição
            </label>
            <Input
              placeholder="Descrição"
              disabled={!editingEnabled}
              {...form.register(
                "description"
              )}
            />
          </div>

          {type ===
            BenefitType.PERCENTAGE_DISCOUNT && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Percentual de desconto
              </label>
              <Input
                type="number"
                placeholder="Percentual de desconto"
                disabled={!editingEnabled}
                {...form.register(
                  "discountPercentage",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          )}

          {type ===
            BenefitType.FIXED_DISCOUNT && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Valor do desconto
              </label>
              <Input
                type="number"
                placeholder="Valor do desconto"
                disabled={!editingEnabled}
                {...form.register(
                  "discountAmount",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Política de uso
            </label>
            <select
              {...form.register(
                "usagePolicy"
              )}
              value={usagePolicy}
              onChange={(event) => {
                const value = event.target
                  .value as MembershipBenefitSchema["usagePolicy"];

                form.setValue(
                  "usagePolicy",
                  value
                );

                if (value === "MONTHLY") {
                  form.setValue(
                    "usageLimit",
                    1
                  );
                  form.setValue(
                    "resetPeriod",
                    ResetPeriod.MONTHLY
                  );
                  return;
                }

                if (value === "TOTAL") {
                  form.setValue(
                    "usageLimit",
                    1
                  );
                  form.setValue(
                    "resetPeriod",
                    ""
                  );
                  return;
                }

                form.setValue(
                  "usageLimit",
                  undefined
                );
                form.setValue(
                  "resetPeriod",
                  ""
                );
              }}
              className="h-10 rounded-md border px-3"
              disabled={!editingEnabled}
            >
              <option value="UNLIMITED">
                Sem limite
              </option>
              <option value="MONTHLY">
                Mensal
              </option>
              <option value="TOTAL">
                Por uso total
              </option>
            </select>
          </div>

          {usagePolicy !==
          "UNLIMITED" ? (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {usagePolicy ===
                "MONTHLY"
                  ? "Quantidade de usos por mês"
                  : "Quantidade total de usos"}
              </label>
              <Input
                type="number"
                min={1}
                placeholder={
                  usagePolicy === "MONTHLY"
                    ? "Informe quantos usos por mês"
                    : "Informe quantos usos no total"
                }
                disabled={!editingEnabled}
                {...form.register(
                  "usageLimit",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Renovação do controle
            </label>
            <Input
              value={
                usagePolicy === "MONTHLY"
                  ? "Mensal"
                  : usagePolicy ===
                      "TOTAL"
                    ? "Sem renovação automática"
                    : "Não se aplica"
              }
              readOnly
            />
          </div>

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
                    title="Salvar alterações do benefício?"
                    description="Isso atualiza a configuração do benefício para o plano selecionado."
                    actionLabel="Salvar alterações"
                    trigger={
                      <Button
                        type="button"
                        className="w-full"
                      >
                        Salvar alterações
                      </Button>
                    }
                    onConfirm={() =>
                      void form.handleSubmit(
                        saveBenefit
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
          ) : (
            <ConfirmDialog
              title="Criar benefício?"
              description="Isso cria um novo benefício para o plano selecionado."
              actionLabel="Criar benefício"
              trigger={
                <Button type="button">
                  Criar benefício
                </Button>
              }
              onConfirm={() =>
                void form.handleSubmit(
                  saveBenefit
                )()
              }
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
