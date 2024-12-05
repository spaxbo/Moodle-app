# Folosim Python 3.12 pe Alpine ca imagine de bază
FROM python:3.12-alpine

# Instalăm dependențele necesare pentru PostgreSQL și alte pachete necesare
RUN apk update && \
    apk add --no-cache gcc musl-dev libpq postgresql-dev

# Setăm directorul de lucru
WORKDIR /app

# Copiem fișierul requirements.txt și instalăm dependențele Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiem restul codului aplicației în container
COPY . .

# Expunem portul 8000 pentru FastAPI
EXPOSE 8000

# Comanda pentru a porni serverul FastAPI cu Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
