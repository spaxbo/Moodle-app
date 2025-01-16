from fastapi import FastAPI, HTTPException, Request
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel
from schemas import Proba, Evaluare, Materiale
from middleware import TokenValidationMiddleware

client = MongoClient("mongodb://mongodb:27017")
db = client.academia

app = FastAPI(
    title="The Moodle Academy M2 with MongoDB",
    description="API for the Moodle Academy, the second service with MongoDB",
    version="1.0.0",
)

app.add_middleware(TokenValidationMiddleware)

def validate_teacher_role(request: Request):
    user = request.scope.get("user")
    if user is None or user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")

def validate_get(request : Request):
    user = request.scope.get("user")
    if user is None or user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")

def item_helper(item) -> dict : 
    item['_id'] = str(item['_id'])
    return item

@app.post("/evaluare/", status_code=201)
async def create_evaluation(evaluare : Evaluare, request: Request) : 

    validate_teacher_role(request)
    
    if sum(proba.pondere for proba in evaluare.probe) > 100 :
        raise HTTPException(status_code=400, detail="The sum of the weightings must be 100")

    if db.evaluare.find_one({"disciplina" : evaluare.disciplina}) : 
        raise HTTPException(status_code=409, detail="The evaluation for this discipline already exists")

    result = db.evaluare.insert_one(evaluare.dict())
    return item_helper(db.evaluare.find_one({"_id" : result.inserted_id}))

@app.post("/materiale/", status_code=201)
async def create_materials(materiale : Materiale, request: Request) : 

    validate_teacher_role(request)

    if db.materiale.find_one({"disciplina": materiale.disciplina, "tip_material": materiale.tip_material}):
        raise HTTPException(status_code=409, detail="The materials for this discipline already exists")

    result = db.materiale.insert_one(materiale.dict())
    return item_helper(db.materiale.find_one({"_id" : result.inserted_id}))

@app.get("/evaluare/{disciplina}")
async def get_evaluation(disciplina : str, request: Request) :

    validate_get(request)

    evaluare = db.evaluare.find_one({"disciplina" : disciplina})
    if not evaluare :
        raise HTTPException(status_code=404, detail="The evaluation for this lecture does not exist")

    return item_helper(evaluare)

@app.get("/materiale/{disciplina}")
async def get_materials(disciplina : str, request: Request):

    validate_get(request)
    materials = list(db.materiale.find({"disciplina": disciplina}))
    if not materials:
        raise HTTPException(status_code=404, detail="The materials for this lecture do not exist")

    return [item_helper(m) for m in materials]

@app.put("/materiale/{disciplina}", status_code=200)
async def update_materials(disciplina: str, updated_materiale: Materiale, request: Request):

    validate_teacher_role(request)

    existing_material = db.materiale.find_one({"disciplina" : disciplina, "tip_material" : updated_materiale.tip_material})
    if not existing_material :
        raise HTTPException(status_code=404, detail="The materials for this lecture do not exist")

    if updated_materiale.material.pdf and updated_materiale.material.structurat :
        raise HTTPException(status_code=422, detail="It can be introduced only pdf or structured schema, not both")

    db.materiale.update_one(
        {"disciplina" : disciplina, "tip_material" : updated_materiale.tip_material},
        {"$set" : updated_materiale.dict()}
    )

    return item_helper(db.materiale.find_one({"disciplina": disciplina}))

@app.put("/evaluare/{disciplina}", status_code=200)
async def update_evaluation(disciplina: str, updated_evaluare: Evaluare, request: Request):

    validate_teacher_role(request)

    existing_evaluare = db.evaluare.find_one({"disciplina": disciplina})
    if not existing_evaluare :
        raise HTTPException(status_code=404, detail="The evaluation for this lecture does not exist")
    
    if sum(proba.pondere for proba in updated_evaluare.probe) > 100 :
        raise HTTPException(status_code=422, detail="The sum of the weightings must be 100")

    db.evaluare.update_one(
        {"disciplina": disciplina},
        {"$set" : updated_evaluare.dict()}
    )

    return item_helper(db.evaluare.find_one({"disciplina": disciplina}))

@app.delete("/evaluare/{disciplina}", status_code=200)
async def delete_evaluation(disciplina: str, request: Request):

    validate_teacher_role(request)

    existing_evaluare = db.evaluare.find_one({"disciplina": disciplina})
    if not existing_evaluare :
        raise HTTPException(status_code=404, detail="The evaluation for this lecture does not exist")

    db.evaluare.delete_one({"disciplina": disciplina})
    return {
        "deleted_evaluation": item_helper(existing_evaluare),
        "message": "The evaluation has been successfully deleted"
    }

@app.delete("/materiale/{disciplina}", status_code=200)
async def delete_materials(disciplina: str, request: Request):

    validate_teacher_role(request)

    existing_material = db.materiale.find_one({"disciplina": disciplina})
    if not existing_material :
        raise HTTPException(status_code=404, detail="The materials for this lecture do not exist")
    
    db.materiale.delete_one({"disciplina": disciplina})

    return {
        "deleted_material": item_helper(existing_material),
        "message": "The material has been successfully deleted"
    }



