from fastapi import APIRouter, Depends
from app.schemas.visualization import VisualizationRequest
from app.services import VisualizationService
from app.services.llm import haiku_llm



router = APIRouter(prefix="/visualize", tags=["Visualization"])

@router.post("")
async def visualize(
    request: VisualizationRequest,
):
    service = VisualizationService(haiku_llm)

    code = await service.generate_chart(
        request.message,
        request.answer
    )

    return {
        "react_code": code
    }
