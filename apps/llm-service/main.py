# File: apps/llm-service/main.py
# ENHANCED with Docker Logging, Clean User Responses, and CHART SUPPORT
import os
import asyncio
import json
import re
import logging
from typing import List, Dict, Any, Optional, Union
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from llama_index.core import Settings
from llama_index.llms.google_genai import GoogleGenAI
from dotenv import load_dotenv

load_dotenv()

# Configure structured logging for Docker
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Create specialized loggers
logger = logging.getLogger("noda.llm.service")
tool_logger = logging.getLogger("noda.tools")
query_logger = logging.getLogger("noda.queries")
performance_logger = logging.getLogger("noda.performance")

# Initialize LLM
Settings.llm = GoogleGenAI(
    model_name="models/gemini-1.5-flash", 
    api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.1
)

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime

class DebugChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime
    tools_used: List[Dict[str, Any]]
    reasoning: Optional[str] = None
    performance_metrics: Dict[str, Any]

class ToolCall(BaseModel):
    server: str
    tool: str
    args: Dict[str, Any]
    reasoning: str

class IntelligentMCPHost:
    """Intelligent MCP Host with comprehensive Docker logging and CHART SUPPORT"""
    
    def __init__(self):
        self.mcp_servers = {
            "rag_server": "/app/mcp_servers/rag_server.py",
            "db_server": "/app/mcp_servers/db_server.py", 
            "pdf_server": "/app/mcp_servers/pdf_server.py",
            "forecast_server": "/app/mcp_servers/forecast_server.py"  # NEW
        }
        
        # Tool definitions
        self.tool_catalog = {
            "rag_server": {
                "query_documents": {
                    "description": "Search NODA knowledge base for building information, energy systems, performance data, and technical documentation",
                    "best_for": ["building questions", "energy systems", "performance analysis", "technical documentation", "general NODA knowledge"],
                    "params": ["query"],
                    "returns": "contextual information with building and system details"
                },
                "get_building_list": {
                    "description": "Get list of all available buildings with metadata",
                    "best_for": ["building discovery", "system overview", "available buildings"],
                    "params": [],
                    "returns": "list of buildings with assets and data availability"
                },
                "query_building_specific": {
                    "description": "Get detailed information about a specific building",
                    "best_for": ["specific building analysis", "building performance", "building-focused queries"],
                    "params": ["building_name", "query"],
                    "returns": "building-specific insights and recommendations"
                }
            },
            "db_server": {
                "query_database": {
                    "description": "Execute SQL queries for specific data analysis and statistics",
                    "best_for": ["raw data queries", "statistics", "counts", "specific database operations", "data exploration"],
                    "params": ["sql_query"],
                    "returns": "formatted query results"
                },
                "get_building_statistics": {
                    "description": "Get statistical overview of buildings and data coverage",
                    "best_for": ["system statistics", "data overview", "building metrics"],
                    "params": [],
                    "returns": "comprehensive building statistics"
                }
            },
            "pdf_server": {
                "generate_report": {
                    "description": "Generate PDF reports for buildings with data and analysis",
                    "best_for": ["report generation", "documentation", "formal reports"],
                    "params": ["building_name", "content", "report_type"],
                    "returns": "generated report filename"
                }
            },
            "forecast_server": {  # NEW
                "get_forecast": {
                    "description": "Get energy consumption forecast predictions for a building using AI forecasting model",
                    "best_for": ["predictions", "forecasting", "future trends", "what will happen", "predict", "forecast", "projection"],
                    "params": ["building_id", "access_token"],
                    "returns": "chart data with forecast values in Chart.js format"
                }
            }
        }
        
        logger.info("🧠 Intelligent MCP Host initialized with comprehensive logging and CHART SUPPORT")
    
    async def analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """Analyze user query with detailed logging"""
        start_time = datetime.now()
        query_logger.info(f"📝 Analyzing query intent: '{query[:100]}{'...' if len(query) > 100 else ''}'")
        
        analysis_prompt = f"""Analyze this user query to understand their intent and extract key information:

QUERY: "{query}"

Analyze for:
1. Primary intent (what does the user want to accomplish?)
2. Building names mentioned (extract specific building names)
3. Data types needed (performance, energy, statistics, forecast, etc.)
4. Time context (specific periods, recent data, future predictions, etc.)
5. Output format requested (report, summary, raw data, chart, visualization, etc.)
6. Complexity level (simple lookup, analysis, multi-step workflow)
7. Does this require forecasting/predictions?

Return a JSON object with:
{{
    "intent": "primary_intent_category",
    "complexity": "simple|moderate|complex",
    "buildings_mentioned": ["building1", "building2"],
    "data_types": ["performance", "energy", "statistics", "forecast"],
    "time_context": "time_period_or_null",
    "output_format": "summary|report|raw_data|analysis|chart|visualization",
    "keywords": ["key", "terms", "from", "query"],
    "requires_multi_tools": true/false,
    "needs_forecast": true/false,
    "needs_visualization": true/false
}}"""

        try:
            response = await Settings.llm.acomplete(analysis_prompt)
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            
            if json_match:
                analysis = json.loads(json_match.group())
                processing_time = (datetime.now() - start_time).total_seconds()
                
                query_logger.info(f"✅ Intent analysis completed in {processing_time:.2f}s")
                query_logger.info(f"🎯 Intent: {analysis.get('intent', 'unknown')}, Complexity: {analysis.get('complexity', 'unknown')}")
                query_logger.info(f"🏢 Buildings: {analysis.get('buildings_mentioned', [])}")
                
                if analysis.get('needs_forecast'):
                    query_logger.info("📊 FORECAST DETECTED - Will call forecast_server")
                
                performance_logger.info(f"INTENT_ANALYSIS | query_length={len(query)} | processing_time={processing_time:.3f} | complexity={analysis.get('complexity')}")
                
                return analysis
            else:
                query_logger.warning("⚠️ Failed to parse JSON from intent analysis, using fallback")
                fallback = {
                    "intent": "general_query",
                    "complexity": "simple",
                    "buildings_mentioned": [],
                    "data_types": ["general"],
                    "time_context": None,
                    "output_format": "summary",
                    "keywords": query.lower().split(),
                    "requires_multi_tools": False,
                    "needs_forecast": False,
                    "needs_visualization": False
                }
                return fallback
                
        except Exception as e:
            query_logger.error(f"❌ Intent analysis error: {str(e)}")
            return {
                "intent": "general_query",
                "complexity": "simple", 
                "buildings_mentioned": [],
                "data_types": ["general"],
                "time_context": None,
                "output_format": "summary",
                "keywords": query.lower().split(),
                "requires_multi_tools": False,
                "needs_forecast": False,
                "needs_visualization": False
            }
    
    async def plan_tool_usage(self, query: str, intent_analysis: Dict[str, Any]) -> List[ToolCall]:
        """Plan tool usage with comprehensive logging"""
        start_time = datetime.now()
        tool_logger.info(f"🛠️ Planning tool usage for {intent_analysis.get('complexity', 'unknown')} complexity query")
        
        planning_prompt = f"""Based on the query analysis, plan which tools to use to best answer the user's question.

QUERY: "{query}"
INTENT ANALYSIS: {json.dumps(intent_analysis, indent=2)}

AVAILABLE TOOLS:
{json.dumps(self.tool_catalog, indent=2)}

Plan a sequence of tool calls to answer this query effectively. Consider:
1. What information is needed first?
2. Should we get general context before specific details?
3. Do we need building-specific data?
4. Should we generate reports or summaries?
5. Does this need forecasting/predictions? (Use forecast_server)
6. Does this need data visualization? (forecasts should return chart data)

Return a JSON array of tool calls:
[
    {{
        "server": "server_name",
        "tool": "tool_name", 
        "args": {{"param": "value"}},
        "reasoning": "why this tool is needed"
    }}
]

Optimize for efficiency - don't call unnecessary tools, but ensure comprehensive answers."""

        try:
            response = await Settings.llm.acomplete(planning_prompt)
            json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
            
            if json_match:
                tool_calls_data = json.loads(json_match.group())
                planned_tools = [ToolCall(**call) for call in tool_calls_data]
                
                processing_time = (datetime.now() - start_time).total_seconds()
                tool_logger.info(f"✅ Tool planning completed in {processing_time:.2f}s")
                tool_logger.info(f"📋 Planned {len(planned_tools)} tools: {[f'{t.server}.{t.tool}' for t in planned_tools]}")
                
                for i, tool in enumerate(planned_tools, 1):
                    tool_logger.info(f"   {i}. {tool.server}.{tool.tool}({list(tool.args.keys())}) - {tool.reasoning[:50]}...")
                
                performance_logger.info(f"TOOL_PLANNING | planning_time={processing_time:.3f} | tools_planned={len(planned_tools)}")
                
                return planned_tools
            else:
                tool_logger.warning("⚠️ Failed to parse tool planning JSON, using fallback")
                return await self._fallback_tool_selection(query, intent_analysis)
                
        except Exception as e:
            tool_logger.error(f"❌ Tool planning error: {str(e)}")
            return await self._fallback_tool_selection(query, intent_analysis)
    
    async def _fallback_tool_selection(self, query: str, intent_analysis: Dict[str, Any]) -> List[ToolCall]:
        """Fallback tool selection with logging"""
        tool_logger.info("🔄 Using fallback tool selection logic")
        tools = []
        
        # Check for forecast keywords
        forecast_keywords = ["forecast", "predict", "prediction", "future", "will be", "projection", "trend"]
        if any(keyword in query.lower() for keyword in forecast_keywords):
            building = intent_analysis.get("buildings_mentioned", ["default"])[0] if intent_analysis.get("buildings_mentioned") else "default"
            tools.append(ToolCall(
                server="forecast_server",
                tool="get_forecast",
                args={"building_id": building, "access_token": "default_token"},
                reasoning="Query contains forecast/prediction keywords"
            ))
            tool_logger.info(f"🔮 Selected forecast tool for building: {building}")
            return tools
        
        if intent_analysis.get("buildings_mentioned"):
            building_name = intent_analysis["buildings_mentioned"][0]
            tools.append(ToolCall(
                server="rag_server",
                tool="query_building_specific",
                args={"building_name": building_name, "query": query},
                reasoning=f"Query mentions specific building: {building_name}"
            ))
            tool_logger.info(f"🏢 Selected building-specific query for {building_name}")
        
        elif any(word in query.lower() for word in ["sql", "database", "count", "statistics", "buildings available"]):
            tools.append(ToolCall(
                server="rag_server",
                tool="get_building_list",
                args={},
                reasoning="Query appears to need building list or statistics"
            ))
            tool_logger.info("📊 Selected building list tool for statistics query")
        
        elif any(word in query.lower() for word in ["report", "generate", "pdf", "document"]):
            tools.append(ToolCall(
                server="pdf_server", 
                tool="generate_report",
                args={"building_name": "General", "content": query, "report_type": "analysis"},
                reasoning="Query requests report generation"
            ))
            tool_logger.info("📄 Selected report generation tool")
        
        else:
            tools.append(ToolCall(
                server="rag_server",
                tool="query_documents", 
                args={"query": query},
                reasoning="General query - using knowledge base search"
            ))
            tool_logger.info("🔍 Selected general RAG search")
        
        return tools
    
    async def execute_tool_call(self, tool_call: ToolCall) -> Dict[str, Any]:
        """Execute tool call with detailed logging"""
        start_time = datetime.now()
        tool_logger.info(f"⚡ Executing {tool_call.server}.{tool_call.tool} with args: {list(tool_call.args.keys())}")
        
        try:
            if tool_call.server == "rag_server":
                result = await self._call_rag_tool(tool_call.tool, tool_call.args)
            elif tool_call.server == "db_server":
                result = await self._call_db_tool(tool_call.tool, tool_call.args)
            elif tool_call.server == "pdf_server":
                result = await self._call_pdf_tool(tool_call.tool, tool_call.args)
            elif tool_call.server == "forecast_server":  # NEW
                result = await self._call_forecast_tool(tool_call.tool, tool_call.args)
            else:
                result = f"Unknown server: {tool_call.server}"
                tool_logger.error(f"❌ Unknown server: {tool_call.server}")
            
            execution_time = (datetime.now() - start_time).total_seconds()
            result_length = len(str(result))
            
            tool_logger.info(f"✅ {tool_call.server}.{tool_call.tool} completed in {execution_time:.2f}s, returned {result_length} chars")
            performance_logger.info(f"TOOL_EXECUTION | server={tool_call.server} | tool={tool_call.tool} | execution_time={execution_time:.3f} | result_length={result_length}")
            
            return {
                "tool_call": tool_call.dict(),
                "result": result,
                "success": True,
                "execution_time": execution_time
            }
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            tool_logger.error(f"❌ {tool_call.server}.{tool_call.tool} failed in {execution_time:.2f}s: {str(e)}")
            performance_logger.error(f"TOOL_ERROR | server={tool_call.server} | tool={tool_call.tool} | error={str(e)}")
            
            return {
                "tool_call": tool_call.dict(),
                "result": f"Error: {str(e)}",
                "success": False,
                "execution_time": execution_time
            }
    
    async def _call_rag_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Call RAG tools with logging"""
        import sys
        sys.path.append('/app/mcp_servers')
        
        try:
            if tool_name == "query_documents":
                from rag_server import query_documents_impl
                tool_logger.info(f"🔍 RAG search for: '{args['query'][:50]}...'")
                result = await query_documents_impl(args["query"])
                tool_logger.info(f"✅ RAG search returned {len(result)} characters")
                return result
            
            elif tool_name == "get_building_list":
                tool_logger.info("📋 Fetching building list from database")
                import asyncpg
                async with asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"), min_size=1, max_size=2) as pool:
                    async with pool.acquire() as conn:
                        sql_query = """
                            SELECT DISTINCT building_name, building_uuid,
                                   COUNT(*) as chunk_count,
                                   MIN(time_period) as earliest_data,
                                   MAX(time_period) as latest_data
                            FROM document_chunks
                            WHERE building_name IS NOT NULL OR building_uuid IS NOT NULL
                            GROUP BY building_name, building_uuid
                            ORDER BY chunk_count DESC
                            LIMIT 20;
                        """
                        records = await conn.fetch(sql_query)
                        
                        if not records:
                            tool_logger.warning("⚠️ No buildings found in database")
                            return "No buildings found in the system."
                        
                        tool_logger.info(f"✅ Found {len(records)} buildings in database")
                        
                        building_list = []
                        for record in records:
                            name = record['building_name'] or f"Building-{record['building_uuid'][:8]}"
                            building_list.append(
                                f"• {name} ({record['chunk_count']} data points, "
                                f"data from {record['earliest_data']} to {record['latest_data']})"
                            )
                        
                        return "Available buildings in NODA system:\n" + "\n".join(building_list)
            
            elif tool_name == "query_building_specific":
                from rag_server import query_documents_impl
                building_name = args['building_name']
                original_query = args['query']
                tool_logger.info(f"🏢 Building-specific query for {building_name}")
                enhanced_query = f"Building: {building_name} - {original_query}. Focus on this specific building's data and performance."
                return await query_documents_impl(enhanced_query)
            
            else:
                tool_logger.error(f"❌ Unknown RAG tool: {tool_name}")
                return f"RAG tool {tool_name} not implemented"
                
        except ImportError as e:
            tool_logger.error(f"❌ Import error in RAG tool: {str(e)}")
            return f"Import error in RAG tool: {str(e)}. Ensure rag_server.py has query_documents_impl function."
        except Exception as e:
            tool_logger.error(f"❌ Error in RAG tool {tool_name}: {str(e)}")
            return f"Error in RAG tool {tool_name}: {str(e)}"
    
    async def _call_db_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Call database tools with logging"""
        try:
            import asyncpg
            
            if tool_name == "query_database":
                sql_query = args.get("sql_query", "")
                tool_logger.info(f"📊 Executing SQL: {sql_query[:100]}...")
                
                if not sql_query.strip().upper().startswith('SELECT'):
                    tool_logger.warning("⚠️ Non-SELECT query rejected for security")
                    return "Error: Only SELECT queries allowed for security."
                
                async with asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"), min_size=1, max_size=2) as pool:
                    async with pool.acquire() as conn:
                        result = await conn.fetch(sql_query)
                        
                        if not result:
                            tool_logger.info("📊 SQL query returned no results")
                            return "No data found."
                        
                        tool_logger.info(f"✅ SQL query returned {len(result)} rows")
                        
                        if len(result) == 1 and len(result[0]) == 1:
                            return f"Result: {list(result[0].values())[0]}"
                        
                        headers = list(result[0].keys())
                        table_lines = [" | ".join(headers), "-" * 50]
                        
                        for row in result[:10]:
                            row_values = [str(val) if val is not None else 'NULL' for val in row.values()]
                            table_lines.append(" | ".join(row_values))
                        
                        return "\n".join(table_lines)
            
            elif tool_name == "get_building_statistics":
                tool_logger.info("📊 Generating building statistics")
                async with asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"), min_size=1, max_size=2) as pool:
                    async with pool.acquire() as conn:
                        stats_query = """
                            SELECT 
                                COUNT(DISTINCT building_uuid) as total_buildings,
                                COUNT(DISTINCT building_name) as named_buildings,
                                COUNT(*) as total_chunks,
                                COUNT(DISTINCT asset_type) as asset_types,
                                MIN(time_period) as earliest_data,
                                MAX(time_period) as latest_data
                            FROM document_chunks;
                        """
                        stats = await conn.fetchrow(stats_query)
                        
                        tool_logger.info(f"✅ Statistics: {stats['total_buildings']} buildings, {stats['total_chunks']} chunks")
                        
                        return f"""NODA System Statistics:
- Total Buildings: {stats['total_buildings']}
- Named Buildings: {stats['named_buildings']}
- Data Chunks: {stats['total_chunks']}
- Asset Types: {stats['asset_types']}
- Data Range: {stats['earliest_data']} to {stats['latest_data']}"""
            
            else:
                tool_logger.error(f"❌ Unknown database tool: {tool_name}")
                return f"Database tool {tool_name} not implemented"
                
        except Exception as e:
            tool_logger.error(f"❌ Database error in {tool_name}: {str(e)}")
            return f"Database error in {tool_name}: {str(e)}"
    
    async def _call_pdf_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Call PDF tools with logging"""
        if tool_name == "generate_report":
            try:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                building_name = args.get('building_name', 'general')
                report_type = args.get('report_type', 'analysis')
                content = args.get('content', 'Generated report content')
                
                tool_logger.info(f"📄 Generating {report_type} report for {building_name}")
                
                os.makedirs('/app/reports', exist_ok=True)
                
                filename = f"{building_name}_{report_type}_{timestamp}.txt"
                filepath = f"/app/reports/{filename}"
                
                with open(filepath, 'w') as f:
                    f.write(f"NODA {report_type.title()} Report\n")
                    f.write(f"Building: {building_name}\n")
                    f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                    f.write(content)
                
                tool_logger.info(f"✅ Report saved as {filename}")
                return f"Report generated successfully: {filename}"
                
            except Exception as e:
                tool_logger.error(f"❌ Report generation error: {str(e)}")
                return f"Error generating report: {str(e)}"
        else:
            tool_logger.error(f"❌ Unknown PDF tool: {tool_name}")
            return f"PDF tool {tool_name} not implemented"
    
    async def _call_forecast_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Call forecast tools with logging - NEW"""
        if tool_name == "get_forecast":
            try:
                import httpx
                
                building_id = args.get('building_id', 'default')
                access_token = args.get('access_token', 'default_token')
                
                tool_logger.info(f"📊 Requesting forecast for building: {building_id}")
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        os.getenv("FORECAST_API_URL", "http://209.38.219.156:5000/forecast/"),
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
                        tool_logger.error(f"❌ Forecast API error: {response.status_code}")
                        return f"Error: Forecast API returned status {response.status_code}"
                    
                    data = response.json()
                    forecast_values = data.get("forecast", [])
                    
                    if not forecast_values:
                        tool_logger.warning("⚠️ No forecast data returned")
                        return "No forecast data available"
                    
                    tool_logger.info(f"✅ Received {len(forecast_values)} forecast data points")
                    
                    # Format as JSON string that can be parsed later
                    result = {
                        "success": True,
                        "forecast_values": forecast_values,
                        "num_days": len(forecast_values),
                        "avg_consumption": sum(forecast_values) / len(forecast_values),
                        "peak_day": forecast_values.index(max(forecast_values)) + 1,
                        "peak_value": max(forecast_values)
                    }
                    
                    return json.dumps(result)
                    
            except Exception as e:
                tool_logger.error(f"❌ Forecast error: {str(e)}")
                return f"Error getting forecast: {str(e)}"
        else:
            tool_logger.error(f"❌ Unknown forecast tool: {tool_name}")
            return f"Forecast tool {tool_name} not implemented"
    
    async def synthesize_response(self, query: str, tool_results: List[Dict[str, Any]], intent_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize clean, user-friendly response with logging - NOW WITH CHARTS"""
        start_time = datetime.now()
        logger.info(f"🎯 Synthesizing response from {len(tool_results)} tool results")
        
        # Check if any tool returned forecast data
        forecast_data = None
        for result in tool_results:
            if result.get('success') and result['tool_call']['server'] == 'forecast_server':
                try:
                    parsed_result = json.loads(result['result'])
                    if parsed_result.get('success'):
                        forecast_values = parsed_result['forecast_values']
                        
                        # Generate labels
                        labels = [f"Day {i+1}" for i in range(len(forecast_values))]
                        
                        # Create Chart.js format
                        forecast_data = {
                            "action": "chart",
                            "type": "line",
                            "data": {
                                "labels": labels,
                                "datasets": [{
                                    "label": "Energy Forecast (kWh)",
                                    "data": forecast_values,
                                    "borderColor": "rgb(255, 99, 132)",
                                    "backgroundColor": "rgba(255, 99, 132, 0.1)",
                                    "borderWidth": 2,
                                    "fill": True,
                                    "tension": 0.4,
                                    "pointRadius": 3,
                                    "pointHoverRadius": 5
                                }]
                            },
                            "title": "Energy Consumption Forecast"
                        }
                        logger.info(f"📊 Forecast chart data prepared with {len(forecast_values)} points")
                except Exception as e:
                    logger.error(f"❌ Error parsing forecast data: {str(e)}")
        
        # Filter successful results and log failures separately
        successful_results = []
        failed_results = []
        
        for result in tool_results:
            if result.get('success', True):
                successful_results.append(result)
            else:
                failed_results.append(result)
                logger.warning(f"⚠️ Tool failure: {result['tool_call']['server']}.{result['tool_call']['tool']} - {result['result']}")
        
        if failed_results:
            tool_logger.warning(f"⚠️ {len(failed_results)} tools failed, proceeding with {len(successful_results)} successful results")
        
        synthesis_prompt = f"""You are NODA CoPilot. Provide a confident, expert response based on available information.

USER QUERY: "{query}"
INTENT: {intent_analysis.get('intent', 'general')}

AVAILABLE INFORMATION:
{json.dumps([r['result'] for r in successful_results], indent=2)}

RESPONSE REQUIREMENTS:
1. Speak as an expert energy systems analyst with confidence
2. Use available data to provide specific insights
3. Reference building names, metrics, and quantified impacts
4. Apply domain knowledge to make informed estimates when data is limited
5. Provide prioritized, actionable recommendations
6. If forecast data is available, explain the predictions clearly with key insights (average, peak, trends)

ABSOLUTE PROHIBITIONS - NEVER WRITE:
- "additional analysis would benefit from"
- "to refine this analysis"
- "I don't have enough data"
- "would require more information"
- "Unfortunately, I don't currently have access"
- ANY mention of tool failures, database errors, or missing technical data

INSTEAD - ALWAYS END WITH:
**Immediate Priority Actions:**
1. [Specific action with timeline]
2. [Monitoring to implement]
3. [Building/asset to investigate]

When data is limited, apply typical industry patterns and domain expertise rather than asking for more data.
Speak confidently as the expert you are."""

        try:
            response = await Settings.llm.acomplete(synthesis_prompt)
            processing_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"✅ Response synthesis completed in {processing_time:.2f}s")
            logger.info(f"📝 Generated {len(response.text)} character response")
            
            performance_logger.info(f"RESPONSE_SYNTHESIS | synthesis_time={processing_time:.3f} | response_length={len(response.text)} | successful_tools={len(successful_results)} | failed_tools={len(failed_results)}")
            
            # Build response with optional chart data
            result = {"text": response.text}
            
            if forecast_data:
                result["ui_actions"] = [forecast_data]
                logger.info("📊 Response includes forecast chart visualization")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Response synthesis error: {str(e)}")
            # Fallback to simple concatenation
            results_text = "\n\n".join([
                f"Analysis: {r['result']}" 
                for r in successful_results if r.get('success', True)
            ])
            return {"text": f"Based on the available information:\n\n{results_text}"}
    
    async def process_intelligent_query(self, query: str) -> Dict[str, Any]:
        """Main intelligent query processing pipeline with comprehensive logging"""
        start_time = datetime.now()
        request_id = f"req_{int(start_time.timestamp())}"
        
        logger.info(f"🚀 Starting intelligent query processing [{request_id}]: '{query[:100]}{'...' if len(query) > 100 else ''}'")
        
        try:
            # Step 1: Analyze query intent
            intent_analysis = await self.analyze_query_intent(query)
            
            # Step 2: Plan tool usage
            planned_tools = await self.plan_tool_usage(query, intent_analysis)
            
            # Step 3: Execute tools in sequence
            tool_results = []
            for i, tool_call in enumerate(planned_tools, 1):
                logger.info(f"🔧 Executing tool {i}/{len(planned_tools)}: {tool_call.server}.{tool_call.tool}")
                result = await self.execute_tool_call(tool_call)
                tool_results.append(result)
                await asyncio.sleep(0.1)
            
            # Step 4: Synthesize comprehensive response
            synthesis_result = await self.synthesize_response(query, tool_results, intent_analysis)
            
            total_time = (datetime.now() - start_time).total_seconds()
            successful_tools = len([r for r in tool_results if r.get('success', True)])
            
            logger.info(f"✅ Query processing completed [{request_id}] in {total_time:.2f}s")
            performance_logger.info(f"QUERY_COMPLETE | request_id={request_id} | total_time={total_time:.3f} | tools_executed={len(tool_results)} | successful_tools={successful_tools} | query_length={len(query)} | response_length={len(synthesis_result.get('text', ''))}")
            
            return {
                "response": synthesis_result.get("text", ""),
                "ui_actions": synthesis_result.get("ui_actions", []),  # NEW
                "intent_analysis": intent_analysis,
                "tools_used": [r["tool_call"] for r in tool_results],
                "tool_results": tool_results,
                "reasoning": f"Analyzed as {intent_analysis.get('complexity', 'simple')} {intent_analysis.get('intent', 'query')} requiring {len(planned_tools)} tools",
                "performance_metrics": {
                    "total_time": total_time,
                    "tools_executed": len(tool_results),
                    "successful_tools": successful_tools,
                    "request_id": request_id
                }
            }
            
        except Exception as e:
            total_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"❌ Query processing failed [{request_id}] in {total_time:.2f}s: {str(e)}")
            performance_logger.error(f"QUERY_ERROR | request_id={request_id} | total_time={total_time:.3f} | error={str(e)}")
            
            return {
                "response": "I apologize, but I encountered an issue processing your request. Please try rephrasing your question or contact support if the issue persists.",
                "ui_actions": [],
                "intent_analysis": {"intent": "error", "complexity": "failed"},
                "tools_used": [],
                "tool_results": [],
                "reasoning": f"Processing failed: {str(e)}",
                "performance_metrics": {
                    "total_time": total_time,
                    "tools_executed": 0,
                    "successful_tools": 0,
                    "request_id": request_id
                }
            }

# Initialize intelligent MCP host
mcp_host = IntelligentMCPHost()

# FastAPI app
app = FastAPI(title="Intelligent NODA LLM Service with Enhanced Logging and Charts", version="4.0.0")

@app.on_event("startup")
async def startup_event():
    """Startup event with logging"""
    logger.info("🧠 Intelligent NODA LLM Service starting up...")
    
    for server_name, server_path in mcp_host.mcp_servers.items():
        if os.path.exists(server_path):
            logger.info(f"✅ Found MCP server: {server_name}")
        else:
            logger.error(f"❌ Missing MCP server: {server_name} at {server_path}")
    
    logger.info("🚀 NODA LLM Service startup complete - ready to serve intelligent queries with chart support")

@app.get("/health")
async def health_check():
    """Health check"""
    logger.info("💓 Health check requested")
    return {
        "status": "healthy",
        "service": "intelligent-noda-llm-mcp-host",
        "version": "4.0.0",
        "available_servers": list(mcp_host.mcp_servers.keys()),
        "available_tools": sum(len(tools) for tools in mcp_host.tool_catalog.values()),
        "capabilities": ["intelligent_tool_selection", "multi_tool_workflows", "intent_analysis", "response_synthesis", "comprehensive_logging", "chart_generation"],
        "mcp_architecture": "intelligent_planning_and_execution_with_charts"
    }

@app.get("/tools")
async def list_tools():
    """List available tools with descriptions"""
    logger.info("🛠️ Tools catalog requested")
    return {
        "tool_catalog": mcp_host.tool_catalog,
        "capabilities": {
            "intent_analysis": "Understands query intent and extracts key information",
            "tool_planning": "Plans optimal sequence of tool calls",
            "multi_tool_workflows": "Executes complex workflows using multiple tools",
            "response_synthesis": "Synthesizes comprehensive responses from multiple tool results",
            "comprehensive_logging": "Detailed logging to Docker for monitoring and debugging",
            "chart_generation": "Generates Chart.js visualizations for forecast data"
        }
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Clean user-facing chat endpoint with chart support"""
    
    try:
        # Process query through intelligent pipeline
        result = await mcp_host.process_intelligent_query(request.message)
        
        if request.stream:
            return StreamingResponse(
                stream_response(result["response"]),
                media_type="text/plain"
            )
        else:
            # Return clean user-facing response WITH ui_actions
            return {
                "text": result["response"],
                "ui_actions": result.get("ui_actions", []),
                "conversation_id": request.conversation_id or f"conv_{datetime.now().isoformat()}",
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"❌ Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="I apologize, but I encountered an issue processing your request. Please try again.")

@app.post("/chat/debug")
async def debug_chat_endpoint(request: ChatRequest):
    """Debug endpoint with full tool details and performance metrics"""
    
    try:
        # Process query through intelligent pipeline
        result = await mcp_host.process_intelligent_query(request.message)
        
        return DebugChatResponse(
            response=result["response"],
            conversation_id=request.conversation_id or f"conv_{datetime.now().isoformat()}",
            timestamp=datetime.now(),
            tools_used=result["tools_used"],
            reasoning=result["reasoning"],
            performance_metrics=result["performance_metrics"]
        )
        
    except Exception as e:
        logger.error(f"❌ Debug chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug chat error: {str(e)}")

@app.post("/analyze-query")
async def analyze_query_endpoint(query: str):
    """Endpoint to analyze query intent without executing"""
    logger.info(f"🔍 Query analysis requested for: '{query[:50]}...'")
    
    intent_analysis = await mcp_host.analyze_query_intent(query)
    planned_tools = await mcp_host.plan_tool_usage(query, intent_analysis)
    
    return {
        "query": query,
        "intent_analysis": intent_analysis,
        "planned_tools": [tool.dict() for tool in planned_tools],
        "estimated_complexity": intent_analysis.get("complexity", "simple")
    }

@app.get("/logs/performance")
async def get_performance_logs():
    """Get recent performance metrics"""
    logger.info("📊 Performance logs requested")
    return {
        "message": "Performance logs are available in Docker logs",
        "docker_command": "docker logs noda_turbo_llm_service --since=1h | grep 'PERFORMANCE'",
        "log_filters": {
            "query_analysis": "grep 'INTENT_ANALYSIS'",
            "tool_planning": "grep 'TOOL_PLANNING'", 
            "tool_execution": "grep 'TOOL_EXECUTION'",
            "response_synthesis": "grep 'RESPONSE_SYNTHESIS'",
            "complete_queries": "grep 'QUERY_COMPLETE'"
        }
    }

async def stream_response(text: str):
    """Stream response word by word"""
    words = text.split()
    for word in words:
        yield f"{word} "
        await asyncio.sleep(0.03)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)