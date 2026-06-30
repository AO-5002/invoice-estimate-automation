"use client";

import { useState, useRef, useEffect } from "react";
import { mutate } from "swr";
import { Check, FileText, Bot } from "lucide-react";
import Modal from "./Modal";
import { KNOWN_CLIENTS } from "../config/ClientConfig";
import { postJSON } from "../lib/fetcher";

const SERVICE_CATEGORIES = [
  "Excavation",
  "Plumbing",
  "Remodeling",
  "Tree Trimming",
] as const;

interface InvoiceFormData {
  invoiceDate: string;
  dateWorkCompleted: string;
  paymentDue: string;
  estimateReference: string;
  invoiceNumber: string;
  clientSelection: string;
  client: string;
  property: string;
  projectDescription: string;
  costToClient: string;
  laborExpense: string;
  equipmentExpense: string;
  materialsExpense: string;
  administrativeNotes: string;
  completionStatus: string;
  serviceCategories: string[];
  // EMAIL-ONLY / NON-SHEET — used for the emailing step, never sent to the backend/Sheets.
  email: string;
}

interface EstimateFormData {
  estimateNumber: string;
  estimateDate: string;
  clientSelection: string;
  client: string;
  // EMAIL-ONLY / NON-SHEET — used for the emailing step, never sent to the backend/Sheets.
  email: string;
  property: string;
  projectDescription: string;
  costToClient: string;
  approved: string;
  administrativeNotes: string;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Maps the invoice form to the server's append payload. Deliberately omits `email`
 * (EMAIL-ONLY / NON-SHEET) and `clientSelection` (a UI-only field); `paymentStatus` is
 * server-set to PENDING and so is not sent.
 */
function toInvoicePayload(form: InvoiceFormData) {
  return {
    invoiceDate: form.invoiceDate,
    dateWorkCompleted: form.dateWorkCompleted,
    paymentDue: form.paymentDue,
    estimateReference: form.estimateReference,
    invoiceNumber: form.invoiceNumber,
    client: form.client,
    property: form.property,
    projectDescription: form.projectDescription,
    costToClient: form.costToClient,
    laborExpense: form.laborExpense,
    equipmentExpense: form.equipmentExpense,
    materialsExpense: form.materialsExpense,
    administrativeNotes: form.administrativeNotes,
    completionStatus: form.completionStatus,
    serviceCategories: form.serviceCategories,
  };
}

type InvoicePayload = ReturnType<typeof toInvoicePayload>;

/**
 * Maps the estimate form to the server's append payload. Deliberately omits `email`
 * (EMAIL-ONLY / NON-SHEET) and `clientSelection` (a UI-only field); `approved` comes straight
 * from the form (no server-forced status).
 */
function toEstimatePayload(form: EstimateFormData) {
  return {
    estimateNumber: form.estimateNumber,
    estimateDate: form.estimateDate,
    client: form.client,
    property: form.property,
    projectDescription: form.projectDescription,
    costToClient: form.costToClient,
    approved: form.approved,
    administrativeNotes: form.administrativeNotes,
  };
}

type EstimatePayload = ReturnType<typeof toEstimatePayload>;

const INITIAL_FORM: InvoiceFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  dateWorkCompleted: "",
  paymentDue: "",
  estimateReference: "",
  invoiceNumber: "",
  clientSelection: "",
  client: "",
  property: "",
  projectDescription: "",
  costToClient: "",
  laborExpense: "",
  equipmentExpense: "",
  materialsExpense: "",
  administrativeNotes: "",
  completionStatus: "",
  serviceCategories: [],
  email: "",
};

const INITIAL_ESTIMATE: EstimateFormData = {
  estimateNumber: "",
  estimateDate: new Date().toISOString().split("T")[0],
  clientSelection: "",
  client: "",
  email: "",
  property: "",
  projectDescription: "",
  costToClient: "",
  approved: "Pending",
  administrativeNotes: "",
};

type RecordType = "invoice" | "estimate";
type Step = "select-type" | "invoice-form" | "estimate-form" | "review" | "success";

