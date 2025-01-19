from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List

class ProfesorBase(BaseModel):
    nume : str
    prenume : str
    email : EmailStr
    grad_didactic : str
    tip_asociere : str
    asociere : str

    @field_validator("nume", "prenume", "grad_didactic", "tip_asociere", "asociere", mode="before")
    def field_not_empty(cls, value, field):
        if value is None or value == "":
            raise ValueError(f"{field.name} cannot be empty")
        return value

class ProfesorCreate(BaseModel):
    nume: str
    prenume: str
    email: str
    grad_didactic: str
    tip_asociere: str
    asociere: str

    class Config:
        from_attributes = True

class Profesor(ProfesorBase):
    id : int
    discipline : List["Discipline"] = []
    
    class Config : 
        from_attributes = True

class ProfesorUpdate(BaseModel):
    nume: Optional[str] = None
    prenume: Optional[str] = None
    email: Optional[EmailStr] = None
    grad_didactic: Optional[str] = None
    tip_asociere: Optional[str] = None
    asociere: Optional[str] = None

    class Config:
        from_attributes = True

class DisciplineBase(BaseModel) : 
    cod : str
    nume_disciplina : str
    an_studiu : int
    tip_disciplina : str
    categorie_disciplina : str
    tip_examinare : str
    id_titular : int

    @field_validator("cod", "nume_disciplina", "tip_disciplina", "categorie_disciplina", "tip_examinare", mode="before")
    def field_not_empty(cls, value, field):
        if value == "":
            raise ValueError(f"{field.name} cannot be empty")
        return value

    class Config:
        from_attributes = True

class DisciplineCreate(DisciplineBase) : 
    pass

class Discipline(DisciplineBase) : 
    titular: Profesor
    studenti : List["Student"] = []
 
    class Config:
        from_attributes = True

class DisciplineUpdate(BaseModel):
    cod : Optional[str] = None
    nume_disciplina: Optional[str] = None
    an_studiu: Optional[int] = None
    tip_disciplina: Optional[str] = None
    categorie_disciplina: Optional[str] = None
    tip_examinare: Optional[str] = None
    id_titular: Optional[int] = None

    class Config:
        from_attributes = True

class StudentBase(BaseModel) : 
    email : EmailStr
    nume : str
    prenume : str
    ciclu_studii : str
    an_studiu : int
    grupa : int

    @field_validator("email", "nume", "prenume", "ciclu_studii", "an_studiu", "grupa", mode="before")
    def field_not_empty(cls, value, field):
        if value == "":
            raise ValueError(f"{field.name} cannot be empty")
        return value

class StudentCreate(StudentBase) : 
    email : EmailStr
    nume : str
    prenume : str
    ciclu_studii : str
    an_studiu : int
    grupa : int

    class Config:
        orm_mode = True
        from_attributes = True

class Student(StudentBase) : 
    id : int
    discipline : List[Discipline] = []
    class Config : 
        from_attributes = True

class StudentUpdate(BaseModel) : 
    email : Optional[EmailStr] = None
    nume : Optional[str] = None
    prenume : Optional[str] = None
    ciclu_studii : Optional[str] = None
    an_studiu : Optional[int] = None
    grupa : Optional[int] = None

    class Config:
        from_attributes = True

class LectureEnrollment(BaseModel):
    email: str
    discipline_cod: str

class LectureEnrollment_Evaluation(BaseModel) :
    probe : list[dict]

class AddCollaboratorRequest(BaseModel):
    profesor_id: int
