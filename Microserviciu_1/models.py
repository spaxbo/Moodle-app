from sqlalchemy import Column, Integer, String, CheckConstraint, ForeignKey
from database import Base
from sqlalchemy.orm import relationship

class Profesori(Base) : 
    __tablename__ = "PROFESORI"

    id = Column(Integer, primary_key=True, index=True)
    nume = Column(String, nullable= False, index=True)
    prenume = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index = True)
    grad_didactic = Column(String, CheckConstraint("grad_didactic IN ('asist', 'sef lucr', 'conf', 'prof')"), index=True)
    tip_asociere = Column(String, CheckConstraint("tip_asociere IN ('titular', 'asociat', 'extern')"), nullable=False, index=True)
    asociere = Column(String, index = True)

    discipline = relationship("Discipline", back_populates="titular")


class Discipline(Base) : 
    __tablename__ = "DISCIPLINE"

    cod = Column(String, primary_key=True, index=True)
    nume_disciplina = Column(String, nullable=False, index=True)
    an_studiu = Column(Integer, nullable=False, index=True)
    tip_disciplina = Column(String, CheckConstraint("tip_disciplina in ('impusa', 'optionala', 'liber_aleasa')"), index=True)
    categorie_disciplina = Column(String, CheckConstraint("categorie_disciplina in ('domeniu', 'specialitate', 'adiacenta')"), index=True)
    tip_examinare = Column(String, CheckConstraint("tip_examinare in ('examen', 'colocviu')"), index=True)
    id_titular = Column(Integer, ForeignKey("PROFESORI.id"), nullable=True)

    titular = relationship("Profesori", back_populates="discipline")
    studenti = relationship("Studenti", secondary="JOIN_DS", back_populates="discipline")

class Studenti(Base) : 
    __tablename__ = "STUDENTI"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index = True)
    nume = Column(String, nullable= False, index=True)
    prenume = Column(String, nullable=False, index=True)
    ciclu_studii = Column(String, CheckConstraint("ciclu_studii in ('licenta', 'master')"), index=True)
    an_studiu = Column(Integer, nullable=False, index=True)
    grupa = Column(Integer, nullable=False, index=True)

    discipline = relationship("Discipline", secondary="JOIN_DS", back_populates="studenti")

class Join_DS(Base) :

    __tablename__ = "JOIN_DS"

    disciplinaID = Column(String(20), ForeignKey("DISCIPLINE.cod"), primary_key=True)
    studentID = Column(Integer, ForeignKey("STUDENTI.id"), primary_key=True)