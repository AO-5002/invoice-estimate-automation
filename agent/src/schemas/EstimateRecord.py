from pydantic import BaseModel, Field


class EstimateRecord(BaseModel):
    estimate_number: str = Field(alias="estimateNumber")
    estimate_date: str = Field(alias="estimateDate")
    client: str
    property: str
    project_description: str = Field(alias="projectDescription")
    cost_to_client: str = Field(alias="costToClient")
    approved: str
    administrative_notes: str = Field(alias="administrativeNotes")

    model_config = {
        "populate_by_name": True,
    }
