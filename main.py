from fastapi import FastAPI,Depends,HTTPException,Query,status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine,sessionlocal
import models,schemas
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from oauth2 import create_token,verify_token,hash_password,verify_password
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")
models.base.metadata.create_all(bind=engine)
# dependency
def get_db():
    db = sessionlocal()
    try:
        yield db
    finally:
        db.close()
# login api 
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    new_user = models.User(
        username=user.username,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_token({"user": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
#home api 
@app.get("/")
def home():
    return {"message":"Blog api is started"}
#post-api(protected by oauth2)
@app.post("/blogs",response_model=schemas.blog_responce)
def create_blog(blog:schemas.blog_input,db:Session=Depends(get_db),user = Depends(verify_token)):
    new_blog = models.Blog(
        title=blog.title,
        content = blog.content
        )
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    return new_blog
#read all blogs 
@app.get("/blogs",response_model=list[schemas.blog_responce] )
def get_blogs(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=5, ge=1),
    search: str = Query(default=""),
):
    query = db.query(models.Blog)
    if search:
        query = query.filter(models.Blog.title.ilike(f"%{search}%"))
    return query.offset((page - 1) * limit).limit(limit).all()
# read by id 
@app.get("/blogs/{id}",response_model=schemas.blog_responce)
def get_blog(id:int ,db:Session=Depends(get_db)):
    blogs = db.query(models.Blog).filter(models.Blog.id == id ).first()
    if not blogs:
        raise HTTPException(status_code=404,detail="ID not found")
    return blogs 
@app.put("/blogs/{id}",response_model=schemas.blog_responce)
def update(id:int,blog:schemas.blog_input,db:Session=Depends(get_db)):
    exicting_blog= db.query(models.Blog).filter(models.Blog.id == id ).first()
    if not exicting_blog:
            raise HTTPException(status_code=404,detail="ID not found")
    exicting_blog.title = blog.title
    exicting_blog.content = blog.content
    db.commit()
    return exicting_blog
@app.delete("/blogs/{id}")
def delete(id:int,db:Session=Depends(get_db)):
    blog = db.query(models.Blog).filter(models.Blog.id == id)
    if not blog.first():
            raise HTTPException(status_code=404,detail="ID not found")
    blog.delete()
    db.commit()
    return{"message":"blog deleate"}