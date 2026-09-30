# Project Plan: Bot-Like Behaviour Detection in Social Media Networks

## Project Scope
This project aims to build a complete, working, professional academic application that analyzes publicly available social-media data (TwiBot-20) to identify accounts exhibiting bot-like behavioural patterns. The system will provide model-based bot probability predictions along with comprehensive data analytics and insights.

## Project Phases & Handoffs

The project strictly follows a two-person, phase-by-phase development model:
- **Member 1**: Dataset, Data preprocessing, Feature engineering, Behaviour analytics, ML, NLP.
- **Member 2**: Project setup, Backend API, Database, Network analysis, React frontend, Dashboard, Integration.

| Phase | Description | Owner | Reviewer |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Project Planning & Setup | Both | Both |
| **Phase 1** | Project foundation | Member 1 | Member 2 |
| **Phase 2** | Data preprocessing & EDA | Member 2 | Member 1 |
| **Phase 3** | Feature engineering & behaviour analytics | Member 1 | Member 2 |
| **Phase 4** | Machine learning pipeline | Member 2 | Member 1 |
| **Phase 5** | NLP and network analysis | Member 1 | Member 2 |
| **Phase 6** | Dashboard & frontend integration | Member 2 | Member 1 |
| **Phase 7** | Account investigation & final integration | Member 1 | Member 2 |
| **Phase 8** | Testing & documentation | Both | Both |

## Handoff Rules
1. Only ONE member is the primary developer for a phase.
2. The other acts as a reviewer/tester.
3. Upon phase completion, a commit is made and pushed, and the developer STOPS.
4. The next developer pulls from main and proceeds with the next phase.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, Lucide React
- **Backend**: Python, FastAPI, Uvicorn
- **Data/ML/Network**: Pandas, NumPy, Scikit-learn, Joblib, NLTK, NetworkX
- **Database**: SQLite
