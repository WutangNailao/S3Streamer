# S3 Video Streaming Application

A Rust + Solid application for listing and streaming video files from an S3 bucket using pre-signed URLs.

## Structure

- `backend/` Rust API server (Actix Web + AWS SDK)
- `frontend/` Solid + Vite + Tailwind UI
- Docker runs both in a single container (Rust serves static files)

## Features

- Lists video files from a specified S3 bucket
- Streams videos using pre-signed URLs
- Folder navigation, pagination, and full-screen playback
- Responsive layout for desktop and mobile

## Prerequisites

- Rust toolchain (stable)
- Node.js (for the frontend toolchain)
- pnpm
- AWS account with S3 bucket containing video files
- AWS access key ID and secret access key with permissions to list/read objects

## Setup

1. Clone this repository.
2. Configure environment variables:

```bash
cp .env.example .env
```

Then edit `.env`:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_aws_region
AWS_S3_ENDPOINT_URL=https://s3.your_aws_region.amazonaws.com
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_FORCE_PATH_STYLE=false
PORT=3000
STATIC_DIR=static
```

## Running the Backend

```bash
cd backend
cargo run
```

The API will listen on `http://localhost:3000` by default.

## Running the Frontend (Dev)

```bash
cd frontend
pnpm install
pnpm dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` to the backend.

## Build Frontend (Static)

```bash
cd frontend
pnpm build
```

The build output is in `frontend/dist`.

## Running with Docker

```bash
docker build -t s3-streamer .
docker run --rm -p 3000:3000 --env-file .env s3-streamer
```

In Docker, the backend serves the frontend static files from `STATIC_DIR`.

## How It Works

1. The backend lists objects in the S3 bucket and filters for video extensions.
2. When a user selects a video, the backend generates a pre-signed URL.
3. The frontend redirects the video player to the pre-signed URL, enabling direct streaming from S3.

## Security Notes

- Keep `.env` out of version control.
- Pre-signed URLs expire (default 1 hour) for security.

## License

ISC
