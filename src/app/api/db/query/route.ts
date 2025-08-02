import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/app/lib/database";
import { ChatOpenAI } from "@langchain/openai";
import { generateSchemaContext } from "@/app/utils/schemaContext";

export async function POST(request: NextRequest) {
  try {
    // Check if database is connected
    if (!DatabaseManager.isConnected()) {
      return NextResponse.json(
        {
          error: "No active database connection",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      query,
      selectedTables,
      schema,
      readOnly = true,
      maxRows = 1000,
    } = body;

    // Validate required fields
    if (!query || !selectedTables || !schema) {
      return NextResponse.json(
        {
          error: "Missing required fields: query, selectedTables, schema",
        },
        { status: 400 }
      );
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
        },
        { status: 500 }
      );
    }

    // Generate schema context for the selected tables
    const schemaContext = generateSchemaContext(schema, selectedTables);

    // Create LLM instance
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.1, // Low temperature for more consistent SQL generation
      maxTokens: 2000,
    });

    // Create the prompt for SQL generation
    const prompt = createSQLGenerationPrompt(
      query,
      schemaContext,
      readOnly,
      maxRows
    );

    // Generate SQL query
    const response = await llm.invoke(prompt);
    const generatedSQL = response.content as string;

    // Extract SQL from the response (remove markdown formatting if present)
    const sqlQuery = extractSQLFromResponse(generatedSQL);

    // Validate and sanitize the SQL query
    const validationResult = validateSQLQuery(sqlQuery, readOnly);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: "Generated SQL query is invalid or unsafe",
          details: validationResult.error,
          generatedSQL: sqlQuery, // Include for debugging
        },
        { status: 400 }
      );
    }

    // Execute the query if not in read-only mode
    let queryResults = null;
    let executionTime = null;

    if (!readOnly) {
      const startTime = Date.now();
      const connection = DatabaseManager.getConnection();
      if (!connection) {
        return NextResponse.json(
          {
            error: "Database connection not available",
          },
          { status: 500 }
        );
      }

      try {
        const [results] = await connection.execute(sqlQuery);
        executionTime = Date.now() - startTime;
        queryResults = results;
      } catch (executionError) {
        return NextResponse.json(
          {
            error: "Query execution failed",
            details:
              executionError instanceof Error
                ? executionError.message
                : "Unknown error",
            generatedSQL: sqlQuery,
          },
          { status: 500 }
        );
      }
    }

    // Generate explanation for the SQL query
    const explanationPrompt = createExplanationPrompt(
      query,
      sqlQuery,
      schemaContext
    );
    const explanationResponse = await llm.invoke(explanationPrompt);
    const explanation = explanationResponse.content as string;

    return NextResponse.json({
      success: true,
      query: query,
      sql: sqlQuery,
      explanation: explanation,
      results: queryResults,
      executionTime: executionTime,
      readOnly: readOnly,
      selectedTables: selectedTables,
    });
  } catch (error) {
    console.error("Query generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate SQL query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function createSQLGenerationPrompt(
  naturalLanguageQuery: string,
  schemaContext: string,
  readOnly: boolean,
  maxRows: number
): string {
  const readOnlyClause = readOnly
    ? "IMPORTANT: Only generate SELECT queries. Do not generate INSERT, UPDATE, DELETE, DROP, or any other modifying queries."
    : "";

  return `You are a SQL expert. Convert the following natural language query to SQL using the provided database schema.

${readOnlyClause}

Database Schema:
${schemaContext}

Natural Language Query: "${naturalLanguageQuery}"

Requirements:
1. Generate only valid MySQL SQL syntax
2. Use proper table and column names from the schema
3. Include appropriate JOINs when querying multiple tables
4. Limit results to ${maxRows} rows maximum
5. Use clear, readable SQL formatting
6. Add comments to explain complex parts of the query

Generate the SQL query:`;
}

function createExplanationPrompt(
  naturalLanguageQuery: string,
  sqlQuery: string,
  schemaContext: string
): string {
  return `Explain the following SQL query in simple terms.

Natural Language Query: "${naturalLanguageQuery}"

Generated SQL:
${sqlQuery}

Database Schema Context:
${schemaContext}

Please provide a clear explanation of:
1. What the query does
2. Which tables and columns are involved
3. Any joins or relationships used
4. The expected results

Explanation:`;
}

function extractSQLFromResponse(response: string): string {
  // Remove markdown code blocks if present
  let sql = response.replace(/```sql\s*/g, "").replace(/```\s*$/g, "");

  // Remove any leading/trailing whitespace
  sql = sql.trim();

  // If the response contains multiple lines, take the first complete SQL statement
  const lines = sql.split("\n");
  const sqlLines = lines.filter(
    (line) =>
      line.trim() &&
      !line.trim().startsWith("--") &&
      !line.trim().startsWith("#") &&
      !line.trim().startsWith("/*")
  );

  return sqlLines.join("\n");
}

function validateSQLQuery(
  sql: string,
  readOnly: boolean
): { isValid: boolean; error?: string } {
  // Basic SQL injection prevention
  const dangerousKeywords = [
    "DROP",
    "DELETE",
    "INSERT",
    "UPDATE",
    "CREATE",
    "ALTER",
    "TRUNCATE",
    "EXEC",
    "EXECUTE",
    "UNION",
    "SCRIPT",
    "JAVASCRIPT",
  ];

  const upperSQL = sql.toUpperCase();

  // Check for dangerous keywords
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      if (
        readOnly &&
        ["DROP", "DELETE", "INSERT", "UPDATE", "TRUNCATE", "ALTER"].includes(
          keyword
        )
      ) {
        return {
          isValid: false,
          error: `Query contains forbidden keyword: ${keyword}. Read-only mode is enabled.`,
        };
      }
    }
  }

  // Check for basic SQL structure
  if (!upperSQL.includes("SELECT")) {
    return { isValid: false, error: "Query must start with SELECT" };
  }

  // Check for potential injection patterns
  if (upperSQL.includes(";") && upperSQL.split(";").length > 2) {
    return { isValid: false, error: "Multiple SQL statements not allowed" };
  }

  return { isValid: true };
}
