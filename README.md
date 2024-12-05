Learning Management System (LMS) Platform
Description

This project is a modern Learning Management System (LMS) platform inspired by Moodle, designed to facilitate e-learning, course management, and seamless interaction between students, teachers, and disciplines.

The platform is built using microservices architecture to ensure scalability, maintainability, and efficiency.

Microservices
Microservice 1: Teachers, Subjects, and Students Management

The first microservice is responsible for managing routes and operations related to:

    Teachers: Adding, updating, and retrieving teacher data.
    Subjects: Managing the list of disciplines/courses offered.
    Students: Handling student data and their enrollment in courses.

Technologies Used

This microservice is built using the following stack:

    FastAPI: For building the backend REST API efficiently.
    PostgreSQL: To manage and store data in a reliable relational database.
    Docker: For containerization and seamless deployment.
    Postman: For testing and validating API endpoints.

Microservice 2: Evaluations and Materials Management

This microservice is focused on handling functionalities related to:

    Evaluations: Managing assessments such as quizzes, tests, or assignments.
    Materials: Uploading, updating, and viewing educational resources like PDFs, slides, or videos.

Integration with Microservice 1

The functionalities developed in this microservice have been integrated into Microservice 1, where:

    Teachers can:
        Add new evaluations and materials.
        Update existing evaluations and materials.
    Students can:
        View available evaluations and materials assigned to their subjects or courses.

Technologies Used

This microservice is built using:

    MongoDB: For flexible and scalable data storage.
    FastAPI: To create a fast and efficient REST API.
    Docker: For containerization and seamless deployment.
    Postman: For testing and validating API endpoints.

Microservice 3: Security with gRPC and JWT
Description

This microservice is responsible for securing the LMS platform using gRPC for efficient communication between services and JWT (JSON Web Tokens) for authentication and authorization.
Functionalities

    gRPC-based communication: Enables fast and secure interactions between microservices.
    JWT implementation: Secures endpoints by requiring valid tokens for access, ensuring only authorized users can interact with the system.

Technologies Used

    gRPC: For efficient service-to-service communication.
    Docker: For containerized deployment of the gRPC service.
    Postman: For testing gRPC requests and verifying token-based security.

Microservice 4: Frontend Development
Description

This microservice focuses on building the user interface for the LMS platform using React, providing a modern and dynamic user experience.
Functionalities

    Teacher Dashboard: Allows teachers to manage courses, add materials, and evaluations.
    Student Dashboard: Enables students to view courses, materials, and complete evaluations.

Technologies Used

    React: For building a responsive and dynamic frontend.
