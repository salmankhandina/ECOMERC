# Storefront DevOps App

This repository contains a full functional mini storefront built with Node.js, Express, and MySQL. It includes:

- Product catalog with search and category filters
- Client-side cart with checkout
- Order creation persisted in MySQL
- Recent order feed
- Docker and Docker Compose setup
- Kubernetes manifests for app and database deployment
- Prometheus metrics endpoint for monitoring
- Grafana and Prometheus manifests
- GitHub Actions CI/CD workflow for image build, push, and deploy

## Stack

- Backend: Node.js, Express
- Database: MySQL 8
- Frontend: HTML, CSS, vanilla JavaScript
- Runtime: Docker Compose
- Monitoring: Prometheus, Grafana
- CI/CD: GitHub Actions
- Registry target: GitHub Container Registry

## Run with Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

## Run locally

1. Create a MySQL database and app user:

```sql
CREATE DATABASE IF NOT EXISTS storefront;
CREATE USER IF NOT EXISTS 'storefront'@'localhost' IDENTIFIED BY 'storefront';
CREATE USER IF NOT EXISTS 'storefront'@'127.0.0.1' IDENTIFIED BY 'storefront';
GRANT ALL PRIVILEGES ON storefront.* TO 'storefront'@'localhost';
GRANT ALL PRIVILEGES ON storefront.* TO 'storefront'@'127.0.0.1';
FLUSH PRIVILEGES;
```

2. Copy `.env.example` to `.env` and adjust credentials if needed.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

The app auto-initializes the schema and sample products on startup when `INIT_SCHEMA=true`.

## API endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `GET /metrics`

## DevOps flow

This repository is structured around the workflow:

`Code -> CI/CD -> Docker -> Registry -> Kubernetes -> Monitoring -> Rollback`

That maps to the implementation here as:

- Code changes are validated in GitHub Actions
- Docker images are built and pushed to `GHCR`
- Kubernetes manifests deploy the app and MySQL
- Prometheus scrapes app metrics from `/metrics`
- Grafana visualizes request rate, latency, orders, and revenue
- Kubernetes rollout commands can be used for release history and rollback

## Kubernetes deployment

The repository includes a `k8s/` folder with manifests for:

- `Namespace`
- `Secret`
- `ConfigMap`
- `PersistentVolumeClaim`
- MySQL `Deployment` and `Service`
- App `Deployment` and `Service`
- `Ingress`

For a local Minikube deployment:

1. Start Minikube.
2. Build the application image inside Minikube:

```bash
minikube image build -t storefront-app:v1 .
```

3. Apply the manifests:

```bash
kubectl apply -k k8s
```

4. Watch the rollout:

```bash
kubectl get pods -n storefront -w
```

5. Access the app with a temporary port forward:

```bash
kubectl port-forward -n storefront svc/storefront-app 3000:80
```

Then open `http://localhost:3000`.

If you want to use ingress, enable the Minikube ingress addon:

```bash
minikube addons enable ingress
```

Then map `storefront.local` to the Minikube IP in `/etc/hosts`.

## Monitoring deployment

Apply the monitoring stack after the base app resources:

```bash
kubectl apply -k k8s/monitoring
```

Access Prometheus:

```bash
kubectl port-forward -n storefront svc/prometheus 9090:9090
```

Access Grafana:

```bash
kubectl port-forward -n storefront svc/grafana 3001:3000
```

Grafana defaults:

- Username: `admin`
- Password: `admin123`

## CI/CD pipeline

The workflow is defined in [ci-cd.yml](/home/salman/Desktop/new/.github/workflows/ci-cd.yml:1).

Pipeline stages:

- install dependencies
- run Node syntax validation
- build the Docker image
- push the image to `ghcr.io`
- apply Kubernetes manifests
- update the running deployment image
- wait for rollout completion

To enable deployment from GitHub Actions, add this repository secret:

- `KUBE_CONFIG_DATA`: base64-encoded kubeconfig for the target cluster

The workflow uses `GHCR` through the built-in `GITHUB_TOKEN`.

## Rollback commands

View rollout history:

```bash
kubectl rollout history deployment/storefront-app -n storefront
```

Rollback to the previous release:

```bash
kubectl rollout undo deployment/storefront-app -n storefront
```

## Project structure

- `src/server.js`: startup and database bootstrap
- `src/app.js`: Express app setup
- `src/routes`: API route handlers
- `src/metrics.js`: Prometheus metrics registry and middleware
- `src/db/init.sql`: schema and seed data
- `public`: frontend assets
- `k8s`: Kubernetes manifests
- `k8s/monitoring`: Prometheus and Grafana manifests
- `.github/workflows`: CI/CD automation
