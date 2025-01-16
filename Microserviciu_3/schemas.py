from pydantic import BaseModel

class LoginRequestModel(BaseModel):
    username: str
    password: str

class ValidateTokenRequestModel(BaseModel):
    token: str

class LogoutRequestModel(BaseModel):
    token: str

class CreateUserRequestModel(BaseModel):
    username: str
    password: str
    role: str

class ChangePasswordRequestModel(BaseModel):
    username: str
    current_password: str
    new_password: str

class DeleteUserRequestModel(BaseModel):
    username: str
