# Errors and Solutions — devops-qr-code

This document collects the runtime errors, root causes, repro steps, and fixes applied while developing the QR-code project. Use it for debugging and learning.

---

## Environment
- Backend: FastAPI (api/main.py)
- Frontend: Next.js (front-end-nextjs/src/app/page.js)
- Storage: AWS S3 bucket `hmnomaan-devops`

---

## 1) AccessControlListNotSupported (S3 PutObject)
- Symptom / message:
  - `An error occurred (AccessControlListNotSupported) when calling the PutObject operation: The bucket does not allow ACLs`
- Cause:
  - The bucket has Object Ownership set to **Bucket owner enforced** (ACLs disabled). Passing `ACL='public-read'` to `put_object` is rejected.
- Reproduce:
  - Call the upload endpoint with `ACL='public-read'` set.
- Fixes applied:
  - Removed `ACL='public-read'` from the S3 `put_object` call.
  - Two safe alternatives:
    - Make objects public via a bucket policy (see example below), then construct a clean public URL to return.
    - Keep the bucket private and return a presigned URL to the client (temporary access).
- Files changed:
  - [api/main.py](api/main.py)
- Example bucket policy (if you want permanent public read on `qr_codes/`):
```json
{
  "Version":"2012-10-17",
  "Statement":[{
    "Sid":"PublicReadGetObject",
    "Effect":"Allow",
    "Principal":"*",
    "Action":["s3:GetObject"],
    "Resource":["arn:aws:s3:::hmnomaan-devops/qr_codes/*"]
  }]
}
```

---

## 2) TypeError: Cannot read properties of null (reading 'qr_code_url') (Frontend)
- Symptom / message:
  - `TypeError: Cannot read properties of null (reading 'qr_code_url')` in the browser console.
  - DevTools showed: `Empty response {data: null, status: 200, ...}`
- Cause:
  - Frontend code assumed `response.data` is always an object and accessed `response.data.qr_code_url` directly.
  - Backend returned `null` or empty body (or JSON without `qr_code_url`) alongside HTTP 200, leading `response.data` to be `null`.
- Reproduce:
  - Hit the frontend submit when the backend returns no JSON body or returns `null`.
- Fixes applied:
  - Add defensive checks in `handleSubmit`:
    - Verify `response` and `response.data` exist before accessing properties.
    - Check `qr_code_url` presence and display an error if missing.
    - URL-encode user input before sending.
  - Show friendly error text on the page when API fails.
- Files changed:
  - [front-end-nextjs/src/app/page.js](front-end-nextjs/src/app/page.js)
- Example defensive code:
```js
const response = await axios.post(`/generate-qr/?url=${encodeURIComponent(url)}`);
if (!response || !response.data) { /* handle empty */ }
const { qr_code_url } = response.data;
if (!qr_code_url) { /* handle missing field */ }
```

---

## 3) IndentationError: unexpected indent (server start)
- Symptom / message:
  - Full Python traceback with `IndentationError: unexpected indent` while Uvicorn tried to import `main.py`.
- Cause:
  - Accidental stray whitespace/incorrect indentation in `api/main.py` (likely during an edit). This prevented importing the app.
- Fix applied:
  - Corrected file indentation and import ordering so Python can import module cleanly.
- Files changed:
  - [api/main.py](api/main.py)

---

## 4) Backend returning presigned URLs (contains AWSAccessKeyId, Signature, Expires)
- Symptom / message:
  - Backend returned a signed S3 URL like `https://...amazonaws.com/...png?AWSAccessKeyId=...&Signature=...&Expires=...`.
- Cause:
  - Code used `generate_presigned_url` (or equivalent) and returned the presigned URL to the client.
  - Signed URLs are temporary and include sensitive query parameters.
- Why this matters:
  - If you want a permanent, clean image link (no signature, no expiry) the bucket/object must be public and the backend should return a constructed object URL instead.
