from fastapi import FastAPI, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
import models
import schemas
import requests
from database import get_db, engine
from typing import List, Optional
from pydantic import EmailStr
from models import Studenti, Profesori, Discipline, Join_DS

app = FastAPI(
    title="API-ul moodle M1",
    description="""Acest serviciu RESTful gestionează entități academice, inclusiv profesori, studenți și discipline. Acum este adăugată și posibilitatea de a gestiona și evaluările
    și materialele de la fiecare disciplină. """,
    version="2.0.0"
)

models.Base.metadata.create_all(bind = engine)
# coduri de eroare necesare 409 416 422 401 403

@app.post("/api/academia/professors")
def create_professor(professor : schemas.ProfesorCreate, db : Session = Depends(get_db)):

    existing_professor = db.query(models.Profesori).filter(models.Profesori.email == professor.email).first()
    if existing_professor : 
        raise HTTPException(status_code = 409, detail = "Email already exists")

    if not professor.nume or not professor.prenume : 
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided.")

    db_professor = models.Profesori(**professor.dict())
    db.add(db_professor)
    db.commit()
    db.refresh(db_professor)
    return {
        **db_professor.__dict__,
        "links" : {
            "self" : f"/api/academia/professors/{db_professor.id}",
            "parent" : "/api/academia/professors"
        }
    }

@app.get("/api/academia/professors/{id}")
def read_professor(id : int, db: Session = Depends(get_db)):
    professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    return {
        **professor.__dict__,
        "links": {
            "self": f"/api/academia/professors/{id}",
            "parent": "/api/academia/professors"
        }
    }

@app.get("/api/academia/professors")
def read_professors(nume : Optional[str] = Query(None, alias="nume"),
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
                "links": {
                    "self": f"/api/academia/professors/{professor.id}",
                    "parent": "/api/academia/professors"
                }
            }
            for professor in professors
        ],
    }

@app.put("/api/academia/professors/{id}")
def update_professor(id : int, professor : schemas.ProfesorUpdate, db : Session = Depends(get_db)):
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
    return {
        **db_professor.__dict__,
        "links": {
            "self": f"/api/academia/professors/{id}",
            "parent": "/api/academia/professors"
        }
    }

@app.delete("/api/academia/professors/{id}")
def delete_professor(id : int, db : Session = Depends(get_db)):
    db_professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if db_professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    db.delete(db_professor)
    return {
        "message": "Professor deleted successfully",
        "links": {
            "parent": "/api/academia/professors"
        }
    }

@app.post("/api/academia/lectures")
def create_lecture(lecture : schemas.DisciplineCreate, db : Session = Depends(get_db)) :

    existing_lecture = db.query(models.Discipline).filter(models.Discipline.cod == lecture.cod).first()
    if existing_lecture:
        raise HTTPException(status_code = 409, detail = "Lecture already exists with this code")

    if not lecture.nume_disciplina or lecture.an_studiu is None : 
        raise HTTPException(status_code = 422, detail = "Name and year of study must be provided")

    if lecture.id_titular:
        db_professor = db.query(models.Profesori).filter(models.Profesori.id == lecture.id_titular).first()
        if not db_professor:
            raise HTTPException(status_code = 404, detail = "Professor not found")

    db_lectures = models.Discipline(**lecture.dict())
    db.add(db_lectures)
    db.commit()
    db.refresh(db_lectures)
    return {
        **lecture.__dict__,
        "links" : {
            "self" : f"/api/academia/lectures/{db_lectures.cod}",
            "parent" : "/api/academia/lectures"
        }
    }

@app.get("/api/academia/lectures/{cod}")
def read_lecture(cod : str, db : Session = Depends(get_db)) : 
    lecture = db.query(models.Discipline).filter(models.Discipline.cod == cod).first()
    if lecture is None:
        raise HTTPException(status_code = 404, detail = "Lecture not found")
    return {
        **lecture.__dict__,
        "links": {
            "self": f"/api/academia/lectures/{cod}",
            "parent": "/api/academia/lectures"
        }
    }

@app.get("/api/academia/lectures")
def read_lectures(cod : Optional[str] = Query(None, alias = "cod"),
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
                "links": {
                    "self": f"/api/academia/disciplines/{discipline.cod}",
                    "parent": "/api/academia/disciplines"
                }
            }
            for discipline in disciplines
        ],
    }