export default function CreateRecordModal({
  open,
  onClose,
  onSendWithAgent,
}: {
  open: boolean;
  onClose: () => void;
  onSendWithAgent?: () => void;
}) {
  const [step, setStep] = useState<Step>("select-type");
  const [recordType, setRecordType] = useState<RecordType>("invoice");
  const [form, setForm] = useState<InvoiceFormData>(INITIAL_FORM);
  const [estimateForm, setEstimateForm] =
    useState<EstimateFormData>(INITIAL_ESTIMATE);

  function reset() {
    setStep("select-type");
    setRecordType("invoice");
    setForm(INITIAL_FORM);
    setEstimateForm(INITIAL_ESTIMATE);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  const titles: Record<Step, string> = {
    "select-type": "Create New Record",
    "invoice-form": "New Invoice",
    "estimate-form": "New Estimate",
    review: recordType === "estimate" ? "Review Estimate" : "Review Invoice",
    success: recordType === "estimate" ? "Estimate Created" : "Invoice Created",
  };

  function getReviewItems(): { label: string; value: string }[] {
    if (recordType === "estimate") {
      return [
        { label: "Estimate #", value: estimateForm.estimateNumber },
        { label: "Date of Estimate", value: estimateForm.estimateDate },
        { label: "Client", value: estimateForm.client },
        { label: "Email", value: estimateForm.email },
        { label: "Property", value: estimateForm.property },
        {
          label: "Project Description",
          value: estimateForm.projectDescription,
        },
        {
          label: "Cost to Client",
          value: formatCurrency(estimateForm.costToClient),
        },
        { label: "Approved", value: estimateForm.approved },
        { label: "Admin Notes", value: estimateForm.administrativeNotes },
      ];
    }
    return [
      { label: "Invoice Date", value: form.invoiceDate },
      { label: "Date Work Completed", value: form.dateWorkCompleted },
      { label: "Payment Due", value: form.paymentDue },
      { label: "Payment Status", value: "PENDING" },
      { label: "Estimate Reference", value: form.estimateReference },
      { label: "Invoice #", value: form.invoiceNumber },
      { label: "Client", value: form.client },
      { label: "Email", value: form.email },
      { label: "Property", value: form.property },
      { label: "Project Description", value: form.projectDescription },
      {
        label: "Cost to Client",
        value: formatCurrency(form.costToClient),
      },
      { label: "Labor Expense", value: formatCurrency(form.laborExpense) },
      {
        label: "Equipment Expense",
        value: formatCurrency(form.equipmentExpense),
      },
      {
        label: "Materials Expense",
        value: formatCurrency(form.materialsExpense),
      },
      { label: "Admin Notes", value: form.administrativeNotes },
      { label: "Completion Status", value: form.completionStatus },
      ...(form.serviceCategories.length > 0
        ? [{ label: "Services", value: form.serviceCategories.join(", ") }]
        : []),
    ];
  }

  return (
    <Modal open={open} onClose={handleClose} title={titles[step]}>
      {step === "select-type" && (
        <TypeSelection
          onSelectInvoice={() => {
            setRecordType("invoice");
            setStep("invoice-form");
          }}
          onSelectEstimate={() => {
            setRecordType("estimate");
            setStep("estimate-form");
          }}
        />
      )}
      {step === "invoice-form" && (
        <InvoiceForm
          form={form}
          onChange={setForm}
          onBack={() => setStep("select-type")}
          onReview={() => setStep("review")}
        />
      )}
      {step === "estimate-form" && (
        <EstimateForm
          form={estimateForm}
          onChange={setEstimateForm}
          onBack={() => setStep("select-type")}
          onReview={() => setStep("review")}
        />
      )}
      {step === "review" && (
        <ReviewStep
          recordType={recordType}
          items={getReviewItems()}
          onBack={() =>
            setStep(
              recordType === "estimate" ? "estimate-form" : "invoice-form",
            )
          }
          invoicePayload={
            recordType === "invoice" ? toInvoicePayload(form) : undefined
          }
          estimatePayload={
            recordType === "estimate"
              ? toEstimatePayload(estimateForm)
              : undefined
          }
          onComplete={() => setStep("success")}
          onSendWithAgent={
            onSendWithAgent
              ? () => {
                  handleClose();
                  onSendWithAgent();
                }
              : undefined
          }
        />
      )}
      {step === "success" && (
        <SuccessStep recordType={recordType} onClose={handleClose} />
      )}
    </Modal>
  );
}

function TypeSelection({
  onSelectInvoice,
  onSelectEstimate,
}: {
  onSelectInvoice: () => void;
  onSelectEstimate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-[20px] text-[#989898]">
        What would you like to create?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onSelectInvoice}
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[10px] border border-[#313131] bg-[#1e1e1e] px-4 py-6 text-white transition-colors hover:border-[#7987FF]"
        >
          <FileText className="size-8" />
          <span className="text-[15px] font-medium">Invoice</span>
        </button>
        <button
          onClick={onSelectEstimate}
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[10px] border border-[#313131] bg-[#1e1e1e] px-4 py-6 text-white transition-colors hover:border-[#7987FF]"
        >
          <FileText className="size-8" />
          <span className="text-[15px] font-medium">Estimate</span>
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-3 py-2 text-[13px] text-white placeholder-[#989898]/50 outline-none transition-colors focus:border-[#7987FF]";

const labelClass = "block text-[12px] font-medium text-[#989898] mb-1.5";

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={labelClass}>
        {label}
        {required && <span className="text-[#FFA5CB] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function InvoiceForm({
  form,
  onChange,
  onBack,
  onReview,
}: {
  form: InvoiceFormData;
  onChange: (f: InvoiceFormData) => void;
  onBack: () => void;
  onReview: () => void;
}) {
  const otherClientRef = useRef<HTMLInputElement>(null);
  const isOther = form.clientSelection === "__other__";
  const isKnownClient = form.clientSelection !== "" && !isOther;

  useEffect(() => {
    if (isOther) otherClientRef.current?.focus();
  }, [isOther]);

  const set = (key: keyof InvoiceFormData, value: string | string[]) =>
    onChange({ ...form, [key]: value });

  function handleClientSelection(value: string) {
    if (value === "__other__") {
      onChange({ ...form, clientSelection: "__other__", client: "", email: "" });
    } else if (value === "") {
      onChange({ ...form, clientSelection: "", client: "", email: "" });
    } else {
      const match = KNOWN_CLIENTS.find((c) => c.name === value);
      onChange({
        ...form,
        clientSelection: value,
        client: value,
        email: match?.email ?? "",
      });
    }
  }

  const canSubmit =
    form.invoiceDate &&
    form.client &&
    form.projectDescription &&
    form.costToClient &&
    form.email &&
    isValidEmail(form.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onReview();
  }

  function toggleCategory(cat: string) {
    const next = form.serviceCategories.includes(cat)
      ? form.serviceCategories.filter((c) => c !== cat)
      : [...form.serviceCategories, cat];
    set("serviceCategories", next);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Invoice Date" required>
          <input
            type="date"
            value={form.invoiceDate}
            onChange={(e) => set("invoiceDate", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Date Work Completed">
          <input
            type="date"
            value={form.dateWorkCompleted}
            onChange={(e) => set("dateWorkCompleted", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Payment Due">
          <input
            type="date"
            value={form.paymentDue}
            onChange={(e) => set("paymentDue", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Payment Status">
          <div className="flex h-[38px] items-center rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-3">
            <span className="rounded-full bg-[#7987FF]/20 px-2 py-0.5 text-[12px] font-medium text-[#7987FF]">
              PENDING
            </span>
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Estimate Reference">
          <input
            type="text"
            value={form.estimateReference}
            onChange={(e) => set("estimateReference", e.target.value)}
            placeholder="e.g. EST-001"
            className={inputClass}
          />
        </Field>
        <Field label="Invoice #">
          <input
            type="text"
            value={form.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
            placeholder="e.g. INV-001"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client" required>
          <select
            value={form.clientSelection ?? ""}
            onChange={(e) => handleClientSelection(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a client…
            </option>
            {KNOWN_CLIENTS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value="__other__">Other (enter manually)</option>
          </select>
        </Field>
        <Field label="Property">
          <input
            type="text"
            value={form.property}
            onChange={(e) => set("property", e.target.value)}
            placeholder="Property address"
            className={inputClass}
          />
        </Field>
      </div>

      {isOther && (
        <Field label="Client Name" required>
          <input
            ref={otherClientRef}
            type="text"
            value={form.client}
            onChange={(e) => set("client", e.target.value)}
            placeholder="Enter client name"
            className={inputClass}
            required
          />
        </Field>
      )}

      <Field label="Email" required>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="client@example.com"
          readOnly={isKnownClient}
          className={
            inputClass +
            (isKnownClient ? " opacity-60 cursor-not-allowed" : "")
          }
          required
        />
      </Field>

      <Field label="Project Description" required>
        <textarea
          value={form.projectDescription}
          onChange={(e) => set("projectDescription", e.target.value)}
          placeholder="Describe the work performed..."
          rows={3}
          className={inputClass + " resize-none"}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cost to the Client" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#989898]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costToClient}
              onChange={(e) => set("costToClient", e.target.value)}
              placeholder="0.00"
              className={inputClass + " pl-7"}
              required
            />
          </div>
        </Field>
        <Field label="Labor Expense">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#989898]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.laborExpense}
              onChange={(e) => set("laborExpense", e.target.value)}
              placeholder="0.00"
              className={inputClass + " pl-7"}
            />
          </div>
        </Field>
        <Field label="Equipment Expense">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#989898]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.equipmentExpense}
              onChange={(e) => set("equipmentExpense", e.target.value)}
              placeholder="0.00"
              className={inputClass + " pl-7"}
            />
          </div>
        </Field>
        <Field label="Materials Expense">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#989898]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.materialsExpense}
              onChange={(e) => set("materialsExpense", e.target.value)}
              placeholder="0.00"
              className={inputClass + " pl-7"}
            />
          </div>
        </Field>
      </div>

      <Field label="Administrative Notes">
        <textarea
          value={form.administrativeNotes}
          onChange={(e) => set("administrativeNotes", e.target.value)}
          placeholder="Internal notes..."
          rows={2}
          className={inputClass + " resize-none"}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Completion Status">
          <select
            value={form.completionStatus}
            onChange={(e) => set("completionStatus", e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className={labelClass}>Service Categories</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex cursor-pointer items-center gap-2 text-[13px] text-white"
            >
              <input
                type="checkbox"
                checked={form.serviceCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="size-4 appearance-none rounded border border-[#313131] bg-[#1e1e1e] checked:border-[#7987FF] checked:bg-[#7987FF] cursor-pointer"
              />
              {cat}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between border-t border-[#313131] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] text-[#989898] transition-colors hover:text-white"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-[8px] bg-[#7987FF] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review
        </button>
      </div>
    </form>
  );
}

function EstimateForm({
  form,
  onChange,
  onBack,
  onReview,
}: {
  form: EstimateFormData;
  onChange: (f: EstimateFormData) => void;
  onBack: () => void;
  onReview: () => void;
}) {
  const otherClientRef = useRef<HTMLInputElement>(null);
  const isOther = form.clientSelection === "__other__";
  const isKnownClient = form.clientSelection !== "" && !isOther;

  useEffect(() => {
    if (isOther) otherClientRef.current?.focus();
  }, [isOther]);

  const set = (key: keyof EstimateFormData, value: string) =>
    onChange({ ...form, [key]: value });

  function handleClientSelection(value: string) {
    if (value === "__other__") {
      onChange({ ...form, clientSelection: "__other__", client: "", email: "" });
    } else if (value === "") {
      onChange({ ...form, clientSelection: "", client: "", email: "" });
    } else {
      const match = KNOWN_CLIENTS.find((c) => c.name === value);
      onChange({
        ...form,
        clientSelection: value,
        client: value,
        email: match?.email ?? "",
      });
    }
  }

  const canSubmit =
    form.estimateNumber &&
    form.estimateDate &&
    form.client &&
    form.projectDescription &&
    form.costToClient &&
    form.email &&
    isValidEmail(form.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onReview();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Estimate #" required>
          <input
            type="text"
            value={form.estimateNumber}
            onChange={(e) => set("estimateNumber", e.target.value)}
            placeholder="e.g. EST-001"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Date of Estimate Sent to Client" required>
          <input
            type="date"
            value={form.estimateDate}
            onChange={(e) => set("estimateDate", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client" required>
          <select
            value={form.clientSelection ?? ""}
            onChange={(e) => handleClientSelection(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a client…
            </option>
            {KNOWN_CLIENTS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value="__other__">Other (enter manually)</option>
          </select>
        </Field>
        <Field label="Property">
          <input
            type="text"
            value={form.property}
            onChange={(e) => set("property", e.target.value)}
            placeholder="e.g. mobile home, house direction"
            className={inputClass}
          />
        </Field>
      </div>

      {isOther && (
        <Field label="Client Name" required>
          <input
            ref={otherClientRef}
            type="text"
            value={form.client}
            onChange={(e) => set("client", e.target.value)}
            placeholder="Enter client name"
            className={inputClass}
            required
          />
        </Field>
      )}

      <Field label="Email" required>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="client@example.com"
          readOnly={isKnownClient}
          className={
            inputClass +
            (isKnownClient ? " opacity-60 cursor-not-allowed" : "")
          }
          required
        />
      </Field>

      <Field label="Project Description" required>
        <textarea
          value={form.projectDescription}
          onChange={(e) => set("projectDescription", e.target.value)}
          placeholder="Describe the work to be performed..."
          rows={3}
          className={inputClass + " resize-none"}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cost to the Client" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#989898]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costToClient}
              onChange={(e) => set("costToClient", e.target.value)}
              placeholder="0.00"
              className={inputClass + " pl-7"}
              required
            />
          </div>
        </Field>
        <Field label="Approved">
          <select
            value={form.approved}
            onChange={(e) => set("approved", e.target.value)}
            className={inputClass}
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </Field>
      </div>

      <Field label="Administrative Notes">
        <textarea
          value={form.administrativeNotes}
          onChange={(e) => set("administrativeNotes", e.target.value)}
          placeholder="Internal notes..."
          rows={2}
          className={inputClass + " resize-none"}
        />
      </Field>

      <div className="flex items-center justify-between border-t border-[#313131] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] text-[#989898] transition-colors hover:text-white"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-[8px] bg-[#7987FF] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review
        </button>
      </div>
    </form>
  );
}

function formatCurrency(value: string) {
  if (!value) return "—";
  return `$${parseFloat(value).toFixed(2)}`;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 text-[13px]">
      <span className="text-[#989898]">{label}</span>
      <span className="text-white text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function ReviewStep({
  recordType,
  items,
  invoicePayload,
  estimatePayload,
  onBack,
  onComplete,
  onSendWithAgent,
}: {
  recordType: RecordType;
  items: { label: string; value: string }[];
  invoicePayload?: InvoicePayload;
  estimatePayload?: EstimatePayload;
  onBack: () => void;
  onComplete: () => void;
  onSendWithAgent?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleComplete() {
    // NOTE: email is EMAIL-ONLY / NON-SHEET — both payloads already omit it (and clientSelection).
    const isEstimate = recordType === "estimate";
    const path = isEstimate ? "/api/estimates/append" : "/api/invoices/append";
    const key = isEstimate ? "/api/estimates" : "/api/invoices";
    const payload = isEstimate ? estimatePayload : invoicePayload;
    if (!payload) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await postJSON(path, payload);
      await mutate(key);
      onComplete();
    } catch {
      setSubmitError(
        `Failed to save the ${isEstimate ? "estimate" : "invoice"}. Please try again.`,
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] leading-[20px] text-[#989898]">
        Does this look good?
      </p>

      <div className="flex flex-col divide-y divide-[#313131]/50 rounded-[10px] border border-[#313131] bg-[#1e1e1e] px-4 py-2">
        {items.map((item) => (
          <ReviewRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {submitError && (
        <p role="alert" className="text-[13px] text-[#FFA5CB]">
          {submitError}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-[#313131] pt-4">
        <button
          onClick={onBack}
          className="text-[13px] text-[#989898] transition-colors hover:text-white"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="flex items-center gap-2 rounded-[8px] bg-[#7987FF] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="size-4" />
            {submitting ? "Saving…" : "Complete"}
          </button>
          <button
            disabled={!onSendWithAgent || submitting}
            onClick={onSendWithAgent}
            className={`flex items-center gap-2 rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-5 py-2 text-[13px] font-medium ${
              onSendWithAgent && !submitting
                ? "text-white transition-colors hover:border-[#7987FF]"
                : "text-[#989898] opacity-50 cursor-not-allowed"
            }`}
            title={onSendWithAgent ? undefined : "Coming soon"}
          >
            <Bot className="size-4" />
            Send with Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessStep({
  recordType,
  onClose,
}: {
  recordType: RecordType;
  onClose: () => void;
}) {
  const isEstimate = recordType === "estimate";
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#7987FF]/20">
        <Check className="size-7 text-[#7987FF]" />
      </div>
      <div className="text-center">
        <p className="text-[17px] font-semibold text-white">
          {isEstimate ? "Estimate Created" : "Invoice Created"}
        </p>
        <p className="mt-1 text-[13px] text-[#989898]">
          {isEstimate
            ? "Approval status set to PENDING."
            : "Payment status set to PENDING."}
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 rounded-[8px] bg-[#7987FF] px-6 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Done
      </button>
    </div>
  );
}
