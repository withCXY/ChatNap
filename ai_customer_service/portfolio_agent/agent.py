from google.adk.agents import Agent
from google.generativeai import GenerativeModel
from google.genai.types import Part

gemini_vision_model = GenerativeModel("gemini-2.5-flash")

def analyze_image_from_context(user_prompt: str = "Please determine if this style can be done. And tell the price", tool_context=None) -> str:
    """
    Analyzes an image from the user's message to determine if a style can be provided.
    This tool should be used when the user uploads an image and asks a question about it.
    It automatically finds the latest image in the user's message.
    """
    if tool_context is None:
        return "Error: Tool context not available. This tool must be called by the ADK framework."

    image_part = None
    text_from_message = ""
    
    # Search the history for the last user message with an image
    if hasattr(tool_context, "history"):
        for message in reversed(tool_context.history):
            if message.role == "user":
                found_image = None
                found_text_parts = []
                for part in message.parts:
                    if part.inline_data and "image" in part.inline_data.mime_type:
                        found_image = part
                    if part.text:
                        found_text_parts.append(part.text)
                
                if found_image:
                    image_part = found_image
                    text_from_message = " ".join(found_text_parts).strip()
                    break  # Found the latest user message with an image

    if not image_part:
        return "I am the portfolio agent, ready to analyze an image. Please upload an image so I can help you."

    # Use the prompt from the tool call if it's not the default, otherwise use the text from the message.
    final_prompt = user_prompt if user_prompt != "Please determine if this style can be done." else text_from_message
    if not final_prompt:
        final_prompt = "Please determine if this style can be done."  # A default if no text is found

    response = gemini_vision_model.generate_content([
        final_prompt,
        image_part
    ])
    return response.text.strip()

portfolio_agent = Agent(
    name="PortfolioAgent",
    description="This agent analyzes user-uploaded images to determine whether a requested style or service can be provided.",
    model="gemini-2.5-flash",
    tools=[
        analyze_image_from_context,
    ],
    instruction="""
You are the Portfolio Agent. Your job is to analyze images uploaded by users and determine whether the style shown can be done.

When the user uploads an image and asks a question about it, use the `analyze_image_from_context` tool to analyze it.
The tool will automatically use the image from the user's message.
You can pass the user's question to the `user_prompt` parameter of the tool if needed.

After analyzing, respond warmly and clearly. Examples:
   - “Yes! We can definitely recreate this style.”
   - “This look is absolutely within our service offerings.”
   - “This particular design may be outside our current range, but we’d love to offer something similar!”

Do not answer questions unrelated to images. If you get any non-image question, politely return the conversation to the dispatcher.
"""
)