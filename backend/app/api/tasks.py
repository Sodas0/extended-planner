from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # If task is associated with a goal, verify the goal exists and belongs to the user
    if task.goal_id:
        goal = db.query(models.Goal).filter(
            models.Goal.id == task.goal_id,
            models.Goal.owner_id == current_user.id
        ).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
    
    db_task = models.Task(**task.dict(), owner_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    goal_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Task).filter(models.Task.owner_id == current_user.id)
    
    if goal_id:
        # Verify the goal exists and belongs to the user
        goal = db.query(models.Goal).filter(
            models.Goal.id == goal_id,
            models.Goal.owner_id == current_user.id
        ).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        query = query.filter(models.Task.goal_id == goal_id)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=schemas.Task)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If task is being moved to a goal, verify the goal exists and belongs to the user
    if task.goal_id:
        goal = db.query(models.Goal).filter(
            models.Goal.id == task.goal_id,
            models.Goal.owner_id == current_user.id
        ).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
    
    for key, value in task.dict().items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

@router.patch("/{task_id}/complete", response_model=schemas.Task)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.completed = True
    
    # If task is part of a goal, check if all tasks are completed
    if db_task.goal_id:
        goal = db.query(models.Goal).filter(models.Goal.id == db_task.goal_id).first()
        if goal:
            # Mark goal as completed if all tasks are done
            total_tasks = len(goal.tasks)
            completed_tasks = sum(1 for task in goal.tasks if task.completed)
            if total_tasks > 0 and completed_tasks == total_tasks:
                goal.completed = True
    
    db.commit()
    db.refresh(db_task)
    return db_task 