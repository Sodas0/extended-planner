from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user
from datetime import date

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
    
    db_task = models.Task(**task.model_dump(), owner_id=current_user.id)
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
    
    for key, value in task.model_dump().items():
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

@router.patch("/{task_id}", response_model=schemas.Task)
def patch_task(
    task_id: int,
    update_data: schemas.TaskUpdate,
    today: str = None,  # Optional client-provided today parameter
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get current completion status before update
    was_completed = db_task.completed
    
    # Apply updates
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Check if user is completing the task
    task_being_completed = False
    if "completed" in update_dict and update_dict["completed"] and not was_completed:
        task_being_completed = True
    
    # If updating goal_id, verify the goal exists
    if "goal_id" in update_dict and update_dict["goal_id"] is not None:
        goal = db.query(models.Goal).filter(
            models.Goal.id == update_dict["goal_id"],
            models.Goal.owner_id == current_user.id
        ).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
    
    # Update the task with the provided values
    for key, value in update_dict.items():
        setattr(db_task, key, value)
    
    # Track activity if task is being completed
    if task_being_completed:
        # Use client's today if provided, otherwise use server's today
        server_today = date.today()
        if today:
            try:
                # Parse the client's today string (YYYY-MM-DD format)
                client_today = date.fromisoformat(today)
                print(f"Task completion: Client provided today: {client_today.isoformat()}")
                print(f"Task completion: Server today: {server_today.isoformat()}")
                activity_date = client_today
            except ValueError:
                print(f"Task completion: Invalid client today format: {today}, using server date")
                activity_date = server_today
        else:
            activity_date = server_today
        
        # Make sure we correctly format the date for consistent handling
        activity_date_str = activity_date.isoformat()  # Format: YYYY-MM-DD 
        print(f"===== ACTIVITY DEBUG: User {current_user.id} completing task {db_task.id} on {activity_date_str} =====")
        
        # IMPORTANT: Force the data to be committed immediately after updating activity
        # This is a critical fix to ensure the activity count is updated
        try:
            # Check if there's already an activity record for today using raw SQL
            # This is a more direct approach to ensure the query works correctly
            db_activity = db.query(models.UserActivity).filter(
                models.UserActivity.user_id == current_user.id,
                models.UserActivity.date == activity_date
            ).with_for_update().first()
            
            print(f"Found existing activity record: {db_activity is not None}")
            
            if db_activity:
                # Update existing activity count
                old_count = db_activity.count 
                db_activity.count += 1
                print(f"Updating activity count for user {current_user.id} on {activity_date_str} from {old_count} to {db_activity.count}")
            else:
                # Create new activity record
                print(f"Creating new activity record for user {current_user.id} on {activity_date_str} with count 1")
                db_activity = models.UserActivity(
                    date=activity_date,
                    count=1,
                    user_id=current_user.id
                )
                db.add(db_activity)
            
            # Force commit the activity change immediately in its own transaction
            db.commit()
            print(f"Successfully committed activity update, new count: {db_activity.count}")
            
            # Double check the record was saved with a fresh query
            check_activity = db.query(models.UserActivity).filter(
                models.UserActivity.user_id == current_user.id,
                models.UserActivity.date == activity_date
            ).first()
            
            if check_activity:
                print(f"Verified activity record exists with count: {check_activity.count}")
            else:
                print("WARNING: Activity record could not be verified after commit!")
                # If verification failed, try to insert again with explicit SQL
                try:
                    print("Attempting to create activity record with explicit method")
                    if not db_activity:
                        new_activity = models.UserActivity(
                            date=activity_date,
                            count=1,
                            user_id=current_user.id
                        )
                        db.add(new_activity)
                        db.commit()
                        print("Re-created activity record successfully")
                except Exception as inner_e:
                    print(f"Error in explicit insert: {str(inner_e)}")
                
            print(f"===== END ACTIVITY DEBUG =====")
            
        except Exception as e:
            print(f"Error updating activity: {str(e)}")
            # Don't let activity errors prevent task update
            db.rollback()
    
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