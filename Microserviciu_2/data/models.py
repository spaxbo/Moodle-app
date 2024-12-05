from pydantic import BaseModel
from typing import Optional, List

class Proba(BaseModel) :
    tip_proba : str
    pondere : float

class Evaluare(BaseModel) :
    disciplina : str
    probe : List[Proba]

class StructuraMaterial(BaseModel) :
    titlu : str
    descriere : str

class Material(BaseModel) : 
    pdf : Optional[str] = None
    structurat : Optional[List[StructuraMaterial]] = None

class Materiale(BaseModel) : 
    disciplina : str
    tip_material : str
    material : Material
