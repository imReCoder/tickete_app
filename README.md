# NestJS Sync Service

## 🚀 Overview

This NestJS application provides an efficient data synchronization service that fetches and updates data at different time intervals (daily, every 4 hours, and every 15 minutes). The service ensures optimized API usage, queue-based processing, and error handling for seamless sync operations.

## 📌 Features

- **Scheduled Syncing**: Runs automatic synchronization at multiple
  intervals.
- **Rate Limit Handling**: Manages API requests efficiently.
- **Queue-Based Processing**: Ensures controlled execution to prevent
  overload.
- **Abort Mechanism**: Allows pausing sync processes.
- **Logging & Monitoring**: Tracks sync performance and errors.

## 🏗️ Installation & Setup

### Prerequisites

- **Node.js** (v20 or later)
- **NestJS CLI**

### Installation Steps

    # Clone Repo
    git clone https://github.com/imReCoder/tickete_app.git
    cd nestjs-sync-service

    # Install dependencies
    npm install

    # Add .env variables
    .env

    # Run the application
    npm run start

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

    PORT=4200

    PARTNER_API=
    PARTNER_API_TOKEN=

    BATCH_SIZE=5
    RATE_LIMIT_PER_MINUTE=30

    DATABASE_URL=

## 📡 API Endpoints

![Endpoints](https://github.com/imReCoder/tickete_app/blob/master/endpoints_table.png)

## 🔄 Sync Process Flow

1.  **Cron Jobs Execution:**

    - Every 15 minutes: Fetches data for today for all products.
    - Every 4 hours: Fetches data for the next 7 days for all available products.
    - Every day: Fetches data for the next 30 days for all available products.

2.  **Task Queuing:**

    - When any cron job is triggered, tasks are added to a queue.
    - The queue processes tasks in batches of `X`.

3.  **Batch Processing:**

    - Fetches data from external API.
    - Bulk Creates or updates records in the database.

![alt text](https://github.com/imReCoder/tickete_app/blob/master/fow.png)

## 🔧 Improvements

- Instead of an in-memory queue service, we can use **BullMQ** for better scalability. (For demo purposes, a simple in-memory queue was used.)
- Instead of raw queries, we can use **stored procedures** for better performance.

💡 _Developed with ❤️ using NestJS_
