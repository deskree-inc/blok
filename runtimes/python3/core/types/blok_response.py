"""
BlokResponse module - Response class for Blok framework nodes.

Migrated from NanoServiceResponse to maintain 100% backward compatibility
while using Blok naming convention.
"""

from typing import Any, List, Optional

from core.node_base import NodeBase
from core.types.global_error import GlobalError
from core.types.response import ResponseContext


class BlokResponse(ResponseContext):
    """
    BlokResponse - Migrated from NanoServiceResponse.

    Maintains 100% backward compatibility while using Blok naming convention.
    """

    def __init__(self):
        super().__init__()
        self.steps: List[NodeBase] = []
        self.data: Any = {}
        self.error: Optional[GlobalError] = None
        self.success: Optional[bool] = True
        self.contentType: Optional[str] = "application/json"

    def set_error(self, error: GlobalError) -> None:
        """Set error state and clear success data."""
        self.error = error
        self.success = False
        self.data = {}

    def set_success(self, data: Any) -> None:
        """Set success state with data and clear error."""
        self.data = data
        self.error = None
        self.success = True
