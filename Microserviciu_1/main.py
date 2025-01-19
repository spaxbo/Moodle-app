from fastapi import FastAPI, Depends, HTTPException, Query, Body, Request
from sqlalchemy.orm import Session
import models
import schemas
import requests
from datetime import datetime, timedelta
from middleware import TokenValidationMiddleware
from database import get_db, engine
from typing import List, Optional
from pydantic import EmailStr, BaseModel
from models import Studenti, Profesori, Discipline, Join_DS
from requests.auth import HTTPBasicAuth
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import jwt

app = FastAPI(
    title="Moodle Academy M1 with SQL",
    description="""This RESTful service manages teachers, lectures and students. Additionally, there
    are some endpoints to manage the relationships between them. The teachers can administrate their own lectures with
    evaluations and materials for the students. All the endpoints are protected by the Bearer <JWS> Authorization Header.""",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TokenValidationMiddleware)
models.Base.metadata.create_all(bind = engine)

secret_key = "e180f017c88101758c609be62fef16adacae5c655d51dac5dd9adfc073ce901bdd50caa734114e002b262c8e33b8d9714b25b09309b87e199e2a8b234ff9cd44ef5e05b1fb1f2e26f56801e2955ee872108eb4d3a12c74b6f17a9b6a3db555a66364a1d4fb84057c8fb44116b4b2b0991805262c3813b8e91cbb409498e0feb5a9dcaedf751c48c8ee6d764fb86ec25a27c472219283e7e0ebac7dcb26ed2cec3f7b18795ba820cf8c00e287eb97f78944d34e53ad898a1e50a2c6004376e947f57f85a82755f97b83467e15f85da7b27abbdeb6638d1ed7b38b627b1fa425fe8c7696abf34d02ce595465d8908883c2f3a61e2d9253a284af6dc8950926c9c3"

def validate_admin_role(request: Request):
    user = request.scope.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not authenticated")
    if user is None or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")

def validate_student_role(request: Request):
    user = request.scope.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not authenticated")
    if user is None or user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")

def validate_teacher_role(request: Request):
    user = request.scope.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not authenticated")
    if user is None or user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")

@app.get("/api/academia")
def get_profesor_or_student_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    profesor = db.query(models.Profesori).filter(models.Profesori.email == email).first()
    if profesor:
        return {"id": profesor.id, "role": "teacher"}

    student = db.query(models.Studenti).filter(models.Studenti.email == email).first()
    if student:
        return {"id": student.id}

    raise HTTPException(status_code=404, detail="User not found")


