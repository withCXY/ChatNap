from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv
import psycopg2

def get_current_datetime(tool_context) -> dict:
    now = datetime.now()
    return {
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "datetime": now.isoformat()
    }

    
def save_appointment_to_calendar(date: str, time: str, service: str, user_name: str, tool_context) -> dict:
    appointment_id = str(uuid.uuid4())
    datetime_str = f"{date}T{time}"
    load_dotenv()

    DB_URL = os.getenv("DATABASE_URL")

    try:
        # Connect to PostgreSQL via Supabase connection URI
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Ensure table exists (optional, for first time use)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY,
                title TEXT,
                date DATE,
                time TIME,
                datetime TIMESTAMPTZ,
                service TEXT,
                "user" TEXT,
                status TEXT
            );
        """)

        # Insert appointment
        cur.execute("""
            INSERT INTO appointments (id, title, date, time, datetime, service, "user", status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            appointment_id,
            f"{service} for {user_name}",
            date,
            time,
            datetime_str,
            service,
            user_name,
            "confirmed"
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {"confirmation": f"✅ Your appointment for **{service}** on **{date} at {time}** has been saved!"}

    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


def check_booking_conflicts(date: str, time: str, duration_minutes: int = 60, tool_context=None) -> dict:
    """Check for booking conflicts before scheduling"""
    load_dotenv()
    DB_URL = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        datetime_str = f"{date}T{time}"
        
        cur.execute("""
            SELECT COUNT(*) as conflicts
            FROM bookings
            WHERE status = 'confirmed'
            AND appointment_time = %s
        """, (datetime_str,))
        
        result = cur.fetchone()
        conflicts = result[0] if result else 0
        
        cur.close()
        conn.close()
        
        return {
            "has_conflicts": conflicts > 0,
            "conflict_count": conflicts,
            "message": f"Found {conflicts} existing appointments at this time" if conflicts > 0 else "Time slot is available"
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}

# Define the Booking Agent
booking_agent = Agent(
    name="BookingAgent",
    description="This agent handles user requests to make or reschedule appointments.",
    model="gemini-2.5-flash",
    tools=[
        save_appointment_to_calendar,
        get_current_datetime,
        check_booking_conflicts
    ],
    instruction="""
You are the Booking Agent. Your job is to help users make or reschedule appointments for services such as nails, makeup, or hairstyle.

Your tasks:
1. Understand the user's booking intent, including service, date, and time.
   - If the user says "tomorrow afternoon" or "next Friday at 10", interpret it relative to the current date and time.
   - Use the `get_current_datetime` tool to understand today's date and time before interpreting vague expressions.

2. Check user information from session state:
   - If we have the user's name, phone, and email from the session state, use them for booking.
   - If missing user information, politely ask for their name and phone number for the appointment.

3. Before scheduling, use `check_booking_conflicts` to verify the time slot is available.

4. After interpreting the date and time and checking availability:
   - Convert them to standard format: date in YYYY-MM-DD, and time in 24-hour format HH:MM.
   - Confirm with the user: "Just to confirm, you want to book a [service] on [date] at [time], right?"

5. If user confirms and no conflicts exist:
   - Call `save_appointment_to_calendar` with confirmed values.
   - The user's contact information will be automatically retrieved from the session state.

6. After saving:
   - Respond with a warm confirmation: "Your appointment has been saved! Looking forward to seeing you [user_name if available]."
   - Provide a brief reminder about the appointment details.

7. If there are booking conflicts:
   - Inform the user about the conflict and suggest alternative times.
   - Ask if they would like to choose a different time slot.

8. If anything is unclear or incomplete, gently prompt the user for clarification.

Important notes:
- Always be polite and professional.
- Use the user's name from session state when available to personalize the experience.
- If the user asks anything unrelated to booking, politely explain that you can only assist with appointments and suggest they ask the main assistant.
- Always confirm appointment details before saving.
"""
)
