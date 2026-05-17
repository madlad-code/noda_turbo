# File: apps/llm-service/mcp_servers/pdf_server.py

import os
from datetime import datetime
from fastmcp import FastMCP

mcp = FastMCP("NODA PDF Server")

@mcp.tool()
async def generate_report(building_name: str, content: str, report_type: str = "performance") -> str:
    """Generate a report for a building."""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{building_name}_{report_type}_report_{timestamp}.txt"
        filepath = f"/app/reports/{filename}"
        
        os.makedirs("/app/reports", exist_ok=True)
        
        with open(filepath, 'w') as f:
            f.write(f"NODA {report_type.title()} Report\n")
            f.write(f"Building: {building_name}\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(content)
        
        return f"Report generated: {filename}"
        
    except Exception as e:
        return f"Error generating report: {str(e)}"

if __name__ == "__main__":
    mcp.run()