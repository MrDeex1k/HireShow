# HIRE SHOW  
Platforma łącząca artystów ze zleceniodawcami  

## TechStack  
HTML + CSS + JavaScript - FrontEnd  
ExpressJS 5.1 + NodeJS v24 - BackEnd  
PostgreSQL 17.5 + KnexJS - Baza danych  
Sharp - Konwersja obrazów do WEBP  
mikr.us + Cloudflare - Hosting 

## Struktura  
hireshow/  
├── client/                     # Frontend
│   ├── assets/                     # Statyczne zasoby  
│   │   ├── css/                        # Pliki CSS  
│   │   ├── js/                         # Pliki JavaScript  
│   │   └── images/                     # Statyczne obrazy (np. logo)  
│   ├── views/                      # Pliki HTML (strony i szablony)  
│   └── index.html              # Główny plik HTML  
├── server/                     # Backend
│   ├── controllers/                # Logika biznesowa  
│   ├── dao/  
│   ├── database/                   # Interakcja z PostgreSQL  
│   ├── middleware/                 # Middleware  
│   ├── routes/                     # Trasy API  
│   ├── uploads/                    # Lokalne przechowywanie zdjęć artystów
│   └── index.js                # Główny plik ExpressJS 
├── .env                      # Zmienne środowiskowe  
├── README.md                 # Dokumentacja projektu  
└── package.json              # Zależności 