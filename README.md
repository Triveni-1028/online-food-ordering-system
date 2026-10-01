# Online Food Ordering System – Node.js + Express.js

Microservices project for CI/CD and Kubernetes.

Services: Restaurant 8001, Menu 8002, Order 8003, Frontend 8004.

Features: restaurant add/view/update/delete; menu add/view price+availability/update/delete; cart; wishlist; orders; status updates; 20-minute cancellation; delivery person name/phone; Docker; Kubernetes; tests; GitHub Actions; npm audit; Trivy; logs; metrics.

## Run
Open separate VS Code terminals:

```powershell
cd "D:\Online Food Ordering System\restaurant-service"
npm install
npm start
```
Repeat with `menu-service`, `order-service`, and `frontend`.

Open `http://localhost:8001/docs`, `http://localhost:8002/docs`, `http://localhost:8003/docs`, and `http://localhost:8004`.

## Docker
```powershell
docker compose up --build
```

## Kubernetes
This project deliberately uses the folder name **kubernetes**, not `k8s`.

```powershell
docker build -t food-restaurant:1.0.0 ./restaurant-service
docker build -t food-menu:1.0.0 ./menu-service
docker build -t food-order:1.0.0 ./order-service
docker build -t food-frontend:1.0.0 ./frontend
kubectl apply -f kubernetes/
kubectl get pods
kubectl get services
kubectl port-forward service/frontend-service 8004:80
```

## Tests
Run `npm test` inside each backend service.

## CI/CD
`.github/workflows/ci-cd.yml` runs tests, npm audit, Docker builds, commit-SHA versioning and Trivy scans.

The demo uses JSON files for simple persistence; production would normally use databases and persistent volumes.


## CI/CD Pipeline

GitHub Actions is used for the CI/CD pipeline.

Pipeline stages:
1. Source checkout from GitHub.
2. Install dependencies and run automated tests.
3. Run `npm audit` security checks.
4. Read the application version from `VERSION`.
5. Build versioned Docker images for all four services.
6. Scan all Docker images with Trivy.
7. Store the build version as a GitHub Actions artifact.
8. Optionally deploy the Kubernetes manifests automatically when the
   `ENABLE_K8S_DEPLOY` repository variable is enabled and Kubernetes
   credentials are supplied.

## Logging and Metrics

The backend services use Morgan for HTTP request logging and expose a
`/metrics` endpoint containing a request counter.
