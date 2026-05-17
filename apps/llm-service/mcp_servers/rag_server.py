# File: apps/llm-service/mcp_servers/rag_server.py

import os
import asyncpg
from fastmcp import FastMCP
from llama_index.core import Settings
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from dotenv import load_dotenv

load_dotenv()

# Initialize models
Settings.embed_model = GoogleGenAIEmbedding(model_name="models/text-embedding-004")
Settings.llm = GoogleGenAI(model_name="models/gemini-1.5-flash", api_key=os.getenv("GEMINI_API_KEY"))

# Create MCP server
mcp = FastMCP("NODA RAG Server")

async def query_documents_impl(query: str) -> str:
    """Query the NODA knowledge base for relevant information."""
    try:
        async with asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"), min_size=1, max_size=2) as pool:
            async with pool.acquire() as conn:
                # Get query embedding
                query_embedding = await Settings.embed_model.aget_query_embedding(query)
                
                # Enhanced retrieval with metadata
                sql_query = """
                    SELECT content, 
                           1 - (embedding <=> $1) as similarity_score,
                           building_name,
                           asset_type,
                           time_period
                    FROM document_chunks
                    WHERE 1 - (embedding <=> $1) > 0.3
                    ORDER BY embedding <=> $1
                    LIMIT 5;
                """
                records = await conn.fetch(sql_query, str(query_embedding))
                
                if not records:
                    return "No relevant information found in the NODA knowledge base."
                
                # Build context
                context_parts = []
                for i, record in enumerate(records, 1):
                    building = record.get('building_name', 'Unknown')
                    asset = record.get('asset_type', 'Unknown')
                    period = record.get('time_period', 'Unknown')
                    score = record.get('similarity_score', 0)
                    
                    context_part = f"Source {i} [Building: {building}, Asset: {asset}, Score: {score:.3f}]:\n{record['content']}"
                    context_parts.append(context_part)
                
                context_str = "\n\n---\n\n".join(context_parts)
                
                # ENHANCED PROMPT - This is the key change
                prompt = f"""You are NODA CoPilot - an expert AI analyst specializing in DISTRICT HEATING systems.

CRITICAL DISTRICT HEATING DOMAIN KNOWLEDGE:
- Heat exchanger fouling/scaling develops over 6-12 MONTHS (not days/weeks)
- Control valve failures are most common - stuck valves, slow response (degradation over weeks to months)
- Leaks cause immediate downtime - most common cause of service interruption
- Pump bearing failures are EXTREMELY RARE in district heating - do not focus on these
- Downtime is RARE - efficiency loss is the primary problem (buildings still get heat)
- Sensor drift/calibration issues develop over months

TYPICAL COSTS (District Heating Specific):
- Heat exchanger replacement: €15,000-25,000 (emergency: 2.5-3x multiplier)
- Control valve replacement: €3,000-5,000
- Leak repairs: €2,000-10,000 depending on severity
- Emergency callouts: 2.5-3x normal maintenance costs

REALISTIC TIMESCALES:
- Immediate: valve errors, leaks
- Weeks to months: valve response degradation, sensor drift
- Months to years: heat exchanger fouling, scaling buildup

ENERGY BASELINES:
- Office: 0.75-0.95 kWh/m²/day
- Residential: 1.05-1.25 kWh/m²/day
- Mixed-use: 0.85-1.10 kWh/m²/day
- Deviation >15% indicates inefficiency

AVAILABLE DATA FROM NODA KNOWLEDGE BASE:
{context_str}

USER QUERY: {query}

CRITICAL INSTRUCTIONS:
1. Use REALISTIC district heating timescales (months for fouling, NOT days)
2. Focus on VALVES and LEAKS - rarely mention pump bearings
3. Remember: systems lose EFFICIENCY, not service (downtime is rare)
4. Quantify impacts using district heating-appropriate estimates
5. Reference specific buildings and metrics from data
6. Provide actionable, district heating-appropriate recommendations

ABSOLUTE PROHIBITIONS:
- "additional analysis would benefit from"
- Recommendations about bearing monitoring or vibration analysis
- Unrealistic short timescales for fouling (days/weeks)
- Claims about frequent downtime in district heating

ALWAYS END WITH:
**Immediate Priority Actions:**
1. [Specific district heating-appropriate action]
2. [Realistic monitoring recommendation]
3. Would you like me to email you a summary of this analysis?

Speak as a district heating expert, not a generic HVAC analyst."""

                response = await Settings.llm.acomplete(prompt)
                return response.text
                
    except Exception as e:
        return f"Error accessing NODA knowledge base: {str(e)}"# MCP tool that calls the implementation


@mcp.tool()
async def query_documents(query: str) -> str:
    """Query the NODA knowledge base for relevant information."""
    return await query_documents_impl(query)

if __name__ == "__main__":
    mcp.run()