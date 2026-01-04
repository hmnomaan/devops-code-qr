FROM python:3.9
# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
CMD ["uvicorn", "main:app", "--host","0.0.0.0", "--port","8000"]