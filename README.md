# devops-qr-code

A sample DevOps capstone application that generates QR codes for submitted URLs. The project demonstrates containerization, Kubernetes deployment, CI/CD, and basic cloud storage integration.

Main components
- Front-end: Next.js application located in `front-end-nextjs` that provides the user interface for submitting URLs and viewing generated QR codes.
- API: FastAPI-based Python service in the `api` directory that accepts URL submissions, generates QR images, and uploads them to an S3 bucket.
===================================================
========================================================================
Repository layout
- `api/` - FastAPI application, tests, and Python requirements.
- `front-end-nextjs/` - Next.js source, Dockerfile, and frontend configs.
- `backend.yaml`, `frontend.yaml` - Kubernetes manifests used for deployment to a cluster.
- `infrastructure/` - Terraform artifacts for infra provisioning (if used).
- `aws/` - helper scripts and docs for AWS-related setup.
===============================================================================
================================================================================
Quick start (local development)
=======================
1) Run the API locally

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# create a .env with AWS keys or set environment variables
# set BUCKET_NAME in environment or main.py as needed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000` by default.
===========================================================================
============================================================================
2) Run the front-end locally

```bash
cd front-end-nextjs
npm install
npm run dev
```
====================================================================================
====================================================================================
Front-end will run at `http://localhost:3000` and should be configured to call the API (check the frontend environment variables in `front-end-nextjs` if needed).

Running with Docker

- Build the API image (example):

```bash
cd api
docker build -t devops-qr-code-api:local .
```

- Build the frontend image:

```bash
cd front-end-nextjs
docker build -t devops-qr-code-frontend:local .
```

Kubernetes deployment

- The repository contains `backend.yaml` and `frontend.yaml` which define Deployments/Services for the API and frontend. Apply them with:

```bash
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
```

If you see decoding errors when applying manifests, verify YAML indentation and that top-level `spec` is not nested under `metadata`.

CI/CD

- There is a GitHub Actions workflow (see `.github/workflows/build-docker.yml`) that builds Docker images and (optionally) pushes to a registry.
- To enable automated deploys, configure secrets for your Docker registry and Kubernetes cluster context in your CI provider.

Configuration and environment variables
- API (in `api/main.py` or `.env`):
	- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` – credentials for S3 access (or rely on IAM roles when running in cloud)
	- `BUCKET_NAME` – S3 bucket where QR images will be stored
	- `AWS_REGION` – region of the S3 bucket
- Frontend: configure API base URL in the Next.js environment variables (check `front-end-nextjs` docs/config files)

Testing
- Backend tests: run from the `api` folder (example):

```bash
cd api
pytest
```

Contributing
- Feel free to open issues or PRs. Recommended workflow:
	1. Fork the repo
	2. Create a feature branch
	3. Add tests for behavioral changes
	4. Open a PR with a clear description and testing steps

Troubleshooting tips
- If Kubernetes returns errors like "unknown field \"metadata.replicas\"": ensure `spec` is a top-level key under the object (not under `metadata`).
- If uploads to S3 fail, verify the bucket name, region, and credentials/permissions.

Author
- HM Nomaan (https://github.com/hmnomaan)

License
- MIT (see LICENSE)
