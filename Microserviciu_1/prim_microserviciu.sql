create table PROFESORI(
    id serial primary key,
    nume varchar(255) not null ,
    prenume varchar(255) not null ,
    email varchar(255) unique,
    grad_didactic varchar(255) check ( grad_didactic in ('asist', 'sef lucr', 'conf', 'prof') ),
    tip_asociere varchar(255) check ( tip_asociere in ('titular', 'asociat', 'extern') ) not null,
    asociere varchar(255)
);

CREATE TABLE DISCIPLINE (
    cod VARCHAR(20) PRIMARY KEY,
    nume_disciplina VARCHAR(255) NOT NULL,
    an_studiu INT NOT NULL,
    tip_disciplina VARCHAR(255) CHECK (tip_disciplina IN ('impusa', 'optionala', 'liber_aleasa')) NOT NULL,
    categorie_disciplina VARCHAR(255) CHECK (categorie_disciplina IN ('domeniu', 'specialitate', 'adiacenta')) NOT NULL,
    tip_examinare VARCHAR(255) CHECK (tip_examinare IN ('examen', 'colocviu')) NOT NULL,
    id_titular INT NULL,
    FOREIGN KEY (id_titular) REFERENCES PROFESORI(id) ON DELETE SET NULL
);

CREATE TABLE STUDENTI (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    nume VARCHAR(255) NOT NULL,
    prenume VARCHAR(255) NOT NULL,
    ciclu_studii VARCHAR(255) CHECK (ciclu_studii IN ('licenta', 'master')) NOT NULL,
    an_studiu INT NOT NULL,
    grupa INT NOT NULL
);

CREATE TABLE JOIN_DS (
    disciplinaID VARCHAR(20),
    studentID INT,
    PRIMARY KEY (disciplinaID, studentID),
    FOREIGN KEY (disciplinaID) REFERENCES DISCIPLINE(cod) ON DELETE CASCADE,
    FOREIGN KEY (studentID) REFERENCES STUDENTI(id) ON DELETE CASCADE
);

select * from PROFESORI;
select * from DISCIPLINE;
select * from studenti;
select * from JOIN_DS;
