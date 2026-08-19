from pydantic import BaseModel
# input schema
class blog_input(BaseModel):
    title : str
    content  : str
#reponse schema
class blog_responce(BaseModel):
    id : int
    title : str
    content : str 
    class Config:
        from_attributes = True
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str