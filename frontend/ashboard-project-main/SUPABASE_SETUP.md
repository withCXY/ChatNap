# Supabase Dashboard Integration Setup Guide

## Overview
The Dashboard page has successfully integrated with Supabase and can now read real user information from the database, including user's name, platform, phone, etc., completely replacing the previous mock data.

## Setup Steps

### 1. Create Environment Variables File
Create a `.env.local` file in the `frontend/ashboard-project-main/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Get Supabase Configuration Information
1. Login to [Supabase Console](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the following information:
   - Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
   - anon public key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Database Table Structure
Ensure your Supabase database contains the following tables:

- `user_profiles` - User profile table
- `bookings` - Booking information table

The table structure is defined in the `database_schema.sql` file in the project root directory.

### 4. Start the Project
```bash
cd frontend/ashboard-project-main
npm run dev
```

## Features

### ✅ Implemented Features
- Read real user data from Supabase (name, platform, phone)
- Real-time data synchronization (automatically update UI when user information changes)
- Associated booking information display
- Loading states and error handling
- Automatic platform metrics calculation
- Customer search and filtering

### 🔄 Data Transformation
The system automatically transforms Supabase data to the format required by the Dashboard UI:
- `session_id` → `id`
- `name`, `phone`, `platform` directly mapped
- `conversationSummary` generated based on booking information
- `interactionStage` calculated based on booking status
- `accountStatus` calculated based on whether there are booking records

### 📊 Platform Metrics
The Dashboard automatically calculates statistics for each platform:
- Number of customers per platform
- Active customer percentage
- Platform distribution percentage

### 🔄 Real-time Updates
When user information or booking information in the database changes, the Dashboard will automatically update the displayed content without manual page refresh.

## Troubleshooting

### Common Issues
1. **Page shows "Loading customer data..."**
   - Check if `.env.local` file is correctly configured
   - Confirm if Supabase URL and API Key are correct

2. **Shows "Error loading data"**
   - Check network connection
   - Confirm if Supabase project is running normally
   - Check detailed error information in browser console

3. **No data displayed**
   - Confirm there is a `user_profiles` table in the database
   - Check if there is data in the table

### Development Debugging
In the browser console, you can see:
- Supabase connection status
- Data fetching process
- Any error messages

## Next Steps
- Ensure backend API also connects to the same Supabase instance
- Configure RLS (Row Level Security) policies to protect data
- Add user permission management 