- Fix(es) available:
  - If you want clean URLs: construct and return `https://{bucket}.s3.{region}.amazonaws.com/{key}` and make the object public via policy or prefix permissions.
  - If the bucket must remain private: keep using presigned URLs.
- Files changed:
  - [api/main.py](api/main.py) — changed to return a clean URL by default (see note below).
- Note: the code now returns a clean URL; if the object is not public you will get 403 when fetching the URL. In that case revert to returning presigned URLs.

---

## 5) CORS / origin mismatch
- Symptom / message:
  - Browser console shows CORS errors when the frontend (http://localhost:3000) calls the backend (http://127.0.0.1:8000).
- Cause:
  - Backend CORS policy did not include the frontend origin (or was too restrictive).
- Fix applied:
  - `CORSMiddleware` added with `allow_origins = ["http://localhost:3000"]`. For debugging you can temporarily set `allow_origins=["*"]` and then tighten to the real origin.
- Files changed:
  - [api/main.py](api/main.py)

---

## 6) Missing/incorrect AWS credentials or region
- Symptom / message:
  - Boto3 errors like `NoCredentialsError`, or some operations failing in a region-specific way.
- Cause:
  - `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, or `AWS_DEFAULT_REGION` not set in environment. Or region-specific endpoints not used.
- How to fix / check:
  - Verify environment variables:
    ```bash
    echo $AWS_ACCESS_KEY $AWS_SECRET_KEY $AWS_DEFAULT_REGION
    ```
  - Or rely on AWS CLI config (~/.aws/credentials) or IAM role when running on EC2/Lambda.
  - In code, the S3 client was created with `region_name=os.getenv("AWS_DEFAULT_REGION")`.
- Files changed:
  - [api/main.py](api/main.py)

---

## 7) Unsafe S3 keys (filenames with slashes or query params)
- Symptom:
  - Unexpected S3 key names, object created under wrong path, or upload failures.
- Cause:
  - Code built S3 key from raw URL (e.g. `url.split('//')[-1]`) which may include `/`, `?`, `&`, etc.
- Fix applied:
  - Use UUID-based filenames for S3 keys: `qr_codes/{uuid4().hex}.png` to guarantee safe keys.
- Files changed:
  - [api/main.py](api/main.py)

---

## 8) Missing Python dependencies
- Possible symptoms:
  - `ModuleNotFoundError: No module named 'qrcode'` or `PIL`/`Pillow` missing.
- Ensure `api/requirements.txt` contains (at minimum):
  - `boto3`
  - `python-dotenv`
  - `qrcode`
  - `Pillow`
  - `fastapi`
  - `uvicorn`
- Install in virtualenv:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Test / Debug commands (quick checklist)
- Restart backend and watch for import/indentation errors:
```bash
cd api
uvicorn main:app --reload
```
- Call the endpoint directly with curl to inspect JSON yourself:
```bash
curl -v "http://127.0.0.1:8000/generate-qr/?url=https://example.com"
```
- If frontend complains about `response.data === null`, run the above `curl` — if `curl` shows an empty body or `null`, fix the backend to return JSON.

---

## Summary of changes made in this session
- `api/main.py`
  - Fixed indentation/import issues that prevented the app from importing.
  - Removed `ACL='public-read'` from S3 upload.
  - Added `region_name` usage, logging, and safer S3 keys with `uuid4()`.
  - Changed behavior to return a clean public S3 URL by default (constructs URL using bucket and region).
  - (Previously a presigned URL was used; that was changed per request.)

- `front-end-nextjs/src/app/page.js`
  - Added defensive response checks (ensure `response.data` exists).
  - URL-encoded the user input (`encodeURIComponent(url)`) before sending.
  - Added an `error` UI state that displays server or client error messages.

---

## If you want me to do next
- I can add the recommended `requirements.txt` entries or update the existing file.
- I can add a sample bucket-policy JSON into the repo for easy copy/paste.
- I can change the backend to detect whether the bucket is private and return presigned URLs automatically.

---

Document created on: 2025-12-25
