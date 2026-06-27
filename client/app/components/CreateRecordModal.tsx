"use client";

import { useState, useRef, useEffect } from "react";
import { Check, FileText, Bot } from "lucide-react";
import Modal from "./Modal";
import { KNOWN_CLIENTS } from "../config/ClientConfig";

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

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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

type Step = "select-type" | "invoice-form" | "review" | "success";

export default function CreateRecordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("select-type");
  const [form, setForm] = useState<InvoiceFormData>(INITIAL_FORM);

  function reset() {
    setStep("select-type");
    setForm(INITIAL_FORM);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  const titles: Record<Step, string> = {
    "select-type": "Create New Record",
    "invoice-form": "New Invoice",
    review: "Review Invoice",
    success: "Invoice Created",
  };

  return (
    <Modal open={open} onClose={handleClose} title={titles[step]}>
      {step === "select-type" && (
        <TypeSelection onSelectInvoice={() => setStep("invoice-form")} />
      )}
      {step === "invoice-form" && (
        <InvoiceForm
          form={form}
          onChange={setForm}
          onBack={() => setStep("select-type")}
          onReview={() => setStep("review")}
        />
      )}
      {step === "review" && (
        <ReviewStep
          form={form}
          onBack={() => setStep("invoice-form")}
          onComplete={() => setStep("success")}
        />
      )}
      {step === "success" && <SuccessStep onClose={handleClose} />}
    </Modal>
  );
}

function TypeSelection({ onSelectInvoice }: { onSelectInvoice: () => void }) {
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
          disabled
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[10px] border border-[#313131] bg-[#1e1e1e] px-4 py-6 text-[#989898]/50 opacity-50 cursor-not-allowed"
        >
          <FileText className="size-8" />
          <span className="text-[15px] font-medium">Estimate</span>
          <span className="text-[11px] text-[#989898]">Coming soon</span>
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
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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
  form,
  onBack,
  onComplete,
}: {
  form: InvoiceFormData;
  onBack: () => void;
  onComplete: () => void;
}) {
  function handleComplete() {
    // TODO: Save invoice record to Google Sheets backend.
    // NOTE: form.email is EMAIL-ONLY / NON-SHEET — omit it from the record payload sent to Sheets.
    onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] leading-[20px] text-[#989898]">
        Does this look good?
      </p>

      <div className="flex flex-col divide-y divide-[#313131]/50 rounded-[10px] border border-[#313131] bg-[#1e1e1e] px-4 py-2">
        <ReviewRow label="Invoice Date" value={form.invoiceDate} />
        <ReviewRow label="Date Work Completed" value={form.dateWorkCompleted} />
        <ReviewRow label="Payment Due" value={form.paymentDue} />
        <ReviewRow label="Payment Status" value="PENDING" />
        <ReviewRow label="Estimate Reference" value={form.estimateReference} />
        <ReviewRow label="Invoice #" value={form.invoiceNumber} />
        <ReviewRow label="Client" value={form.client} />
        <ReviewRow label="Email" value={form.email} />
        <ReviewRow label="Property" value={form.property} />
        <ReviewRow
          label="Project Description"
          value={form.projectDescription}
        />
        <ReviewRow
          label="Cost to Client"
          value={formatCurrency(form.costToClient)}
        />
        <ReviewRow
          label="Labor Expense"
          value={formatCurrency(form.laborExpense)}
        />
        <ReviewRow
          label="Equipment Expense"
          value={formatCurrency(form.equipmentExpense)}
        />
        <ReviewRow
          label="Materials Expense"
          value={formatCurrency(form.materialsExpense)}
        />
        <ReviewRow label="Admin Notes" value={form.administrativeNotes} />
        <ReviewRow label="Completion Status" value={form.completionStatus} />
        {form.serviceCategories.length > 0 && (
          <ReviewRow
            label="Services"
            value={form.serviceCategories.join(", ")}
          />
        )}
      </div>

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
            className="flex items-center gap-2 rounded-[8px] bg-[#7987FF] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Check className="size-4" />
            Complete
          </button>
          <button
            disabled
            className="flex items-center gap-2 rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-5 py-2 text-[13px] font-medium text-[#989898] opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <Bot className="size-4" />
            Send with Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#7987FF]/20">
        <Check className="size-7 text-[#7987FF]" />
      </div>
      <div className="text-center">
        <p className="text-[17px] font-semibold text-white">Invoice Created</p>
        <p className="mt-1 text-[13px] text-[#989898]">
          Payment status set to PENDING.
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
