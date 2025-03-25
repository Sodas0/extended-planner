from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    is_pinned: bool = False

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: int
    completed: bool
    progress: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 