@app.put("/api/academia/lectures/{cod}")
def update_lecture(cod : str, lecture : schemas.DisciplineUpdate, db : Session = Depends(get_db)) : 
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
    return{
        **db_lecture.__dict__,
        "links": {
            "self": f"/api/academia/lectures/{cod}",
            "parent": "/api/academia/lectures"
        }
    }
    

@app.delete("/api/academia/lectures/{cod}")
def delete_lecture(cod : str, db : Session = Depends(get_db)) :
    lecture = db.query(models.Discipline).filter(models.Discipline.cod == cod).first()
    if lecture is None:
        raise HTTPException(status_code = 404, detail = "Lecture not found")
    db.delete(lecture)
    return {
        "message": "Lecture deleted successfully",
        "links": {
            "parent": "/api/academia/lectures"
        }
    }

@app.post("/api/academia/students")
def create_student(student : schemas.StudentCreate, db : Session = Depends(get_db)) :
    existing_student = db.query(models.Studenti).filter(models.Studenti.email == student.email).first()
    if existing_student is not None : 
        raise HTTPException(status_code = 409, detail = "Student with this email already exists")

    if not student.nume or not student.prenume : 
        raise HTTPException(status_code = 422, detail = "Name and surname must be provided")

    db_student = models.Studenti(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return {
        **db_student.__dict__,
        "links" : {
            "self" : f"/api/academia/students/{db_student.id}",
            "parent" : "/api/academia/students"
        }
    }

@app.get("/api/academia/students/{id}")
def read_student(id : int, db : Session = Depends(get_db)) : 
    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    return {
        **student.__dict__,
        "links": {
            "self": f"/api/academia/students/{id}",
            "parent": "/api/academia/students"
        }
    }

@app.get("/api/academia/students")
def read_students(email : Optional[EmailStr] = Query(None, alias="email"),
                    nume : Optional[str] = Query(None, alias="nume"),
                    prenume : Optional[str] = Query(None, alias="prenume"),
                    ciclu_studii : Optional[str] = Query(None, alias="ciclu_studii"),
                    an_studiu : Optional[int] = Query(None, alias="an_studiu"),
                    grupa : Optional[int] = Query(None, alias="grupa"),
                    page : int = 1,
                    items_per_page : int = 10,
                    db : Session = Depends(get_db)
                    ) :

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
                "links" : {
                    "self" : f"/api/academia/students/{student.id}",
                    "parent" : "/api/academia/students"
                }
            }
            for student in students
        ]
    }
    
    

@app.put("/api/academia/students/{id}")
def update_student(id : int, student : schemas.StudentUpdate, db : Session = Depends(get_db)) :
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
    return {
        **db_student.__dict__,
        "links" : {
            "self" : f"/api/academia/students/{id}",
            "parent" : "/api/academia/students"
        }
    }


@app.delete("/api/academia/students/{id}")
def delete_student(id : int, db : Session = Depends(get_db)) : 
    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    db.delete(student)
    return {
        "message": "Student deleted successfully",
        "links": {
            "parent" : "api/academia/students"
        }
    }

@app.get("/api/academia/professors/{id}/lectures")
def get_professors_lectures(id : int, db : Session = Depends(get_db)) :
    professor = db.query(models.Profesori).filter(models.Profesori.id == id).first()
    if professor is None:
        raise HTTPException(status_code = 404, detail = "Professor not found")
    
    lectures = db.query(models.Discipline).filter(models.Discipline.id_titular == id).all()
    return {
        "professor_id" : id,
        "professor_name" : f"{professor.nume} {professor.prenume}",
        "lectures" : [
            {
                "cod": lecture.cod,
                "nume_disciplina": lecture.nume_disciplina,
                "an_studiu": lecture.an_studiu,
                "tip_disciplina": lecture.tip_disciplina,
                "categorie_disciplina": lecture.categorie_disciplina,
                "tip_examinare": lecture.tip_examinare
            }
            for lecture in lectures
        ],
        "links" : {
            "self" : f"/api/academia/professors/{id}/lectures",
            "parent" : f"/api/academia/professors/{id}",
            "all_professors" : "/api/academia/professors"
        }
    }

