# Bitespeed Backend Task: Identity Reconciliation

A RESTful API service that identifies and consolidates customer contact information across multiple purchases with different email addresses and phone numbers.

## Live Demo

API Endpoint: https://identity-reconciliation-service-71ak.onrender.com/

## Overview

This service provides an endpoint `/identify` that helps track customer identities across multiple purchases with different contact information. It links contacts by common email addresses or phone numbers and maintains a primary-secondary relationship between them.

## Technologies Used

- Node.js with TypeScript
- Express.js
- PostgreSQL

## Installation and Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL

### Local Setup

1. Clone the repository
   ```bash
   git clone https://github.com/monishdp/identity-reconciliation-service.git
   cd identity-reconciliation-service
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a PostgreSQL database
   ```bash
   createdb identity_reconciliation
   ```

4. Configure environment variables
   - Copy the `.env.example` to `.env`
   - Update the `DATABASE_URL` to match your PostgreSQL connection string

5. Build the application
   ```bash
   npm run build
   ```

6. Start the server
   ```bash
   npm start
   ```

   For development with hot reload:
   ```bash
   npm run dev
   ```

## API Usage

### POST /identify

Identifies a customer based on provided contact information and returns consolidated contact details.

**Request:**
```json
{
  "email": "example@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@example.com", "another@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Database Schema

```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  linked_id INTEGER,
  link_precedence VARCHAR(10) NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```
