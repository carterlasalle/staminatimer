# Product Requirements Document (PRD)

---

## **Product Name:** Edging Timer

**Document Version:** 1.0  

---

## **1. Executive Summary**
The **Edging Timer** is a digital tool designed to help men track and improve their sexual stamina through structured timing and data analysis. It provides an easy-to-use interface for managing and analyzing masturbation sessions, with features for timing active activity, pausing when edging, and tracking key metrics for self-improvement. [In Progress]

---

## **2. Objectives**
- **Primary Goal:** Enable users to improve sexual stamina by tracking and analyzing edging sessions. [In Progress]
- **Key Features:**
  - Three distinct timers for session tracking. [Done]
  - Comprehensive session analytics. [To Do]
  - Historical data for progress monitoring. [To Do]

---

## **3. Key Features & Functional Requirements**

### **3.1. Core Features**
1. **Timers**
   - **Overall Session Timer:** Tracks the entire duration of the session from start to finish. [Done]
   - **Active Masturbation Timer:** Tracks the time spent actively masturbating. [Done]
   - **Edge Timer:** Tracks the time spent in the paused edging state. [Done]
   
2. **Session Workflow**
   - Start button initiates the overall session and active masturbation timer. [Done]
   - Edge button pauses the active masturbation timer and starts the edge timer. [Done]
   - End Edge button resumes the active masturbation timer and pauses the edge timer. [Done]
   - Finish button ends all timers and records the session details. [In Progress]

3. **Analytics & History**
   - Total session time (active + edging). [Done]
   - Active masturbation time. [Done]
   - Total and individual edging times. [Done]
   - Time between edging events. [To Do]
   - Average time between edges in a session. [To Do]
   - Indication of whether climax occurred during edging. [To Do]

4. **Progress Tracking**
   - View historical sessions. [To Do]
   - Compare metrics such as total session time, average time between edges, and edging duration across sessions. [To Do]
   - Highlight improvements or regressions over time. [To Do]

---

## **4. User Workflow**

1. **Session Start:**
   - User clicks **Start**, and all timers initialize: [Done]
     - Overall Session Timer starts. [Done]
     - Active Masturbation Timer starts. [Done]

2. **Edge Trigger:**
   - When nearing climax, user clicks **Edge**: [Done]
     - Active Masturbation Timer pauses. [Done]
     - Edge Timer starts. [Done]

3. **End Edge:**
   - After calming down, user clicks **End Edge**: [Done]
     - Edge Timer pauses. [Done]
     - Active Masturbation Timer resumes. [Done]

4. **Session Finish:**
   - When finished, user clicks **Finish**: [In Progress]
     - All timers stop. [Done]
     - Session data is saved for analysis. [To Do]

5. **Data Review:**
   - Access session metrics: [To Do]
     - Total time (active + edging). [To Do]
     - Masturbation time. [To Do]
     - Edging time. [To Do]
     - Time between edges. [To Do]
     - Historical data for progress tracking. [To Do]

---

## **5. Technical Requirements**

1. **Platform**
   - Next.js Deployed to Vercel [Done]
   - TailwindCSS for styling [Done]
   - Shadcn/UI for components [Done]
   - Supabase for database [In Progress]

2. **Timers**
   - Real-time tracking with precision to the second. [Done]

3. **Database**
   - Store session data, including timestamps and calculated metrics. [In Progress]
   - Enable filtering, sorting, and visualization of historical data. [To Do]

4. **Analytics Engine**
   - Calculate averages, total times, and other metrics dynamically. [To Do]
   - Present improvements and trends visually (e.g., graphs, heatmaps). [To Do]

5. **User Interface**
   - Minimalist design with large, intuitive buttons for key actions: [Done]
     - Start, Edge, End Edge, and Finish. [Done]
   - Dashboard to display historical data and trends. [To Do]


---
Current Directory Structure:

.
├── README.md
├── instructions.md
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   └── app
│       ├── favicon.ico
│       ├── fonts
│       │   ├── GeistMonoVF.woff
│       │   └── GeistVF.woff
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── tailwind.config.ts
└── tsconfig.json


Raw Input as Reference:
k. Its an "Edging timer" aka a timer to increase stamina for men. its a mastermation timer. pretty much. So you click start when you start jerking off. it keeps going untill you click "edge", you clikc that when you are close to finishing and you pause, and the timer pauses, and a new pause timer starts, then you can resume/ end edging when you are done. you click finish when you "fishish" and u can track if u finished during you pause time. It should be all tracked from time, history, bc this is to improve sexual stamina for men. 

Workflow:
U start masterbating, you then click start, you get close to finishing so you click "edge", you wait until you calm down, then click end edging, then you keep going, then you get close again, you click "edge" again, and then calm down, then you end edging, you keep going, then you finish, so you click finish. You then can check total time(edging plus active masterbating time), materbating time, edging time, time between each edge, avg time between edge, and if you finished during your edge then compare it to every other session, seeing if you are improving or not, 


3 timers pretty much, an overall session timer, a active masterbation timer, and a edge/pause time , timer, kinda, but plus more according to the workflow
