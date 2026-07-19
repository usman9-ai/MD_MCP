import csv
import json
import re
from pathlib import Path
from typing import Any


class AgentValidationLogger:
    fieldnames = [
        "question_uuid",
        "started_at",
        "finished_at",
        "duration_ms",
        "user_id",
        "session_id",
        "original_question",
        "user_profile_json",
        "follow_up_node_response",
        "enhanced_prompt",
        "final_agent_response",
        "tool_calls_summary",
        "validation_status",
        "correct_answer",
        "validator_notes",
        "error_category",
        "dashboard_reference",
    ]

    def __init__(self, log_file: Path | None = None):
        backend_root = Path(__file__).resolve().parents[2]
        self.log_file = log_file or backend_root / "logs" / "agent_validation_runs.csv"

    def append_turn(self, validation_log: dict[str, Any]) -> None:
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

        row = self._build_row(validation_log)
        file_exists = self.log_file.exists()

        with self.log_file.open("a", newline="", encoding="utf-8-sig") as file:
            writer = csv.DictWriter(file, fieldnames=self.fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)

        self._write_tool_json_files(validation_log)

    def _build_row(self, validation_log: dict[str, Any]) -> dict[str, Any]:
        tool_calls = validation_log.get("tool_calls", [])

        return {
            "question_uuid": validation_log.get("question_uuid", ""),
            "started_at": validation_log.get("started_at", ""),
            "finished_at": validation_log.get("finished_at", ""),
            "duration_ms": validation_log.get("duration_ms", ""),
            "user_id": validation_log.get("user_id", ""),
            "session_id": validation_log.get("session_id", ""),
            "original_question": validation_log.get("original_question", ""),
            "user_profile_json": self._to_json(validation_log.get("user_profile", {})),
            "follow_up_node_response": self._to_json(
                validation_log.get("follow_up_node_response")
            ),
            "enhanced_prompt": validation_log.get("enhanced_prompt", ""),
            "final_agent_response": validation_log.get("final_agent_response", ""),
            "tool_calls_summary": validation_log.get("tool_calls_summary", ""),
            "validation_status": validation_log.get("validation_status", ""),
            "correct_answer": validation_log.get("correct_answer", ""),
            "validator_notes": validation_log.get("validator_notes", ""),
            "error_category": validation_log.get("error_category", ""),
            "dashboard_reference": validation_log.get("dashboard_reference", ""),
        }

    def _write_tool_json_files(self, validation_log: dict[str, Any]) -> None:
        question_uuid = validation_log.get("question_uuid") or "unknown_question_uuid"
        tool_calls = validation_log.get("tool_calls") or []

        base_dir = self.log_file.parent / question_uuid
        tool_calls_dir = base_dir / "tool_calls"
        tool_results_dir = base_dir / "tool_results"

        tool_calls_dir.mkdir(parents=True, exist_ok=True)
        tool_results_dir.mkdir(parents=True, exist_ok=True)

        for index, tool_call in enumerate(tool_calls, start=1):
            tool_call_id = tool_call.get("tool_call_id") or tool_call.get("id") or str(index)
            tool_name = tool_call.get("tool_name") or tool_call.get("name") or "tool"
            sequence = tool_call.get("sequence", index)
            safe_name = self._sanitize_filename(tool_name)
            safe_id = self._sanitize_filename(str(tool_call_id))
            base_name = f"{sequence:02d}_{safe_name}_{safe_id}"

            tool_call_path = tool_calls_dir / f"{base_name}.json"
            self._write_json_file(tool_call_path, tool_call)

            tool_result_data = {
                "question_uuid": question_uuid,
                "sequence": sequence,
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "status": tool_call.get("status"),
                "result": tool_call.get("result"),
                "error": tool_call.get("error"),
                "started_at": tool_call.get("started_at"),
                "finished_at": tool_call.get("finished_at"),
                "duration_ms": tool_call.get("duration_ms"),
            }
            tool_result_path = tool_results_dir / f"{base_name}_result.json"
            self._write_json_file(tool_result_path, tool_result_data)

    def _sanitize_filename(self, name: str) -> str:
        sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
        return sanitized.strip("_.-") or "unnamed"

    def _write_json_file(self, path: Path, data: Any) -> None:
        with path.open("w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2, default=str)

    def _to_json(self, value: Any) -> str:
        return json.dumps(value, ensure_ascii=False, default=str)
