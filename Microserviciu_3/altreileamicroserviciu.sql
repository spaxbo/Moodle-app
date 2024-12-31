CREATE TYPE user_role AS ENUM('admin', 'profesor', 'student');

Create TABLE users(
    id serial PRIMARY KEY,
    email VARCHAR(255) UNIQUE not null,
    password VARCHAR(255) not null,
    rol user_role not null
);

CREATE TABLE blacklist(
    id serial PRIMARY KEY,
    token VARCHAR(512) UNIQUE not null,
    blacklisted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);