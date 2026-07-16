import json
from fastapi import HTTPException
from langchain_core.messages import HumanMessage, SystemMessage


class VisualizationService:

    def __init__(self, llm):
        self.llm = llm

    async def generate_chart(self, message, answer):
        """
        Sends the user question + assistant answer to Claude Haiku.
        Haiku returns ONLY a structured chart-spec JSON — no prose, no markdown fences.

        Supported chart_type values:
        bar | line | area | pie | scatter | kpi | metric

        Response shape (examples):

        Multi-value:
        {
        "chart_type": "bar",
        "title": "Sales by Brand",
        "x_key": "label",
        "y_key": "value",
        "x_label": "Brand",
        "y_label": "Sales (M)",
        "data": [{"label": "MDL", "value": 853.7}, ...]
        }

        KPI / scalar:
        {
        "chart_type": "kpi",
        "title": "Day Sales",
        "value": 170.8,
        "unit": "Millions",
        "trend": "+9.8%",
        "trend_direction": "up"
        }
        """
        system = (
            "You are a data visualization expert. "
            "Given a user's question and an AI analyst's answer, decide the best chart type "
            "and extract the data needed to render it.\n\n"
            "Output ONLY a single valid JSON object — no markdown fences, no explanation.\n\n"
            "Supported chart_type values: bar, line, area, pie, scatter, kpi, metric\n\n"
            "For multi-value data use this shape:\n"
            '{"chart_type":"bar","title":"...","x_key":"label","y_key":"value",'
            '"x_label":"...","y_label":"...","data":[{"label":"...","value":0}]}\n\n'
            "For a single scalar / KPI use:\n"
            '{"chart_type":"kpi","title":"...","value":0,"unit":"...","trend":"...","trend_direction":"up|down|neutral"}\n\n'
            "Pick the most appropriate chart_type:\n"
            "- bar: comparisons across categories\n"
            "- line: trends over time\n"
            "- area: cumulative trends\n"
            "- pie: part-of-whole (≤6 slices)\n"
            "- scatter: correlation\n"
            "- kpi: single number / metric\n"
            "- metric: single number with no trend"
            )

        user_prompt = (
        f"User question: {message}\n\n"
        f"Analyst answer: {answer}\n\n"
        "Return the chart specification JSON."
        )

        response = await self.llm.ainvoke(
            [
                SystemMessage(content=system),
                HumanMessage(content=user_prompt),
            ]
        )

        raw = response.content.strip()
        # Strip accidental markdown fences if Haiku adds them
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
            raw = raw.rsplit("```", 1)[0]

        try:
            chart_spec = json.loads(raw)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Chart spec parse error: {e}. Raw: {raw[:300]}")

        return chart_spec
