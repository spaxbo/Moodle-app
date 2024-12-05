from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel
from models import Proba, Evaluare, Materiale


client = MongoClient("mongodb://mongodb:27017")
db = client.academia

app = FastAPI(
    title="Academia Moodle M2 cu MongoDB",
    description="API pentru Academia Moodle al doilea microserviciu cu MongoDB",
    version="1.0.0",
)

def item_helper(item) -> dict : 
    item['_id'] = str(item['_id'])
    return item

@app.post("/evaluare/")
async def create_evaluare(evaluare : Evaluare) : 
    if sum(proba.pondere for proba in evaluare.probe) > 100 :
        raise HTTPException(status_code=400, detail="Suma ponderilor trebuie sa fie 100")

    if db.evaluare.find_one({"disciplina" : evaluare.disciplina}) : 
        raise HTTPException(status_code=409, detail="Evaluarea pentru această disciplină există deja")

    result = db.evaluare.insert_one(evaluare.dict())
    return item_helper(db.evaluare.find_one({"_id" : result.inserted_id}))

@app.post("/materiale/")
async def create_material(materiale : Materiale) : 
    if materiale.material.pdf and materiale.material.structurat : 
        raise HTTPException(status_code=422, detail="Se poate introduce doar PDF sau structura, nu ambele")

    if db.materiale.find_one({"disciplina": materiale.disciplina, "tip_material": materiale.tip_material}):
        raise HTTPException(status_code=409, detail="Materialul pentru această disciplină și tip există deja")

    result = db.materiale.insert_one(materiale.dict())
    return item_helper(db.materiale.find_one({"_id" : result.inserted_id}))

@app.get("/evaluare/{disciplina}")
async def get_evaluare(disciplina : str) :
    evaluare = db.evaluare.find_one({"disciplina" : disciplina})
    if not evaluare :
        raise HTTPException(status_code=404, detail="Evaluarea pentru această disciplină nu există")

    return item_helper(evaluare)

@app.get("/materiale/{disciplina}")
async def get_materiale(disciplina : str) :
    materiale = db.materiale.find({"disciplina" : disciplina})
    if not materiale :
        raise HTTPException(status_code=404, detail="Nu există materiale pentru această disciplină")

    return [item_helper(m) for m in materiale]

@app.put("/materiale/{disciplina}")
async def update_materiale(disciplina: str, updated_materiale: Materiale):
    existing_material = db.materiale.find_one({"disciplina" : disciplina, "tip_material" : updated_materiale.tip_material})
    if not existing_material :
        raise HTTPException(status_code=404, detail="Materialul pentru această disciplină și tip nu există")

    if updated_materiale.material.pdf and updated_materiale.material.structurat :
        raise HTTPException(status_code=422, detail="Se poate introduce doar PDF sau structură, nu ambele")

    db.materiale.update_one(
        {"disciplina" : disciplina, "tip_material" : updated_materiale.tip_material},
        {"$set" : updated_materiale.dict()}
    )

    return item_helper(db.materiale.find_one({"disciplina": disciplina}))

@app.put("/evaluare/{disciplina}")
async def update_evaluare(disciplina: str, updated_evaluare: Evaluare):
    existing_evaluare = db.evaluare.find_one({"disciplina": disciplina})
    if not existing_evaluare :
        raise HTTPException(status_code=404, detail="Evaluarea pentru această disciplină nu există")
    
    if sum(proba.pondere for proba in updated_evaluare.probe) > 100 :
        raise HTTPException(status_code=422, detail="Suma ponderilor trebuie sa fie 100")

    db.evaluare.update_one(
        {"disciplina": disciplina},
        {"$set" : updated_evaluare.dict()}
    )

    return item_helper(db.evaluare.find_one({"disciplina": disciplina}))