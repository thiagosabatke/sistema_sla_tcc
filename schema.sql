CREATE DATABASE IF NOT EXISTS meu_tcc_db;


USE meu_tcc_db;


CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('usuario', 'analista', 'admin') NOT NULL,
    area_atendimento VARCHAR(100) NULL,
    resetPasswordToken VARCHAR(255) NULL, 
    resetPasswordExpires DATETIME NULL    
);

CREATE TABLE IF NOT EXISTS Tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Aberto', 'Em Andamento', 'Resolvido', 'Pendente') DEFAULT 'Aberto',
    category VARCHAR(50),
    urgency_ia ENUM('Crítica', 'Alta', 'Média', 'Baixa'),
    ia_confidence DECIMAL(3, 2) DEFAULT 0.80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    user_id INT, 
    analyst_id INT NULL, 
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (analyst_id) REFERENCES Users(id)
);


CREATE TABLE IF NOT EXISTS TicketHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL, 
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

INSERT INTO Users (name, email, password, role,) VALUES
('Admin User', 'admin@gmail.com', 'Admin123', 'admin');