@app.get("/api/academia/students/{id}/lectures")
def get_student_lectures(id : int, db : Session = Depends(get_db)) :
    student = db.query(models.Studenti).filter(models.Studenti.id == id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    
    lectures = db.query(models.Discipline).join(models.Join_DS, models.Discipline.cod == models.Join_DS.disciplinaID).filter(models.Join_DS.studentID == id).all()
    return {
        "student_id" : id,
        "student_name" : f"{student.nume} {student.prenume}",
        "lectures" : [
            {
                "cod": lecture.cod,
                "nume_disciplina": lecture.nume_disciplina,
                "an_studiu": lecture.an_studiu,
                "tip_disciplina": lecture.tip_disciplina,
                "categorie_disciplina": lecture.categorie_disciplina,
                "tip_examinare": lecture.tip_examinare
            }
            for lecture in lectures
        ],
        "links" : {
            "self" : f"/api/academia/students/{id}/lectures",
            "parent" : f"/api/academia/students/{id}",
            "all_students" : "/api/academia/students"
        }
    }

@app.post("/api/academia/students/{student_id}/lectures")
def enroll_student_in_lecture(student_id : int, enrollment_data: schemas.LectureEnrollment, db: Session = Depends(get_db)) :

    discipline_cod = enrollment_data.discipline_cod
    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code = 404, detail = "Student not found")
    
    discipline = db.query(models.Discipline).filter(models.Discipline.cod == discipline_cod).first()
    if discipline is None:
        raise HTTPException(status_code = 404, detail = "Discipline not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id, 
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is not None : 
        raise HTTPException(status_code = 409, detail = "Student is already enrolled in this discipline")

    new_enrollment = models.Join_DS(studentID = student_id, disciplinaID = discipline_cod)
    db.add(new_enrollment)
    db.commit()
    return {
        "student_id" : student_id,
        "discipline_cod" : discipline_cod,
        "links" : {
            "self" : f"/api/academia/students/{student_id}/lectures",
            "parent" : f"/api/academia/students/{student_id}",
            "all_students" : "/api/academia/students"
        }
    }

@app.post("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def create_evaluare(professor_id : int, discipline_cod : str, enrollment_data: schemas.LectureEnrollment_Evaluation, db: Session = Depends(get_db)) :

    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None :
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor")

    mongo_request_data = {
        "disciplina" : discipline_cod,
        "probe" : enrollment_data.probe
    }

    mongo_service_url = "http://app:8001/evaluare/"
    response = requests.post(mongo_service_url, json = mongo_request_data)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for evaluation creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare" : response.json(),
        "links" : {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "materials": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale"
        }
    }

@app.post("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def create_materiale(professor_id : int, discipline_cod : str, material_data : dict, db: Session = Depends(get_db)) :
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor")
    
    mongo_request_data = {
        "disciplina" : discipline_cod,
        **material_data
    }

    mongo_service_url = "http://app:8001/materiale/"
    response = requests.post(mongo_service_url, json=mongo_request_data)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for material creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "material" : response.json(),
        "links" : {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "evaluations": "/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare"
        }
    }

@app.put("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def update_evaluare(professor_id : int, discipline_cod : str, enrollment_data: schemas.LectureEnrollment_Evaluation, db: Session = Depends(get_db)) :
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if Discipline is None :
        raise HTTPException(status_code = 404, detail = "Discipline not found or not managed by this professor.")

    mongo_request_data = {
        "disciplina" : discipline_cod,
        "probe" : enrollment_data.probe
    }

    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.put(mongo_service_url, json=mongo_request_data)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for evaluation update")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return{
        "evaluare" : response.json(),
        "links": {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "materials": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale"
        }
    }

@app.put("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def update_materiale(professor_id: int, discipline_cod: str, material_data: dict, db: Session = Depends(get_db)):
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    mongo_request_data = {
        "disciplina": discipline_cod,
        **material_data
    }

    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.put(mongo_service_url, json=mongo_request_data)

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid data provided for material creation")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "material": response.json(),
        "links": {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "evaluations": "/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare"
        }
    }

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare")
def get_evaluare(professor_id: int, discipline_cod: str, db: Session = Depends(get_db)):
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None :
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.get(mongo_service_url)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response.json(),
        "links": {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "materials": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale"
        }
    }

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale")
def get_materiale(professor_id: int, discipline_cod: str, db: Session = Depends(get_db)):
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.get(mongo_service_url)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Material not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "materiale": response.json(),
        "links": {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/materiale",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
            "evaluations": "/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare"
        }
    }

