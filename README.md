# Full-Stack Prototype School Build WIP (Backend Next)

A static frontend prototype that simulates a full-stack workflow using `localStorage`.

## Overview

This project is a browser-based app built with:

- HTML
- CSS
- Vanilla JavaScript
- Bootstrap 5 (CDN)

It includes account registration/login flows, role-based UI, and CRUD-style management pages for key entities.

## Features

- Hash-based routing between app sections
- Registration with simulated email verification
- Login/logout with local auth state
- Role-based access (`User` and `Admin`)
- `User`: profile + personal requests
- `Admin`: employees, departments, and account management
- Profile view/edit
- Request creation, editing, and deletion
- Employee CRUD
- Department CRUD
- Account CRUD (admin), including password reset simulation

## Demo Credentials

The app seeds a default admin account on first load:

- Email: `admin@example.com`
- Password: `Password123!`
- Role: `Admin`

If login fails with these credentials, clear site `localStorage` and reload once.

## Getting Started

1. Clone this repository.
2. Open `index.html` in your browser.

Optional local server:

```powershell
python -m http.server 5500
```

Then visit `http://localhost:5500`.

## Project Structure

- `index.html` - web app markup and page sections
- `style.css` - custom styling
- `script.js` - routing, auth simulation, storage, and CRUD logic

## Data and Persistence

- Main storage key: `ipt_demo_v1`
- App data is persisted in browser `localStorage`
- Clearing site storage resets the app to seeded defaults
- Includes migration support for legacy per-key storage values

## Notes

- School Build Project
- This is a prototype and not production-secure.
- Authentication and verification are simulated client-side.
- No backend or database is connected yet.
