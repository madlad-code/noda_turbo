# File: apps/llm-service/mcp_servers/db_server.py

import os
import asyncpg
from fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP("NODA Database Server")

@mcp.tool()
async def query_database(sql_query: str) -> str:
    """Execute SQL queries on the NODA database."""
    if not sql_query.strip().upper().startswith('SELECT'):
        return "Error: Only SELECT queries allowed for security."
    
    try:
        async with asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"), min_size=1, max_size=2) as pool:
            async with pool.acquire() as conn:
                result = await conn.fetch(sql_query)
                
                if not result:
                    return "No data found."
                
                if len(result) == 1 and len(result[0]) == 1:
                    return f"Result: {list(result[0].values())[0]}"
                
                headers = list(result[0].keys())
                table_lines = [" | ".join(headers), "-" * 50]
                
                for row in result[:10]:
                    row_values = [str(val) if val is not None else 'NULL' for val in row.values()]
                    table_lines.append(" | ".join(row_values))
                
                return "\n".join(table_lines)
                
    except Exception as e:
        return f"Database error: {str(e)}"

if __name__ == "__main__":
    mcp.run()