# Library Database Management System - Complete Setup Guide (Group G55)

This is a guide on how to set up and run the Library of the People Database Management System.

## Prerequisites

Before starting, ensure you have the following installed on your system:

1. **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
3. **MySQL Server 8.0 or higher** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
4. **Git** - [Download Git](https://git-scm.com/downloads)

## Step 1: Clone the Repository

Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/adrianxmp/LibrarySystem.git
cd LibrarySystem
```

## Step 2: Set Up MySQL Database

1. Open MySQL command line client or MySQL Workbench
2. Create a new database and user:

```sql
CREATE DATABASE librarydb;
CREATE USER 'library_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON librarydb.* TO 'library_user'@'localhost';
FLUSH PRIVILEGES;
```

Note: You can change 'library_user' and 'password' to your preferred credentials, but remember to update them in the configuration file later.

## Step 3: Set Up the Backend (Django)

### 3.1 Create and Activate Virtual Environment

On Windows:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3.3 Create Environment File

Create a `.env` file in the root directory with the following content:

```env
DATABASE_NAME=librarydb
DATABASE_USER=library_user
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=3306
SECRET_KEY=your-secret-key-here
DEBUG=True
```

Replace the values with your MySQL credentials if you used different ones.

### 3.4 Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3.5 Create a Superuser

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 3.6 Start the Django Development Server

```bash
python manage.py runserver
```

The backend should now be running at `http://localhost:8000/`

## Step 4: Set Up the Frontend (React)

Open a new terminal window/tab while keeping the Django server running.

### 4.1 Navigate to Frontend Directory

```bash
cd frontend
```

### 4.2 Install Frontend Dependencies

```bash
npm install
```

If you encounter any errors, try:
```bash
npm install --legacy-peer-deps
```

### 4.3 Start the React Development Server

```bash
npm start
```

The frontend should now be running at `http://localhost:3000/`

## Step 5: Create Initial Users

### 5.1 Access Django Admin Panel

1. Open your browser and go to `http://localhost:8000/admin/`
2. Log in with the superuser credentials you created

### 5.2 Create a Librarian User

1. In the admin panel, click on "Users" under "LIBRARY_APP"
2. Click "Add User" button
3. Fill in the details:
   - Username: librarian1
   - Password: (set a password)
   - Role: librarian
4. Save the user

### 5.3 Create a Librarian Object

1. Go back to the admin home
2. Click on "Librarians"
3. Click "Add Librarian"
4. Fill in the details:
   - Librarian ID: 1
   - Name: Librarian One
   - Email address: librarian1@example.com
   - Phone number: 123-456-7890
5. Save

### 5.4 Link the User to the Librarian

1. Go back to "Users"
2. Click on the librarian1 user
3. Scroll down to "Additional Info" section
4. Select the Librarian object you just created from the dropdown
5. Save

## Step 6: Using the Application

### 6.1 Access the Application

Open your browser and go to `http://localhost:3000/`

### 6.2 Login as Librarian

Use the librarian credentials you created to log in. You'll have access to:
- Book Management
- Member Management
- Loan Management
- Event Management

### 6.3 Create a Member

As a librarian:
1. Go to Member Management
2. Click "Add Member"
3. Fill in member details
4. The system will automatically create a user account for the member
5. Default password for members is 'member123'

### 6.4 Login as Member

Members can log in with their username (usually their email without @domain) and the default password.

## Troubleshooting

### Common Issues and Solutions

1. **MySQL Connection Error**
   - Ensure MySQL server is running
   - Verify database credentials in `.env` file
   - Check if the database exists

2. **Port Already in Use**
   - Backend: Change port with `python manage.py runserver 8001`
   - Frontend: Change port by setting `PORT=3001 npm start`

3. **Module Not Found Error**
   - Backend: Ensure virtual environment is activated and all requirements are installed
   - Frontend: Run `npm install` again

4. **CORS Error**
   - Ensure Django is running on port 8000
   - Check CORS settings in Django settings.py

5. **Login Issues**
   - Verify user is properly linked to librarian/member object
   - Check user role is set correctly
   - Ensure password is correct

## Additional Notes

- The application uses JWT authentication
- Members must be registered by librarians before they can log in
- Books, loans, and events are managed by librarians
- Members can view their loans, browse books, and see library events