@app.get("/api/academia/professors/{professor_id}/lectures/{discipline_cod}/evaluare/materiale")
def get_discipline_details(professor_id: int, discipline_cod: str, db: Session = Depends(get_db)):
    discipline = db.query(models.Discipline).filter(
        models.Discipline.cod == discipline_cod,
        models.Discipline.id_titular == professor_id
    ).first()

    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found or not managed by this professor")

    mongo_service_url_evaluare = f"http://app:8001/evaluare/{discipline_cod}"
    mongo_service_url_materiale = f"http://app:8001/materiale/{discipline_cod}"

    response_evaluare = requests.get(mongo_service_url_evaluare)
    response_materiale = requests.get(mongo_service_url_materiale)

    if response_evaluare.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response_evaluare.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response_evaluare.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    if response_materiale.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response_materiale.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response_materiale.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response_evaluare.json(),
        "materiale": response_materiale.json(),
        "links": {
            "self": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}/details",
            "parent": f"/api/academia/professors/{professor_id}/lectures/{discipline_cod}",
        }
    }

@app.get("/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare")
def get_student_evaluare(student_id : int, discipline_cod : str, db : Session = Depends(get_db)) : 
    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is None : 
        raise HTTPException(status_code=403, detail="Student is not enrolled in this discipline")

    mongo_service_url = f"http://app:8001/evaluare/{discipline_cod}"
    response = requests.get(mongo_service_url)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response.json(),
        "links": {
            "self": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare",
            "parent": f"/api/academia/students/{student_id}/lectures/{discipline_cod}",
        }
    }

@app.get("/api/academia/students/{student_id}/lectures/{discipline_cod}/materiale")
def get_student_materiale(student_id : int, discipline_cod : str, db : Session = Depends(get_db)) : 
    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is None : 
        raise HTTPException(status_code=403, detail="Student is not enrolled in this discipline")

    mongo_service_url = f"http://app:8001/materiale/{discipline_cod}"
    response = requests.get(mongo_service_url)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Material not found for the specified discipline")
    elif response.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "materiale": response.json(),
        "links": {
            "self": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/materiale",
            "parent": f"/api/academia/students/{student_id}/lectures/{discipline_cod}",
        }
    }

@app.get("/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare/materiale")
def get_student_evaluare_and_materiale(student_id: int, discipline_cod: str, db: Session = Depends(get_db)) :
    student = db.query(models.Studenti).filter(models.Studenti.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = db.query(models.Join_DS).filter(
        models.Join_DS.studentID == student_id,
        models.Join_DS.disciplinaID == discipline_cod
    ).first()

    if enrollment is None :
        raise HTTPException(status_code=403, detail="Student is not enrolled in this discipline")

    mongo_service_url_evaluare = f"http://app:8001/evaluare/{discipline_cod}"
    mongo_service_url_materiale = f"http://app:8001/materiale/{discipline_cod}"

    response_evaluare = requests.get(mongo_service_url_evaluare)
    response_materiale = requests.get(mongo_service_url_materiale)

    if response_evaluare.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response_evaluare.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response_evaluare.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    if response_materiale.status_code == 404:
        raise HTTPException(status_code=404, detail="Evaluation not found for the specified discipline")
    elif response_materiale.status_code == 500:
        raise HTTPException(status_code=500, detail="Internal server error from Mongo service")
    elif response_materiale.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Unknown error from Mongo service"))

    return {
        "evaluare": response_evaluare.json(),
        "materiale": response_materiale.json(),
        "links": {
            "self": f"/api/academia/students/{student_id}/lectures/{discipline_cod}/evaluare/materiale",
            "parent": f"/api/academia/students/{student_id}/lectures/{discipline_cod}",
        }
    }


# de adaugat coduri de eroare noi daca mai trebuie(409, 416, 422)