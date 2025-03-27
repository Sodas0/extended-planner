from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user, get_password_hash
from datetime import date, timedelta

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/me/tasks", response_model=List[schemas.Task])
def read_user_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = db.query(models.Task).filter(
        models.Task.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return tasks

@router.get("/me/goals", response_model=List[schemas.Goal])
def read_user_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    goals = db.query(models.Goal).filter(
        models.Goal.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return goals

@router.get("/me/activity", response_model=Dict[str, int])
def read_user_activity(
    days: int = 365,
    today: str = None,  # Optional client-provided today param for consistent dates
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Get server's today date
        server_today = date.today()
        print(f"Server date: {server_today.isoformat()}")
        
        # Use client's today if provided, otherwise use server's today
        # This helps handle timezone differences
        if today:
            try:
                # Parse the client's today string (YYYY-MM-DD format)
                client_today = date.fromisoformat(today)
                print(f"Client provided today: {client_today.isoformat()}")
                print(f"Server today: {server_today.isoformat()}")
                
                # Use client's today for consistency
                end_date = client_today
            except ValueError:
                print(f"Invalid client today format: {today}, using server date")
                end_date = server_today
        else:
            end_date = server_today
            
        print(f"Using end_date: {end_date.isoformat()}")
        
        # Calculate date range
        start_date = end_date - timedelta(days=days-1)  # -1 to include today
        
        print(f"Fetching activity for user {current_user.id} from {start_date} to {end_date}")
        
        # Query user activities within the date range
        activities = db.query(models.UserActivity).filter(
            models.UserActivity.user_id == current_user.id,
            models.UserActivity.date >= start_date,
            models.UserActivity.date <= end_date
        ).all()
        
        # Log the found activities
        print(f"Found {len(activities)} activity records")
        for activity in activities:
            print(f"Activity on {activity.date.isoformat()}: {activity.count} tasks")
        
        # Convert to dictionary with date string as key and count as value
        activity_data = {activity.date.isoformat(): activity.count for activity in activities}
        
        # Fill in missing dates with zero count
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.isoformat()
            if date_str not in activity_data:
                activity_data[date_str] = 0
            current_date += timedelta(days=1)
        
        # Check today's count specifically
        today_str = end_date.isoformat()
        print(f"Today's activity count ({today_str}): {activity_data.get(today_str, 0)}")
        
        return activity_data
    except Exception as e:
        print(f"Error retrieving activity data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/me/activity/increment", response_model=Dict[str, int])
def increment_activity(
    today: str = None,  # Optional client-provided today param
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Test endpoint to manually increment the activity count.
    This is helpful for debugging activity tracking.
    """
    # Get server's today date
    server_today = date.today()
    
    # Use client's today if provided, otherwise use server's today
    if today:
        try:
            client_today = date.fromisoformat(today)
            print(f"Increment: Client provided today: {client_today.isoformat()}")
            print(f"Increment: Server today: {server_today.isoformat()}")
            activity_date = client_today
        except ValueError:
            print(f"Increment: Invalid client today format: {today}, using server date")
            activity_date = server_today
    else:
        activity_date = server_today
    
    print(f"Incrementing activity for date: {activity_date.isoformat()}")
    
    # Check if there's already an activity record for today
    db_activity = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == current_user.id,
        models.UserActivity.date == activity_date
    ).first()
    
    if db_activity:
        # Update existing activity count
        old_count = db_activity.count
        db_activity.count += 1
        print(f"Updating activity count for user {current_user.id} on {activity_date}: {old_count} -> {db_activity.count}")
    else:
        # Create new activity record
        db_activity = models.UserActivity(
            date=activity_date,
            count=1,
            user_id=current_user.id
        )
        db.add(db_activity)
        print(f"Creating new activity record for user {current_user.id} on {activity_date} with count 1")
    
    # Commit the changes
    db.commit()
    db.refresh(db_activity)
    
    # Return the updated count
    return {"count": db_activity.count, "date": activity_date.isoformat()}

@router.get("/me/activity/debug", response_model=List[Dict[str, Any]])
def debug_user_activity(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Debug endpoint to view all user activity records in their raw form.
    This helps identify issues with activity tracking.
    """
    # Get all activity records for the user
    activities = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == current_user.id
    ).all()
    
    # Format the results
    results = []
    for activity in activities:
        results.append({
            "id": activity.id,
            "date": activity.date.isoformat(),
            "count": activity.count,
            "user_id": activity.user_id,
            "created_at": activity.created_at.isoformat() if activity.created_at else None
        })
    
    # Also check if we have any records for today
    today = date.today()
    today_record = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == current_user.id,
        models.UserActivity.date == today
    ).first()
    
    # Print summary for server logs
    print(f"User {current_user.id} has {len(activities)} activity records")
    print(f"Today's record exists: {today_record is not None}")
    if today_record:
        print(f"Today's count: {today_record.count}")
    
    return results 