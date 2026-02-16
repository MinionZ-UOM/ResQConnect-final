import logging
import os
import json
from datetime import datetime
from rich.logging import RichHandler


class ModulePathFilter(logging.Filter):
    """Adds relative module path to log records."""
    def filter(self, record):
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        relative_path = os.path.relpath(record.pathname, project_root)
        record.module_path = relative_path.replace(os.sep, '/')
        return True


class JSONFileHandler(logging.FileHandler):
    """Writes logs in JSON format to file."""
    def emit(self, record):
        log_entry = self.format(record)
        self.stream.write(log_entry + '\n')
        self.flush()


class JSONFormatter(logging.Formatter):
    """Formats logs as JSON."""
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "module_path": getattr(record, 'module_path', ''),
            "message": record.getMessage(),
            "function": record.funcName
        }
        return json.dumps(log_record, ensure_ascii=False)


def get_logger(name: str = None) -> logging.Logger:
    """Hybrid logger: colorized Rich console + JSON file logs."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)

        # --- Paths ---
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        logs_dir = os.path.join(project_root, 'logs')
        os.makedirs(logs_dir, exist_ok=True)
        log_date = datetime.now().strftime('%d_%m_%Y')
        log_filename = os.path.join(logs_dir, f"{log_date}_logs.json")

        # --- Console Handler (Rich) ---
        console_handler = RichHandler(
            rich_tracebacks=True,
            markup=True,
            show_path=False,
            show_time=True,
            show_level=True
        )
        console_handler.setLevel(logging.INFO)

        # --- File Handler (JSON) ---
        file_handler = JSONFileHandler(log_filename, mode='a', encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        json_formatter = JSONFormatter(datefmt='%Y-%m-%d %H:%M:%S')
        file_handler.setFormatter(json_formatter)

        # --- Filters ---
        module_filter = ModulePathFilter()
        console_handler.addFilter(module_filter)
        file_handler.addFilter(module_filter)

        # --- Add handlers ---
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)

        # --- Silence noisy dependencies ---
        noisy_libs = [
            "httpx", "httpcore", "urllib3",
            "chromadb", "openai", "langchain",
            "langchain_community", "posthog"
        ]
        for lib in noisy_libs:
            logging.getLogger(lib).setLevel(logging.WARNING)

    return logger
