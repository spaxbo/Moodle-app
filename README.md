
# **Learning Management System (LMS) Platform**

## **Description**  
This project is a modern **Learning Management System (LMS)** platform inspired by Moodle, designed to facilitate:  
- E-learning  
- Course management  
- Seamless interaction between **students**, **teachers**, and **disciplines**

  Login Page
  -  ![Screenshot (594)](https://github.com/user-attachments/assets/c030d8af-23d7-4dae-b439-18871b200014)
 
    
  Admin dashboard
  -  ![Screenshot (596)](https://github.com/user-attachments/assets/1be6952a-54ae-418f-a924-4f5af13d21a7)
 
  
  Teacher dashboard
  -   ![Screenshot (605)](https://github.com/user-attachments/assets/3812b31f-f273-412b-a139-b6842a8560f9)

  
  Student dashboard
  -  ![Screenshot (612)](https://github.com/user-attachments/assets/f8196182-c3b5-45bb-893c-5f1ce2865ded)




The platform is built using a **microservices architecture**, ensuring:  
- **Scalability**  
- **Maintainability**  
- **Efficiency**  

---

## **Microservices**

### **1. Teachers, Subjects, and Students Management**  
#### **Description**  
This microservice handles core functionalities related to managing the LMS data:  
- **Teachers**: Adding, updating, and retrieving teacher information.  
- **Subjects**: Managing the list of disciplines or courses offered.  
- **Students**: Handling student data and their enrollment in courses.

Create Teacher
- ![Screenshot (598)](https://github.com/user-attachments/assets/c223a529-e99e-4cde-bd26-88ed983017fd)

Update Teacher
- ![Screenshot (599)](https://github.com/user-attachments/assets/74944185-3f8d-4567-9d3b-88f0f5639083)


#### **Technologies Used**  
- **FastAPI**: For building the backend REST API efficiently.  
- **PostgreSQL**: To manage and store data in a reliable relational database.  
- **Docker**: For containerization and seamless deployment.  
- **Postman**: For testing and validating API endpoints.  

---

### **2. Evaluations and Materials Management**  
#### **Description**  
This microservice is focused on functionalities related to:  
- **Evaluations**: Managing assessments such as quizzes, tests, or assignments.  
- **Materials**: Uploading, updating, and viewing educational resources like PDFs, slides, or videos.  

#### **Integration with Microservice 1**  
The functionalities developed in this microservice have been integrated into **Microservice 1**, where:  
- **Teachers** can:  
  - Add new evaluations and materials.
 
  - ![Screenshot (608)](https://github.com/user-attachments/assets/b784321b-02bf-429c-827d-424357e44ee5)
  - ![Screenshot (611)](https://github.com/user-attachments/assets/a741c88b-4d3e-41af-ad47-fa4155f18206)

  - Update existing evaluations and materials.
    
  - ![Screenshot (609)](https://github.com/user-attachments/assets/91e1e55c-59ae-4a17-8c16-08cc7569ce80)
  - ![Screenshot (610)](https://github.com/user-attachments/assets/6e48a03f-57c9-48ef-9c31-0575bf167a4c)


- **Students** can:  
  - View available evaluations and materials assigned to their subjects or courses.
 
  - ![Screenshot (613)](https://github.com/user-attachments/assets/ef58f9cb-561b-44f2-8fdc-67df0f45abc4)
  - ![Screenshot (614)](https://github.com/user-attachments/assets/a1f4394b-a8cf-49bd-99fe-8d7489211299)


#### **Technologies Used**  
- **MongoDB**: For flexible and scalable data storage.  
- **FastAPI**: To create a fast and efficient REST API.  
- **Docker**: For containerization and seamless deployment.  
- **Postman**: For testing and validating API endpoints.  

---

### **3. Security with gRPC, FastAPI, and JWT**  
#### **Description**  
This microservice is responsible for securing the LMS platform using **gRPC** for efficient communication between services and **JWT (JSON Web Tokens)** for authentication and authorization.  

#### **Functionalities**  
- **gRPC-based communication**: Enables fast and secure interactions between microservices.  
- **JWT implementation**: Secures endpoints by requiring valid tokens for access, ensuring only authorized users can interact with the system.  
- **FastAPI for gRPC integration**: Combines the simplicity of FastAPI for defining REST APIs with gRPC for inter-service communication.

#### **Technologies Used**  
- **FastAPI**: For building RESTful APIs alongside gRPC communication.  
- **gRPC**: For efficient service-to-service communication.  
- **Docker**: For containerized deployment of the gRPC and FastAPI service.  
- **Postman**: For testing gRPC requests and verifying token-based security.  

---

### **4. Frontend Development**  
#### **Description**  
This microservice focuses on building the user interface for the LMS platform using **React**, providing a modern and dynamic user experience.  

#### **Functionalities**  
- **Teacher Dashboard**: Allows teachers to manage courses, add materials, and evaluations.  
- **Student Dashboard**: Enables students to view courses, materials and evaluations.  

#### **Technologies Used**  
- **React**: For building a responsive and dynamic frontend.
- **Next.js**: For server-side rendering (SSR), static site generation (SSG), and better SEO.
- **Tailwind CSS**: For rapid styling using utility-first CSS classes.
- **Npm**: As the package manager to manage dependencies.
- **TypeScript**: For adding static typing and improving code maintainability. 

---
