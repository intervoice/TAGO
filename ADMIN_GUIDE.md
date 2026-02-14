# Tago Admin Guide & File Locations

This document outlines the critical files in the system for manual updates, password management, and adding features.

## 1. User & Password Management

### Running System (Docker)
When the system is running, user data is stored in a JSON file on the server.
*   **File Location:** `server/data/system_users.json`
*   **How to Edit:**
    1.  Access the server (or Persistent Volume).
    2.  Open `server/data/system_users.json`.
    3.  Find the `"password": "..."` field and change it.
    4.  Restart the backend container (`docker restart tago_backend`) to apply.

### Default Initialization (Code)
If the system is reset or installed fresh, it uses defaults defined in the code.
*   **File Location:** `App.tsx`
*   **Line:** Around line 131 (search for `initKey` or `system_users`).
*   **Code Snippet:**
    ```javascript
    usersData = [{
      id: 'admin-1', username: 'admin', password: 'TalTeufa', ...
    }];
    ```
*   **Action:** Change `'TalTeufa'` here to update the *default* password for new installations.

---

## 2. Interface Changes (UI)

### Main Page Structure
The main layout and logic invoke the components.
*   **File Location:** `App.tsx`
*   **Purpose:** Handles the "Tab" switching (Dashboard, Users, Airlines lists) and initial data loading.

### Dashboards & Tables
*   **File Location:** `components/Dashboard.tsx`
    *   Contains the "Summary Cards" (Total PNRs, Critical Alerts).
*   **File Location:** `components/GroupTable.tsx`
    *   Contains the main flight list table, headers, and row rendering.
*   **File Location:** `components/ReminderWidget.tsx`
    *   Contains the Notification Bell logic and "Due Today" checks.

---

## 3. Adding Options & Configuration

### Dropdown Options (Status, Airlines)
*   **File Location:** `constants.tsx` (or `App.tsx` defaults)
*   **Purpose:** Defines static lists like `STATUS_LIST`, `DEFAULT_AIRLINES`.
*   **Action:** Add new airlines or status types here to make them appear in dropdowns.

### Email Templates
*   **File Location:** `constants.tsx`
*   **Function:** `getEmailTemplate`
*   **Action:** Edit the HTML/Text strings here to change how automated emails look.

---

## 4. Server & Ports (Advanced)

*   **File Location:** `docker-compose.yml`
    *   Controls ports (e.g., `3001:3001`) and volumes (`tago_storage_v1`).
*   **File Location:** `nginx.conf`
    *   Controls how the browser talks to the backend (Proxy settings).
*   **File Location:** `server/index.js`
    *   The actual backend server code (API endpoints).
