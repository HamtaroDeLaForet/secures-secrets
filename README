# Secret Manager — Secure Secret Sharing

Application Full Stack permettant de partager un secret (texte) de manière sécurisée sans passer par email.

Un secret :

- est protégé par un mot de passe  
- est chiffré côté API  
- n’est jamais stocké en clair en base  
- expire après un temps défini (minutes) ou un nombre de consultations  

---

## Stack

- **Frontend** : Next.js (TypeScript / TSX)  
- **Backend** : Django (Python)  
- **Orchestration** : Docker Compose  

---

## Structure du projet

```
.
├── backend/                 # API Django
├── frontend/secrets_app/    # Application Next.js
├── docker-compose.yml
└── README.md
```

---

## Prérequis

- Node.js (18+ recommandé)
- Docker & Docker Compose

---

## Lancer le projet

### 1. Lancer le backend

À la racine du projet :

```bash
docker compose up --build
```

Le backend sera accessible sur :

```
http://localhost:8000
```

Si nécessaire (premier lancement) :

```bash
docker compose exec backend python manage.py migrate
```

---

### 2. Lancer le frontend

Dans un second terminal :

```bash
cd frontend/secrets_app
npm install
npm run dev
```

Le frontend sera accessible sur :

```
http://localhost:3000
```

---

## Configuration

### Backend

Créer un fichier `.env` dans `backend/` si nécessaire :

```env
DJANGO_SECRET_KEY=dev-secret-key-change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

### Frontend

Créer un fichier `.env.local` dans `frontend/secrets_app/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Fonctionnalités

- Création d’un secret protégé par mot de passe  
- Expiration configurable :
  - par durée (minutes)
  - par nombre de récupérations  
- Stockage chiffré en base de données  
- Récupération sécurisée :
  - mot de passe correct → `200`
  - mot de passe incorrect → `403`
- Interface d’administration listant les secrets créés  

---

## API (Résumé)

Exemples de routes :

- `POST /api/secrets/` → création d’un secret  
- `POST /api/secrets/{id}/reveal/` → récupération d’un secret  
- `GET /api/admin/secrets/` → listing des secrets  

---

## Sécurité

- Aucun secret stocké en clair  
- Clé dérivée du mot de passe utilisateur  
- Stockage :
  - ciphertext
  - IV / nonce
  - salt
  - métadonnées (expiration, compteur)  
- Gestion côté API :
  - décrément du compteur de vues
  - vérification d’expiration
  - contrôle d’accès strict  

---

## Améliorations possibles

- Notification email lors de la consultation d’un secret  
- Authentification Google pour l’accès à l’admin (allowlist)  
- Rate limiting  
- Captcha anti-abus  
- Suppression automatique des secrets expirés  
- Tests unitaires et d’intégration  

---

## Auteur

Mateo Fauquembergue
