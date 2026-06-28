from pydantic import BaseModel, Field


class InvoiceRecord(BaseModel):
    invoice_date: str = Field(alias="invoiceDate")
    date_work_completed: str = Field(alias="dateWorkCompleted")
    payment_due: str = Field(alias="paymentDue")
    estimate_reference: str = Field(alias="estimateReference")
    invoice_number: str = Field(alias="invoiceNumber")
    client: str
    property: str
    project_description: str = Field(alias="projectDescription")
    cost_to_client: str = Field(alias="costToClient")
    labor_expense: str = Field(alias="laborExpense")
    equipment_expense: str = Field(alias="equipmentExpense")
    materials_expense: str = Field(alias="materialsExpense")
    administrative_notes: str = Field(alias="administrativeNotes")
    completion_status: str = Field(alias="completionStatus")
    service_categories: list[str] = Field(alias="serviceCategories")

    model_config = {
        "populate_by_name": True,
    }
