from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

def create_user_activity(db: Session, activity: schemas.UserActivityCreate, user_id: int):
    db_activity = models.UserActivity(**activity.model_dump(), user_id=user_id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity 