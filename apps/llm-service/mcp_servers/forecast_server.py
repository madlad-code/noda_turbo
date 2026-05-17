# File: apps/llm-service/mcp_servers/forecast_server.py
import os
import httpx
from fastmcp import FastMCP
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger("noda.forecast")

# Create MCP server
mcp = FastMCP("NODA Forecast Server")

FORECAST_API_URL = os.getenv("FORECAST_API_URL", "http://209.38.219.156:5000/forecast/")

@mcp.tool()
async def get_forecast(building_id: str, access_token: str = "default_token") -> dict:
    """
    Get energy consumption forecast for a specific building.
    
    Args:
        building_id: The ID of the building to forecast
        access_token: Authentication token for the forecast API
    
    Returns:
        Chart data in Chart.js format with forecast values
    """
    try:
        logger.info(f"📊 Requesting forecast for building: {building_id}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                FORECAST_API_URL,
                json={
                    "access_token": access_token,
                    "building_id": building_id
                },
                headers={
                    "accept": "application/json",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Forecast API error: {response.status_code}")
                return {
                    "error": f"Forecast API returned status {response.status_code}",
                    "chart_data": None
                }
            
            data = response.json()
            forecast_values = data.get("forecast", [])
            
            if not forecast_values:
                logger.warning("⚠️ No forecast data returned")
                return {
                    "error": "No forecast data available",
                    "chart_data": None
                }
            
            logger.info(f"✅ Received {len(forecast_values)} forecast data points")
            
            return {
                "success": True,
                "forecast_values": forecast_values,
                "num_days": len(forecast_values),
                "avg_consumption": sum(forecast_values) / len(forecast_values),
                "peak_day": forecast_values.index(max(forecast_values)) + 1,
                "peak_value": max(forecast_values)
            }
            
    except httpx.TimeoutException:
        logger.error("❌ Forecast API timeout")
        return {
            "error": "Forecast API request timed out",
            "chart_data": None
        }
    except Exception as e:
        logger.error(f"❌ Forecast error: {str(e)}")
        return {
            "error": f"Error getting forecast: {str(e)}",
            "chart_data": None
        }

if __name__ == "__main__":
    mcp.run()