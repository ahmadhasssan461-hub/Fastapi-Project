from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from dotenv import load_dotenv
import os
from datetime import timedelta,timezone,datetime  
from jose import jwt,JWTError
from passlib.context import CryptContext
load_dotenv()
security_key = os.getenv("Security_key")
if not security_key:
    raise RuntimeError("Security_key is not configured")
ALGORITHM = "HS256"
oauth2_schema = OAuth2PasswordBearer(tokenUrl="/login")
def create_token(data:dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc)+timedelta(minutes=30)
    to_encode.update({"exp":expire})
    token = jwt.encode(
        to_encode,
        security_key,
        algorithm = ALGORITHM
    )
    return token 
def verify_token(token :str = Depends(oauth2_schema)):
    try:
        payload = jwt.decode(token,security_key,algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)