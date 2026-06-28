import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

interface McpSessionState {
  authenticated: boolean;
  accountId?: string;
  username?: string;
  customData?: any;
}

export class McpManager {
  private server: McpServer;
  private activeSessions = new Map<string, { transport: WebStandardStreamableHTTPServerTransport; state: McpSessionState }>();

  constructor(name: string, version: string) {
    this.server = new McpServer({ name, version });
  }

  /**
   * Registers a custom game tool that AI agents can invoke.
   */
  public registerTool(
    name: string,
    description: string,
    schema: Record<string, z.ZodType<any>>,
    handler: (args: any, extra: { sessionId: string; sessionState: McpSessionState }) => Promise<any> | any
  ) {
    this.server.tool(name, description, schema, async (args: any, extra: any) => {
      const sessionId = extra.sessionId || "";
      const session = this.activeSessions.get(sessionId);
      const state = session ? session.state : { authenticated: false };

      try {
        const result = await handler(args, { sessionId, sessionState: state });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
      }
    });
  }

  /**
   * Handles incoming SSE requests from the web server.
   */
  public async handleSseRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Establish a unique session ID
    const newSessionId = crypto.randomUUID();

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessionclosed: async (sId) => {
        const session = this.activeSessions.get(sId);
        if (session) {
          try {
            await session.transport.close();
          } catch (e) {}
          this.activeSessions.delete(sId);
        }
      }
    });

    // Connect the server to the transport session
    await this.server.connect(transport);

    // Save active session
    this.activeSessions.set(newSessionId, {
      transport,
      state: { authenticated: false }
    });

    // Delegate request handling to the transport
    return transport.handleRequest(req);
  }

  /**
   * Destroys an active MCP session cleanly.
   */
  public closeSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        session.transport.close();
      } catch (e) {}
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Expose internal MCP Server instance if direct customization is needed.
   */
  public getServer(): McpServer {
    return this.server;
  }
}
