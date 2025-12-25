from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import qrcode
import boto3
import os
from io import BytesIO
from dotenv import load_dotenv
from uuid import uuid4
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "server running"}


# Allowing CORS for local testing
origins = [
    "http://localhost:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# AWS S3 Configuration (include region_name if provided)
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    region_name=os.getenv("AWS_DEFAULT_REGION"),
)

bucket_name = 'hmnomaan-devops'  # Add your bucket name here


@app.post("/generate-qr/")
async def generate_qr(url: str):
    # Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Save QR Code to BytesIO object
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    # Use a safe filename (UUID) to avoid invalid characters
    file_name = f"qr_codes/{uuid4().hex}.png"

    try:
        # Upload to S3 without ACL (bucket may disallow ACLs)
        s3.put_object(Bucket=bucket_name, Key=file_name, Body=img_byte_arr, ContentType='image/png')

        # Construct a clean public S3 URL (no signature/query params)
        region = os.getenv("AWS_DEFAULT_REGION")
        if region:
            file_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_name}"
        else:
            file_url = f"https://{bucket_name}.s3.amazonaws.com/{file_name}"
        logger.info("Uploaded QR to S3: %s", file_url)
        return {"qr_code_url": file_url}
    except Exception as e:
        logger.exception("Failed to upload QR to S3")
        return JSONResponse(status_code=500, content={"error": str(e)})