@app.post("/api/academia/professors")
def create_professor(professor : schemas.ProfesorCreate, request: Request, db : Session = Depends(get_db)):

    validate_admin_role(request)

    existing_professor = db.query(models.Profesori).filter(models.Profesori.email == professor.email).first()
    if existing_professor : 
        raise HTTPException(status_code = 409, detail = "Email already exists")

    if not professor.nume or not professor.prenume : 
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided.")

    db_professor = models.Profesori(**professor.dict())
    db.add(db_professor)
    db.commit()
    db.refresh(db_professor)
    response_data = {
        **schemas.ProfesorCreate.from_orm(db_professor).dict(),
        "_links" : {
            "self": {"href": f"/api/academia/professors/{db_professor.id}", "method": "GET"},
            "parent": {"href": "/api/academia/professors", "method": "GET"},
            "update": {"href": f"/api/academia/professors/{db_professor.id}", "method": "PUT"},
            "delete": {"href": f"/api/academia/professors/{db_professor.id}", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.get("/api/academia/professors/{id}")
def read_professor(id : int, request: Request, db: Session = Depends(get_db)):

    professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    return {
        **professor.__dict__,
        "_links": {
            "self": {"href": f"/api/academia/professors/{id}", "method" : "GET"},
            "parent": {"href": "/api/academia/professors", "method": "GET"},
            "create": {"href": "/api/academia/professors", "method": "POST"},
            "update": {"href": f"/api/academia/professors/{id}", "method": "PUT"},
            "delete": {"href": f"/api/academia/professors/{id}", "method": "DELETE"}
        }
    }

@app.get("/api/academia/professors")
def read_professors(request: Request,
                    nume : Optional[str] = Query(None, alias="nume"),
                    prenume : Optional[str] = Query(None, alias="prenume"),
                    email : Optional[EmailStr] = Query(None, alias="email"),
                    grad_didactic : Optional[str] = Query(None, alias="grad_didactic"),
                    tip_asociere : Optional[str] = Query(None, alias="tip_asociere"),
                    asociere : Optional[str] = Query(None, alias="asociere"),
                    nume_disciplina : Optional[str] = Query(None, alias="nume_disciplina"),
                    page : int = 1,
                    items_per_page : int = 10,
                    db : Session = Depends(get_db)
                    ):

    validate_admin_role(request)
    if page < 1 or items_per_page <= 0 : 
        raise HTTPException(status_code = 422, detail = "Page must be >= 1 and items_per_page > 0")

    query = db.query(models.Profesori)

    if nume:
        query = query.filter(models.Profesori.nume.ilike(f"%{nume}%"))

    if prenume:
        query = query.filter(models.Profesori.prenume.ilike(f"%{prenume}%"))

    if email:
        query = query.filter(models.Profesori.email == email)

    if grad_didactic:
        query = query.filter(models.Profesori.grad_didactic == grad_didactic)

    if tip_asociere:
        query = query.filter(models.Profesori.tip_asociere == tip_asociere)

    if asociere:
        query = query.filter(models.Profesori.asociere == asociere)

    if nume_disciplina:
        query = query.join(models.Discipline, models.Profesori.id == models.Discipline.id_titular).filter(models.Discipline.nume_disciplina.ilike(f"%{nume_disciplina}%"))

    total_professors = query.count()

    skip = (page - 1) * items_per_page
    professors = query.offset(skip).limit(items_per_page).all()

    if skip >= total_professors and total_professors > 0 : 
        raise HTTPException(status_code = 416, detail = "Page out of range")

    return {
        "total_professors" : total_professors,
        "page_number" : page,
        "professors" : [
            {
                **professor.__dict__,
                "_links": {
                    "self": {"href": f"/api/academia/professors/{professor.id}", "method": "GET"},
                    "update": {"href": f"/api/academia/professors/{professor.id}", "method": "PUT"},
                    "delete": {"href": f"/api/academia/professors/{professor.id}", "method": "DELETE"}
                }
            }
            for professor in professors
        ],
        "_links": {
            "self": {"href": f"/api/academia/professors?page={page}&items_per_page={items_per_page}", "method": "GET"},
            "create": {"href": "/api/academia/professors", "method": "POST"}
        }
    }

@app.put("/api/academia/professors/{id}")
def update_professor(id : int, professor : schemas.ProfesorUpdate, request: Request, db : Session = Depends(get_db)):
    
    validate_admin_role(request)

    db_professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if db_professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")  

    if professor.email and db.query(models.Profesori).filter(models.Profesori.email == professor.email, models.Profesori.id != id).first():
        raise HTTPException(status_code = 409, detail = "Email already exists for another professor")

    if not professor.nume or not professor.prenume :
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided.")

    for key, value in professor.dict().items():
        setattr(db_professor, key, value)
    db.commit()
    db.refresh(db_professor)
    response_data = {
        **schemas.ProfesorCreate.from_orm(db_professor).dict(),
        "_links": {
            "self": {"href": f"/api/academia/professors/{id}", "method": "PUT"},
            "parent": {"href": "/api/academia/professors", "method": "GET"},
            "create": {"href": "/api/academia/professors", "method": "POST"},
            "professor": {"href": f"/api/academia/professors/{id}", "method" : "GET"},
            "delete": {"href": f"/api/academia/professors/{id}", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)

@app.delete("/api/academia/professors/{id}")
def delete_professor(id : int, request: Request, db : Session = Depends(get_db)):

    validate_admin_role(request)

    db_professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if db_professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    db.delete(db_professor)
    db.commit()
    response_data = {
        "message": "Professor deleted successfully",
        "_links": {
            "self": {"href": f"/api/academia/professors/{id}", "method": "DELETE"},
            "parent": {"href": "/api/academia/professors"},
            "create": {"href": "/api/academia/professors", "method": "POST"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)

@app.post("/api/academia/lectures")
def create_lecture(lecture : schemas.DisciplineCreate, request: Request, db : Session = Depends(get_db)) :

    validate_admin_role(request)

    existing_lecture = db.query(models.Discipline).filter(models.Discipline.cod == lecture.cod).first()
    if existing_lecture:
        raise HTTPException(status_code = 409, detail = "Lecture already exists with this code")

    if not lecture.nume_disciplina or lecture.an_studiu is None : 
        raise HTTPException(status_code = 422, detail = "Name and year of study must be provided")

    if lecture.id_titular:
        db_professor = db.query(models.Profesori).filter(models.Profesori.id == lecture.id_titular).first()
        if not db_professor:
            raise HTTPException(status_code = 404, detail = "Professor not found")
        if db_professor.tip_asociere != "titular":
            raise HTTPException(
                status_code=400,
                detail="Only professors with 'titular' association can be set as titular for a discipline"
            )

    db_lecture = models.Discipline(**lecture.dict())
    db.add(db_lecture)
    db.commit()
    db.refresh(db_lecture)
    response_data = {
        **schemas.DisciplineCreate.from_orm(db_lecture).dict(),
        "_links" : {
            "self": {"href": f"/api/academia/lectures/{db_lecture.cod}", "method": "GET"},
            "parent": {"href": "/api/academia/lectures", "method": "GET"},
            "update": {"href": f"/api/academia/lectures/{db_lecture.cod}", "method": "PUT"},
            "delete": {"href": f"/api/academia/lectures/{db_lecture.cod}", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.get("/api/academia/lectures/{cod}")
def read_lecture(cod : str, request: Request, db : Session = Depends(get_db)) : 

    validate_admin_role(request)

    lecture = db.query(models.Discipline).filter(models.Discipline.cod == cod).first()
    if lecture is None:
        raise HTTPException(status_code = 404, detail = "Lecture not found")
    return {
        **lecture.__dict__,
        "_links": {
            "self": {"href": f"/api/academia/lectures/{cod}", "method" : "GET"},
            "parent": {"href": "/api/academia/lectures", "method": "GET"},
            "create": {"href": "/api/academia/lectures", "method": "POST"},
            "update": {"href": f"/api/academia/lectures/{cod}", "method": "PUT"},
            "delete": {"href": f"/api/academia/lectures/{cod}", "method": "DELETE"},
            "read_titular": {"href": f"api/academia/professors/{lecture.id_titular}", "method": "GET"}
        }
    }

@app.get("/api/academia/lectures")
def read_lectures(request: Request, 
                cod : Optional[str] = Query(None, alias = "cod"),
                nume_disciplina: Optional[str] = Query(None, alias="nume_disciplina"),
                an_studiu: Optional[int] = Query(None, alias="an_studiu"),
                tip_disciplina: Optional[str] = Query(None, alias="tip_disciplina"),
                categorie_disciplina: Optional[str] = Query(None, alias="categorie_disciplina"),
                tip_examinare: Optional[str] = Query(None, alias="tip_examinare"),
                nume_profesor: Optional[str] = Query(None, alias="nume_profesor"),
                page: int = 1,
                items_per_page: int = 10,
                db: Session = Depends(get_db)
                ) :

    validate_admin_role(request)

    if page < 1 or items_per_page <= 0:
        raise HTTPException(status_code=422, detail="Page must be >= 1 and items_per_page > 0")

    query = db.query(models.Discipline)

    if cod: 
        query = query.filter(models.Discipline.cod == cod)

    if nume_disciplina:
        query = query.filter(models.Discipline.nume_disciplina.ilike(f"%{nume_disciplina}%"))

    if an_studiu:
        query = query.filter(models.Discipline.an_studiu == an_studiu)
    
    if tip_disciplina:
        query = query.filter(models.Discipline.tip_disciplina == tip_disciplina)
    
    if categorie_disciplina:
        query = query.filter(models.Discipline.categorie_disciplina == categorie_disciplina)
    
    if tip_examinare:
        query = query.filter(models.Discipline.tip_examinare == tip_examinare)

    if nume_profesor:
        query = query.join(models.Profesori, models.Discipline.id_titular == models.Profesori.id).filter(
            (models.Profesori.nume.ilike(f"%{nume_profesor}%")) | (models.Profesori.prenume.ilike(f"%{nume_profesor}%"))
        )

    total_disciplines = query.count()

    skip = (page - 1) * items_per_page
    disciplines = query.offset(skip).limit(items_per_page).all()

    if skip >= total_disciplines and total_disciplines > 0:
        raise HTTPException(status_code=416, detail="Page out of range")

    return {
        "total_disciplines": total_disciplines,
        "page_number": page,
        "disciplines": [
            {
                **discipline.__dict__,
                "_links": {
                    "self": {"href": f"/api/academia/lectures/{discipline.cod}", "method": "GET"},
                    "update": {"href": f"/api/academia/lectures/{discipline.cod}", "method": "PUT"},
                    "delete": {"href": f"/api/academia/lectures/{discipline.cod}", "method": "DELETE"},
                    "read_titular": {"href": f"api/academia/professors/{discipline.id_titular}", "method": "GET"}
                }
            }
            for discipline in disciplines
        ],
        "_links": {
            "self": {"href": f"/api/academia/lectures?page={page}&items_per_page={items_per_page}", "method": "GET"},
            "create": {"href": "/api/academia/lectures", "method": "POST"},
        }
    }


@app.put("/api/academia/lectures/{cod}")
def update_lecture(cod : str, lecture : schemas.DisciplineUpdate, request: Request, db : Session = Depends(get_db)) : 

    validate_admin_role(request)

    db_lecture = db.query(models.Discipline).filter(models.Discipline.cod == cod).first()
    if db_lecture is None:
        raise HTTPException(status_code = 404, detail = "Lecture not found")
    
    if lecture.id_titular is not None:
        db_profesor = db.query(models.Profesori).filter(models.Profesori.id == lecture.id_titular).first()
        if not db_profesor:
            raise HTTPException(status_code=404, detail="Titular professor not found")

    if lecture.nume_disciplina == "" or lecture.an_studiu is None:
        raise HTTPException(status_code = 422, detail = "Name and year of study must be provided")

    for key, value in lecture.dict().items():
        setattr(db_lecture, key, value)
    
    db.commit()
    db.refresh(db_lecture)

    response_data = {
        **schemas.DisciplineUpdate.from_orm(db_lecture).dict(),
        "_links": {
            "self": {"href": f"/api/academia/lectures/{cod}", "method": "PUT"},
            "parent": {"href": "/api/academia/lectures", "method": "GET"},
            "create": {"href": "/api/academia/lectures", "method": "POST"},
            "professor": {"href": f"/api/academia/lectures/{cod}", "method" : "GET"},
            "delete": {"href": f"/api/academia/lectures/{cod}", "method": "DELETE"},
            "read_titular" : {"href": f"/api/academia/lectures/{db_lecture.id_titular}", "method" : "GET"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)
    

@app.delete("/api/academia/lectures/{cod}")
def delete_lecture(cod : str, request: Request, db : Session = Depends(get_db)) :

    validate_admin_role(request)

    lecture = db.query(models.Discipline).filter(models.Discipline.cod == cod).first()
    if lecture is None:
        raise HTTPException(status_code = 404, detail = "Lecture not found")
    db.delete(lecture)
    db.commit()
    response_data = {
        "message": "Lecture deleted successfully",
        "_links": {
            "self": {"href": f"/api/academia/lectures/{cod}", "method": "DELETE"},
            "parent": {"href": "/api/academia/lectures"},
            "create": {"href": "/api/academia/lectures", "method": "POST"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)

@app.post("/api/academia/students")
def create_student(student : schemas.StudentCreate, request: Request, db : Session = Depends(get_db)) :

    validate_admin_role(request)

    existing_student = db.query(models.Studenti).filter(models.Studenti.email == student.email).first()
    if existing_student is not None : 
        raise HTTPException(status_code = 409, detail = "Student with this email already exists")

    if not student.nume or not student.prenume : 
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided")

    db_student = models.Studenti(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    response_data = {
        **schemas.StudentCreate.from_orm(db_student).dict(),
        "_links" : {
            "self": {"href": f"/api/academia/students/{db_student.id}", "method": "GET"},
            "parent": {"href": "/api/academia/students", "method": "GET"},
            "update": {"href": f"/api/academia/students/{db_student.id}", "method": "PUT"},
            "delete": {"href": f"/api/academia/students/{db_student.id}", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)


@app.get("/api/academia/students/{id}")
def read_student(id : int, request: Request, db : Session = Depends(get_db)) : 

    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    return {
        **student.__dict__,
        "_links": {
            "self": {"href": f"/api/academia/students/{id}", "method" : "GET"},
            "parent": {"href": "/api/academia/students", "method": "GET"},
            "create": {"href": "/api/academia/students", "method": "POST"},
            "update": {"href": f"/api/academia/students/{id}", "method": "PUT"},
            "delete": {"href": f"/api/academia/students/{id}", "method": "DELETE"}
        }
    }

@app.get("/api/academia/students")
def read_students(request: Request, 
                    email : Optional[EmailStr] = Query(None, alias="email"),
                    nume : Optional[str] = Query(None, alias="nume"),
                    prenume : Optional[str] = Query(None, alias="prenume"),
                    ciclu_studii : Optional[str] = Query(None, alias="ciclu_studii"),
                    an_studiu : Optional[int] = Query(None, alias="an_studiu"),
                    grupa : Optional[int] = Query(None, alias="grupa"),
                    page : int = 1,
                    items_per_page : int = 10,
                    db : Session = Depends(get_db)
                    ) :

    validate_admin_role(request)

    if page < 1 or items_per_page <= 0:
        raise HTTPException(status_code=422, detail="Page must be >= 1 and items_per_page > 0")

    query = db.query(models.Studenti)
    if email : 
        query = query.filter(models.Studenti.email == email)

    if nume:
        query = query.filter(models.Studenti.nume.ilike(f"%{nume}%") | models.Studenti.prenume.ilike(f"%{nume}%"))

    if prenume:
        query = query.filter(models.Studenti.prenume.ilike(f"%{prenume}%") | models.Studenti.prenume.ilike(f"%{prenume}%"))

    if ciclu_studii : 
        query = query.filter(models.Studenti.ciclu_studii == ciclu_studii)

    if an_studiu : 
        query = query.filter(models.Studenti.an_studiu == an_studiu)

    if grupa : 
        query = query.filter(models.Studenti.grupa == grupa)

    total_students = query.count()
    skip = (page - 1) * items_per_page
    students = query.offset(skip).limit(items_per_page).all()

    if skip >= total_students and total_students > 0:
        raise HTTPException(status_code=416, detail="Page out of range")

    return {
        "total students" : total_students,
        "page_number" : page,
        "students" : [
            {
                **student.__dict__,
                "_links" : {
                    "self": {"href": f"/api/academia/students/{student.id}", "method": "GET"},
                    "update": {"href": f"/api/academia/students/{student.id}", "method": "PUT"},
                    "delete": {"href": f"/api/academia/students/{student.id}", "method": "DELETE"}
                }
            }
            for student in students
        ],
        "_links": {
            "self": {"href": f"/api/academia/students?page={page}&items_per_page={items_per_page}", "method": "GET"},
            "create": {"href": "/api/academia/students", "method": "POST"}
        }
    }
    
    

@app.put("/api/academia/students/{id}")
def update_student(id : int, student : schemas.StudentUpdate, request: Request, db : Session = Depends(get_db)) :

    validate_admin_role(request)

    db_student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if db_student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")

    if student.email and db.query(models.Studenti).filter(models.Studenti.email == student.email, models.Studenti.id != id).first():
        raise HTTPException(status_code = 409, detail = "Student with this email already exists")
    
    if not student.nume or not student.prenume : 
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided")

    for key, value in student.dict().items() : 
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    response_data = {
        **schemas.StudentUpdate.from_orm(db_student).dict(),
        "_links" : {
            "self": {"href": f"/api/academia/students/{id}", "method": "PUT"},
            "parent": {"href": "/api/academia/students", "method": "GET"},
            "create": {"href": "/api/academia/students", "method": "POST"},
            "professor": {"href": f"/api/academia/students/{id}", "method" : "GET"},
            "delete": {"href": f"/api/academia/students/{id}", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)


@app.delete("/api/academia/students/{id}")
def delete_student(id : int, request: Request, db : Session = Depends(get_db)) : 

    validate_admin_role(request)
    
    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    db.delete(student)
    db.commit()
    response_data = {
        "message": "Student deleted successfully",
        "_links": {
            "self": {"href": f"/api/academia/students/{id}", "method": "DELETE"},
            "parent": {"href": "/api/academia/students"},
            "create": {"href": "/api/academia/students", "method": "POST"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)

# lectures where the user is the tenured teacher
@app.get("/api/academia/professors/{id}/lectures")
def get_professors_lectures(id : int, request: Request, db : Session = Depends(get_db)) :

    validate_teacher_role(request)

    professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    
    lectures = db.query(models.Discipline).filter(models.Discipline.id_titular == id).all()
    return {
        "professor_id" : id,
        "lectures" : [
            {
                "cod": lecture.cod,
                "nume_disciplina": lecture.nume_disciplina,
                "an_studiu": lecture.an_studiu,
                "tip_disciplina": lecture.tip_disciplina,
                "categorie_disciplina": lecture.categorie_disciplina,
                "tip_examinare": lecture.tip_examinare,
                "_links": {
                    "collaborators" : {"href": f"/api/academia/lectures/{lecture.cod}/collaborators", "method": "GET"},
                    "students": {"href" : f"/api/academia/professors/{id}/lectures/{lecture.cod}/students", "method" : "GET"},
                    "create_materials": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/materiale", "method": "POST"},
                    "get_materials": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/materiale", "method": "GET"},
                    "update_materials": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/materiale", "method" : "PUT"},
                    "delete_materials": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/materiale", "method": "DELETE"},
                    "create_evaluation": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/evaluare", "method": "POST"},
                    "get_evaluation": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/evaluare", "method": "GET"},
                    "update_evaluation": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/evaluare", "method" : "PUT"},
                    "delete_evaluation": {"href": f"/api/academia/professors/{id}/lectures/{lecture.cod}/evaluare", "method": "DELETE"}
                }
            }
            for lecture in lectures
        ],
        "_links" : {
            "self" : {"href": f"/api/academia/professors/{id}/lectures", "method" : "GET"},
            "parent" : {"href": f"/api/academia/professors/{id}/lectures/all", "method": "GET"}
        }
    }

# all lectures
@app.get("/api/academia/professors/{id}/lectures/all")
def get_all_lectures_for_professor(id: int, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    lectures = db.query(models.Discipline).all()
    
    return {
        "professor_id": id,
        "lectures": [
            {
                "cod": lecture.cod,
                "nume_disciplina": lecture.nume_disciplina,
                "an_studiu": lecture.an_studiu,
                "tip_disciplina": lecture.tip_disciplina,
                "categorie_disciplina": lecture.categorie_disciplina,
                "tip_examinare": lecture.tip_examinare,
                "titular_id": lecture.id_titular
            }
            for lecture in lectures
        ],
        "_links": {
            "self": {"href" : f"/api/academia/professors/{id}/lectures/all", "method": "GET"},
            "parent": {"href": f"/api/academia/professors/{id}", "method" : "GET"}
        }
    }


@app.get("/api/academia/students/{id}/lectures")
def get_student_lectures(id : int, request: Request, db : Session = Depends(get_db)) :

    validate_student_role(request)

    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    
    lectures = db.query(models.Discipline).join(models.Join_DS, models.Discipline.cod == models.Join_DS.disciplinaID).filter(models.Join_DS.studentID == id).all()
    return {
        "student_id" : id,
        "lectures" : [
            {
                "cod": lecture.cod,
                "nume_disciplina": lecture.nume_disciplina,
                "an_studiu": lecture.an_studiu,
                "tip_disciplina": lecture.tip_disciplina,
                "categorie_disciplina": lecture.categorie_disciplina,
                "tip_examinare": lecture.tip_examinare,
                "titular_id" : lecture.id_titular,
                "_links":{
                    "collaborators" : {"href": f"/api/academia/lectures/{lecture.cod}/collaborators", "method": "GET"},
                    "get_materials": {"href": f"/api/academia/students/{id}/lectures/{lecture.cod}/materiale", "method": "GET"},
                    "get_evaluation": {"href": f"/api/academia/students/{id}/lectures/{lecture.cod}/evaluare", "method": "GET"}
                }
            }
            for lecture in lectures
        ],
        "_links" : {
            "self" : {"href": f"/api/academia/students/{id}/lectures", "method" : "GET"},
            "parent" : {"href": f"/api/academia/students/{id}", "method": "GET"}
        }
    }

@app.post("/api/academia/students/enroll")
def enroll_student_in_lecture(enrollment_data: schemas.LectureEnrollment, request: Request, db: Session = Depends(get_db)) :

    validate_admin_role(request)

    student_email = enrollment_data.email
    discipline_cod = enrollment_data.discipline_cod

    student = db.query(models.Studenti).filter(models.Studenti.email == student_email).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    
    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if discipline is None:
        raise HTTPException(status_code = 404, detail = "Discipline not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student.id, 
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is not None : 
        raise HTTPException(status_code = 409, detail = "Student is already enrolled in this discipline")

    if student.an_studiu != discipline.an_studiu:
        raise HTTPException(
            status_code=400,
            detail=f"Student year ({student.an_studiu}) does not match discipline year ({discipline.an_studiu})"
        )

    new_enrollment = models.Join_DS(studentID = student.id, disciplinaID = discipline_cod)
    db.add(new_enrollment)
    db.commit()
    response_data = {
        "student_id" : student.email,
        "discipline_cod" : discipline_cod,
        "_links" : {
            "self": {"href": f"/api/academia/students/{student.id}/lectures/{discipline_cod}", "method": "GET"},
            "parent" : {"href": f"/api/academia/students/{student.id}", "method": "GET"},
            "delete" : {"href": f"/api/academia/students/unenroll", "method": "DELETE"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.post("/api/academia/students/unenroll")
def unenroll_student_from_lecture(enrollment_data: schemas.LectureEnrollment, request: Request, db: Session = Depends(get_db)):

    validate_admin_role(request)

    student_email = enrollment_data.email
    discipline_cod = enrollment_data.discipline_cod

    student = db.query(models.Studenti).filter(models.Studenti.email == student_email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if not discipline:
        raise HTTPException(status_code=404, detail="Discipline not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student.id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if not enrollment:
        raise HTTPException(status_code=409, detail="Student is not enrolled in this discipline")

    db.delete(enrollment)
    db.commit()

    response_data = {
        "message": "Student unenrolled successfully",
        "student_email": student.email,
        "discipline_cod": discipline_cod,
        "_links": {
            "self" : {"href": f"/api/academia/students/{student.id}/lectures/{discipline_cod}", "method": "DELETE"},
            "parent" : {"href": f"/api/academia/students/{student.id}", "method": "GET"},
            "create" : {"href": f"/api/academia/students/{student.id}/lectures", "method": "POST"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/students")
def get_students_for_specific_discipline(professor_id: int, discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    user = request.scope.get("user")
    username = user.get("username")
    role = user.get("role")

    if role != "teacher":
        raise HTTPException(status_code=403, detail="Access forbidden: Only professors can access this resource")

    profesor = db.query(models.Profesori).filter(models.Profesori.email == username).first()

    discipline = db.query(models.Discipline).filter(
        models.Discipline.id_titular == professor_id,
        models.Discipline.cod == discipline_cod
    ).first()

    if not discipline:
        raise HTTPException(status_code=404, detail="Discipline not found or you are not the titular")

    students = db.query(models.Studenti).join(models.Join_DS).filter(
        models.Join_DS.disciplinaID == discipline_cod
    ).all()

    enrolled_students = [
        {
            "student_name": f"{student.nume} {student.prenume}",
            "email": student.email,
            "an_studiu": student.an_studiu,
            "grupa": student.grupa
        }
        for student in students
    ]

    return {
        "professor_id": professor_id,
        "discipline_cod": discipline_cod,
        "discipline_name": discipline.nume_disciplina,
        "enrolled_students": enrolled_students,
        "_links": {
            "self": {"href" : f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/students", "method" : "GET"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures", "method": "GET"}
        }
    }

@app.post("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def create_evaluation(professor_id : int, discipline_cod : str, enrollment_data: schemas.LectureEnrollment_Evaluation, request: Request, db: Session = Depends(get_db)) :

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None :
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_request_data = {
        "disciplina" : discipline_cod,
        "probe" : enrollment_data.probe
    }

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = "http://app:8001/evaluare/"
    response = requests.post(mongo_service_url, json = mongo_request_data, headers=mongo_headers)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for evaluation creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    evaluation_id = response.json().get("id")

    response_data = {
        "evaluare" : response.json(),
        "_links" : {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare/{evaluation_id}", "method": "GET"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "GET"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "PUT"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "DELETE"},
            "materials": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "GET"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.post("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def create_materials(professor_id : int, discipline_cod : str, material_data : dict, request: Request, db: Session = Depends(get_db)) :

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor")
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_request_data = {
        "disciplina" : discipline_cod,
        **material_data
    }

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = "http://app:8001/materiale/"
    response = requests.post(mongo_service_url, json=mongo_request_data, headers=mongo_headers)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for material creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    material_id = response.json().get("id")

    response_data = {
        "material" : response.json(),
        "_links" : {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare/{material_id}", "method": "GET"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "GET"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "PUT"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "DELETE"},
            "evaluations": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "GET"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.put("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def update_evaluation(professor_id : int, discipline_cod : str, enrollment_data: schemas.LectureEnrollment_Evaluation, request: Request, db: Session = Depends(get_db)) :

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None :
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor.")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_request_data = {
        "disciplina" : discipline_cod,
        "probe" : enrollment_data.probe
    }

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.put(mongo_service_url, json=mongo_request_data, headers=mongo_headers)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for evaluation update")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    response_data = {
        "evaluare" : response.json(),
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "PUT"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "POST"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "DELETE"},
            "materials": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "GET"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)

@app.put("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def update_materials(professor_id: int, discipline_cod: str, material_data: dict, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_request_data = {
        "disciplina": discipline_cod,
        **material_data
    }

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.put(mongo_service_url, json=mongo_request_data, headers=mongo_headers)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for material creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    response_data = {
        "material": response.json(),
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "PUT"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "POST"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "DELETE"},
            "evaluations": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "GET"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def get_evaluation(professor_id: int, discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None :
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.get(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response.json(),
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "GET"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare/materiale", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "POST"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "PUT"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "DELETE"},
            "materials": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "GET"}
        }
    }

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def get_materials(professor_id: int, discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.get(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Material not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "materiale": response.json(),
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "GET"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare/materiale", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "POST"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "PUT"},
            "delete": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "DELETE"},
            "evaluations": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "GET"}
        }
    }

@app.delete("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def delete_evaluation(professor_id: int, discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Lecture not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.delete(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    response_data = {
        "message": "The evaluation has been successfully deleted",
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "DELETE"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "POST"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method" : "PUT"},
            "materials": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "GET"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)


@app.delete("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def delete_materials(professor_id: int, discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    validate_teacher_role(request)

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Lecture not found or not managed by this professor")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"

    response = requests.delete(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Material not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    response_data = {
        "message": "The material has been successfully deleted",
        "_links": {
            "self": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "DELETE"},
            "parent": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "GET"},
            "create": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method": "POST"},
            "update": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale", "method" : "PUT"},
            "evaluations": {"href": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare", "method": "GET"}
        }
    }

    return JSONResponse(status_code=200, content=response_data)


@app.get("/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare")
def get_student_evaluation(student_id : int, discipline_cod : str, request: Request, db : Session = Depends(get_db)) : 

    validate_student_role(request)

    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is None : 
        raise HTTPException(status_code=403, detail="Student is not enrolled in this discipline")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.get(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response.json(),
        "_links": {
            "self": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare", "method" : "GET"},
            "parent": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare/materiale", "method" : "GET"},
            "materials": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/materiale", "method": "GET"}
        }
    }

@app.get("/api/academia/students/{student_id}/lectures/{discipline_cod}/materiale")
def get_student_materials(student_id : int, discipline_cod : str, request: Request, db : Session = Depends(get_db)) : 

    validate_student_role(request)

    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is None : 
        raise HTTPException(status_code=403, detail="Student is not enrolled in this discipline")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]

    mongo_headers = {"Authorization": f"Bearer {token}"}
    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.get(mongo_service_url, headers=mongo_headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Material not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "materiale": response.json(),
        "_links": {
            "self": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/materiale", "method" : "GET"},
            "parent": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare/materiale", "method" : "GET"},
            "evaluations": {"href": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare", "method": "GET"}
        }
    }

@app.post("/api/academia/lectures/collaborators/add")
def add_collaborator(colaborator_data: schemas.LectureEnrollment, request: Request, db: Session = Depends(get_db)):
    
    validate_admin_role(request)

    email = colaborator_data.email
    discipline_cod = colaborator_data.discipline_cod

    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if not discipline:
        raise HTTPException(status_code=404, detail="Discipline not found")

    profesor = db.query(models.Profesori).filter(models.Profesori.email == email).first()
    if not profesor:
        raise HTTPException(status_code=404, detail="Professor not found")

    if profesor.tip_asociere not in ["asociat", "extern"]:
        raise HTTPException(status_code=422, detail="Only 'asociat' or 'extern' professors can be collaborators")

    existing_colab = db.query(models.ColaboratoriDiscipline).filter(
        models.ColaboratoriDiscipline.id_profesor == profesor.id,
        models.ColaboratoriDiscipline.cod_disciplina == discipline_cod
    ).first()

    if existing_colab:
        raise HTTPException(status_code=409, detail="Professor is already a collaborator for this discipline")

    new_colab = models.ColaboratoriDiscipline(id_profesor=profesor.id, cod_disciplina=discipline_cod)
    db.add(new_colab)
    db.commit()

    response_data = {
        "message": "Collaborator added successfully",
        "professor_email": profesor.email,
        "discipline_cod": discipline_cod,
        "_links": {
            "self": {"href": f"/api/academia/lectures/{discipline_cod}/collaborators/{profesor.id}", "method": "GET"},
            "parent": {"href": f"/api/academia/lectures/{discipline_cod}/collaborators", "method": "GET"},
            "remove": {"href": f"/api/academia/lectures/collaborators/remove", "method": "POST"}
        }
    }

    return JSONResponse(status_code=201, content=response_data)

@app.get("/api/academia/lectures/{discipline_cod}/collaborators")
def get_collaborators(discipline_cod: str, request: Request, db: Session = Depends(get_db)):

    user = request.scope.get("user")
    username = user.get("username")
    role = user.get("role")

    profesor = db.query(models.Profesori).filter(models.Profesori.email == username).first()

    if not profesor:
        raise HTTPException(status_code=404, detail="Professor not found")

    user_id = profesor.id

    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if not discipline:
        raise HTTPException(status_code=404, detail="Discipline not found")
    
    if role == "admin":
        pass

    elif role == "teacher":
        if discipline.id_titular != user_id:
            raise HTTPException(status_code=403, detail="You are not the titular for this discipline")

    else:
        raise HTTPException(status_code=403, detail="Access forbidden")

    colaboratori = db.query(models.ColaboratoriDiscipline).filter(
        models.ColaboratoriDiscipline.cod_disciplina == discipline_cod
    ).all()

    return {
        "discipline_cod": discipline_cod,
        "collaborators": [
            {
                "professor_name": f"{colab.profesor.nume} {colab.profesor.prenume}",
                "professor_email": colab.profesor.email,
                "profesor_association" : colab.profesor.asociere
            }
            for colab in colaboratori
        ],
        "_links": {
            "self": {"href": f"/api/academia/lectures/{discipline_cod}/collaborators", "method": "GET"},
            "parent": {"href": f"/api/academia/lectures/{discipline_cod}", "method" : "GET"},
            "create": {"href": f"/api/academia/lectures/collaborators/add", "method": "POST"},
            "remove": {"href": f"/api/academia/lectures/collaborators/remove", "method": "POST"}
        }
    }

@app.post("/api/academia/lectures/collaborators/remove")
def remove_collaborator(colaborator_data: schemas.LectureEnrollment, request: Request, db: Session = Depends(get_db)):

    validate_admin_role(request)

    email = colaborator_data.email
    discipline_cod = colaborator_data.discipline_cod

    profesor = db.query(models.Profesori).filter(models.Profesori.email == email).first()
    if not profesor:
        raise HTTPException(status_code=404, detail="Professor not found")

    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if not discipline:
        raise HTTPException(status_code=404, detail="Discipline not found")

    colaborator = db.query(models.ColaboratoriDiscipline).filter(
        models.ColaboratoriDiscipline.cod_disciplina == discipline_cod,
        models.ColaboratoriDiscipline.id_profesor == profesor.id
    ).first()

    if not colaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found for this discipline")

    db.delete(colaborator)
    db.commit()

    response_data = {
        "message": "Collaborator removed successfully",
        "discipline_cod": discipline_cod,
        "_links": {
            "self": {"href": f"/api/academia/lectures/collaborators/remove", "method": "DELETE"},
            "parent": {"href": f"/api/academia/lectures/{discipline_cod}/collaborators", "method": "GET"},
            "add": {"href": f"/api/academia/lectures/collaborators/add", "method": "POST"},
        }
    }

    return JSONResponse(status_code=201, content=response_data)

