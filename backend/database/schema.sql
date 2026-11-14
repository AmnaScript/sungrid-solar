
CREATE DATABASE IF NOT EXISTS sungrid_solar;

USE sungrid_solar;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('staff', 'admin') NOT NULL DEFAULT 'staff'
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    status ENUM(
        'Scheduled',
        'In Progress',
        'Completed',
        'Cancelled'
    ) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
