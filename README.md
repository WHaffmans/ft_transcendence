*This project has been created as part of the 42 curriculum by fras, hesmolde, qmennen, whaffman, qbeukelm.*

# ft_transcendence: Modular Web Application Framework

![Project Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Tech Stack](https://img.shields.io/badge/Stack-Fastify%20%7C%20React-blue)
![Docker](https://img.shields.io/badge/Deployment-Docker-blue)

## 📖 Description

**ft_transcendence** is the final project of the 42 Common Core curriculum. Our team is building a robust, high-performance web application designed with a **modular architecture** at its core (microservices).

While the specific end-user application (e.g., Pong tournament, Social Platform) is currently in the ideation phase, the engineering focus is on creating a scalable framework where individual modules communicate via internal APIs. This approach allows for rapid feature expansion, independent testing, and separation of concerns—key pillars for scalable startup technology.

### Key Features (Planned)
* **Modular Micro-Architecture:** Independent modules for User Management, Game Logic, Chat, etc.
* **Real-time Capabilities:** Leveraging WebSockets for instant user interaction.
* **Secure Authentication:** Robust OAuth and 2FA implementation.
* **High Performance:** Utilization of Fastify for low-overhead backend processing.
* **Containerized Deployment:** Fully Dockerized environment for consistent deployment.

---

## 👥 Team Information

Our team operates using Agile methodologies, with clear role separation to ensure code quality, architectural integrity, and product vision.

| Name | Login | Role(s) | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Ferry Ras** | `fras` | **Product Owner (PO)** & Dev | • Defines product vision and roadmap.<br>• Prioritizes the backlog and feature requirements.<br>• Manages stakeholder/evaluator expectations.<br>• Maintains Trello and board sync. |
| **Hein Smolder** | `hesmolde` | **Project Manager (PM)** & Dev | • Tracks progress, deadlines, and team coordination.<br>• Facilitates Scrum process.<br>• Manages risks, blockers, and timelines. |
| **Willem Haffmans** | `whaffman` | **Tech Lead (Architecture)** & Dev | • Defines technical architecture and system design.<br>• Makes final decisions on the technology stack.<br>• Ensures modular interoperability. |
| **Quinten Mennen** | `qmennen` | **Tech Lead (Quality)** & Dev | • Enforces code quality standards and best practices.<br>• Reviews critical code changes.<br>• Manages CI/CD pipelines and linting rules. |
| **Quentin Beukelman** | `qbeukelm` | **Dedicated Developer** | • Focuses on core feature implementation.<br>• Rapid prototyping and module development.<br>• End-to-end testing of implemented features. |

> **Note:** As per project requirements, all team members actively contribute to the codebase as Developers.

---

## 🛠️ Technical Stack & Architecture

We have chosen a modern, performance-oriented stack suitable for scalable applications.

### Core Technologies
* **Frontend:** **React**. Chosen for its component-based architecture which aligns perfectly with our modular project goals.
* **Backend:** **Fastify**. Selected for its low overhead and high performance compared to Express, enabling faster API response times.
* **Database:** *[TODO: Decide on DB, e.g., PostgreSQL/Prisma]*.
* **Containerization:** **Docker**. Ensures the application runs with a single command across all environments.

### Development Quality Tools
To maintain a professional codebase suitable for long-term maintenance and scaling:
* **Husky:** Manages Git hooks to ensure bad code is not committed.
* **Commitlint:** Enforces semantic commit messages (e.g., `feat:`, `fix:`, `chore:`) to generate clean history and changelogs.
* **ESLint:** Runs pre-commit to catch syntax and style errors early.
* **Style Enforcer:** *[TODO: Decide on Prettier or specific Airbnb/Google style guide]*

### Architecture Overview
The application follows a modular design pattern. Each major feature (Game, Auth, Chat) functions as a distinct logical unit with defined internal API boundaries.
* *[TODO: Insert Diagram of Architecture once finalized]*

---

## 🚀 Instructions

### Prerequisites
* Docker & Docker Compose (Latest version)
* Node.js & npm (for local tooling installation)
* Git

### Installation & Execution
This project runs via Docker containers to ensure consistency.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-org/ft_transcendence.git](https://github.com/your-org/ft_transcendence.git)
    cd ft_transcendence
    ```

2.  **Environment Setup:**
    Create the `.env` file from the example.
    ```bash
    cp .env.example .env
    # Edit .env and add your API keys/Secrets
    ```

3.  **Run the Application:**
    The entire stack can be launched with a single command:
    ```bash
    make
    ```

4.  **Access:**
    * Frontend: `http://localhost:8080` (Default)
    * Backend API: `http://localhost:8080/api`

---

## 📅 Project Management

We utilize a hybrid toolset to manage the macro vision and micro execution:

1.  **Macro & Roadmap (Trello):** Managed primarily by the PO (Ferry) and PM (Hein). This board tracks high-level features (Epics) and sprint goals.
2.  **Micro & Tasks (GitHub Issues):** The technical source of truth. Trello cards are broken down into specific technical tasks here.
    * All commits must reference a GitHub Issue ID.
    * Pull Requests must be linked to Issues.

**Communication:**
* **Discord:** For daily stand-ups and quick synchronous communication.
* **GitHub Reviews:** For code-specific discussions and architectural validation.

---

## 🧩 Modules (14+ Points Target)

*This section details the modules chosen to meet the project requirements. [Status: Planning Phase]*

| Category | Module | Pts | Status | Owner(s) | Justification/Implementation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Web** | Framework (Fastify/React) | 2 | 🚧 | All | Using industry-standard frameworks for scalability. |
| **Web** | Realtime features WebSockets | 2 | 🚧 | All | Real-time updates across clients. Handle connections gracefully. |
| **Web** | User Interaction | 2 | 🚧 | ALL | Basic chat, profile, friends. |
| **Web** | Public API | 2 | 🚧 | ALL | Secured API key with ratelimiting, documentation and at least 5 endpoints |
| **Web** | Database ORM | 1 | 💭 | TBD | *[TODO: Select ORM]* |
| **User** | User Management & Authentification | 2 | 🚧 | All | User can add information, friends and display profile. |
| **User** | Game Stat and History | 1 | 🚧 | All | Track user game statistics, history, achievements, leaderboard. |
| **Game** | Complete web-based game | 2 | 🚧 | All | Build a real-time multiplayer web game with clear rules and win/loss conditions. |
| **Game** | Remote players (two) | 2 | 🚧 | All | Support smooth, resilient real-time play between two remote players. |
| **Game** | Multiplayer game (more than two) | 2 | 🚧 | All | Enable fair, synchronized multiplayer gameplay for 3+ players. |
| **Devops** | Backend as Microservices | 2 | 🚧 | All | Use loosely coupled microservices with clear, single-purpose interfaces. |
| **...** | ... | ... | ... | ... | *[TODO: Populate as we select modules]* |

Optional/TBD:
| Category | Module | Pts | Status | Owner(s) | Justification/Implementation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **...** | ... | ... | ... | ... | *[TODO: Populate as we select modules]* |


> **Total Points Planned:** 20 / 14 (6 more than mandatory)

---

## 🤖 AI Usage Guidelines

In compliance with the project subject, we utilize AI (Copilot, ChatGPT, Claude) to enhance productivity while maintaining full understanding of our code.

* **Boilerplate Generation:** Used to generate initial component structures and Docker configurations.
* **Debugging:** Used to analyze stack traces and suggest fixes for obscure Fastify/React edge cases.
* **Documentation:** Used to help format and spell-check this README and internal docs.

**Validation Protocol:** All AI-generated code is reviewed by a peer (Tech Lead) and must be fully understood by the implementer. We do not copy-paste complex logic without line-by-line verification.

---

## ⚖️ Legal & Compliance

* **Privacy Policy:** Accessible via the application footer.
* **Terms of Service:** Accessible via the application footer.
* **Browser Support:** Optimized for the latest stable Google Chrome. Compatible with Firefox and Safari.