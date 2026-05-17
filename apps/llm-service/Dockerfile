# File: apps/llm-service/Dockerfile
FROM python:3.10-slim
WORKDIR /app

# Install uv, the fast Python package installer
RUN pip install uv

# Copy the requirements file first to leverage Docker layer caching
COPY ./apps/llm-service/requirements.txt .

# Install dependencies using uv
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the application source code
COPY ./apps/llm-service/main.py .

# Copy the MCP servers directory
COPY ./apps/llm-service/mcp_servers /app/mcp_servers

# Create reports directory
RUN mkdir -p /app/reports

# Expose the port the app runs on
EXPOSE 5001

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]