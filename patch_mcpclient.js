const fs = require('fs');

const path = 'app/api/mcp/MCPClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSetup = `              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Claude Desktop</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste the config into <code className="text-[10px] bg-muted/40 px-1 rounded">claude_desktop_config.json</code>. Restart Claude. The tools appear automatically.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Custom Agent</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use any MCP SDK (Python <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code>, JS <code className="text-[10px] bg-muted/40 px-1 rounded">@modelcontextprotocol/sdk</code>) to connect programmatically.
                  </p>
                </div>
              </div>`;

const newSetup = `              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Claude Desktop</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste the config into <code className="text-[10px] bg-muted/40 px-1 rounded">claude_desktop_config.json</code>. Restart Claude.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Cursor & Windsurf</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add the <code className="text-[10px] bg-muted/40 px-1 rounded">npx</code> command in the MCP Servers UI or <code className="text-[10px] bg-muted/40 px-1 rounded">mcp_config.json</code>.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Kilo CLI</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add to your <code className="text-[10px] bg-muted/40 px-1 rounded">kilo.json</code> under the <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code> section.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Custom Agent</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use any SDK (Python <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code>, JS <code className="text-[10px] bg-muted/40 px-1 rounded">@modelcontextprotocol/sdk</code>) to connect.
                  </p>
                </div>
              </div>`;

content = content.replace(oldSetup, newSetup);
fs.writeFileSync(path, content);
