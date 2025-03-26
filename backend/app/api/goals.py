from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/goals",
    tags=["goals"]
)

@router.post("/", response_model=schemas.Goal)
def create_goal(
    goal: schemas.GoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db_goal = models.Goal(**goal.dict(), owner_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.get("/", response_model=List[schemas.Goal])
def read_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    goals = db.query(models.Goal).filter(
        models.Goal.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return goals

@router.get("/{goal_id}", response_model=schemas.Goal)
def read_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.owner_id == current_user.id
    ).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.put("/{goal_id}", response_model=schemas.Goal)
def update_goal(
    goal_id: int,
    goal: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db_goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.owner_id == current_user.id
    ).first()
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Filter out None values to avoid overwriting with None
    update_data = {key: value for key, value in goal.dict().items() if value is not None}
    for key, value in update_data.items():
        setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db_goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.owner_id == current_user.id
    ).first()
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(db_goal)
    db.commit()
    return {"message": "Goal deleted successfully"} 