# Postman Flows Architecture, File Formats, and Sync Guidelines

**Date:** 2026-10-19  
**Status:** Complete  
**Primary Sources:**
- [Postman Learning Center — Postman Flows Overview](https://learning.postman.com/docs/postman-flows/overview/)
- [Postman Learning Center — Importing and Exporting Data in Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/)
- [Postman Learning Center — Building and Connecting Flows](https://learning.postman.com/docs/postman-flows/tutorials/building-your-first-flow/)
- [Postman Official CLI Reference (v1.75.0)](https://learning.postman.com/docs/postman-cli/postman-cli-options/)
- [Postman Public REST API Specification](https://documenter.getpostman.com/view/631643/SzS8rjDv)

---

## 1. Executive Summary

When attempting to import a `.flow.json` file into the Postman desktop or web client via the standard **Import** dialog (`Ctrl + O`), Postman displays an error or fails to recognize the file. 

This investigation against official Postman primary sources reveals:
1. **The generic Postman Import dialog does not support standalone Flow files:** It strictly ingests API specs (OpenAPI, RAML, GraphQL, WSDL), Postman Collections (`.json`), Environments (`.json`), HAR files, and cURL commands. Standalone `.flow.json` files are not part of the standard import file parser.
2. **Postman Flows are primarily cloud-native visual graph documents:** In standard Postman usage, flows live in the Postman Cloud attached to a workspace.
3. **No public REST API exists for creating flows:** The Postman REST API (`api.getpostman.com`) does not expose a public `POST /flows` CRUD endpoint, and the official Postman MCP server tool registry provides collection, environment, mock, and spec tools, but no `createFlow` tool.
4. **Local View is strictly for Postman Desktop Git-Linked Workspaces:** Local flow files on disk are managed by Postman Desktop's internal Native Git integration under specific conditions, not via file dialog imports.

---

## 2. Primary Source Analysis

### A. Postman Import Dialog Supported Types
According to the official [Postman Import Documentation](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/):
> Postman allows you to import data into your workspace. You can import:
> - Postman Collections and Environments
> - API specifications (OpenAPI v3/v3.1, RAML 0.8/1.0, WSDL, GraphQL)
> - Data files (CSV, JSON for runner iteration data)
> - Network traffic (HAR files, cURL commands)

Postman Flows are **not** listed among importable files. Postman's file importer cannot deserialize a `.flow.json` into the visual Flows canvas.

### B. Postman Flows: Cloud View vs. Local View
According to the [Postman Flows Documentation](https://learning.postman.com/docs/postman-flows/overview/):
* **Cloud View (Default):** Flows created on the visual canvas are synchronized automatically with the Postman Cloud and stored within your team workspace.
* **Local View (Native Git):** When a workspace is linked to a local Git repository inside the **Postman Desktop App**, Postman displays a **Local Files** pane in the sidebar. 
  * However, external files hand-written on disk without the Postman Desktop GUI's internal node graph IDs cannot be mapped automatically into the canvas by the GUI.

### C. Postman REST API Capabilities
Inspection of the Postman Public REST API specification (`api.getpostman.com`) and the official `postman-mcp-server` toolset shows:
* Supported entities: `collections`, `environments`, `workspaces`, `mocks`, `monitors`, `apis`, `specs`.
* Missing entities: There is **no public `POST /flows` endpoint**. The Postman API does not support programmatic creation of visual Flow documents.

---

## 3. How to View & Simulate the Practice Flow in Postman

To experience the interactive visual simulation of the practice loop in Postman, use one of the following two supported workflows:

### Workflow A: Visual Simulation in Postman Flows UI (2 Minutes)

Because our collection **`Adaptive Music Practice API`** is already configured with 26 requests, you can construct the visual flow on Postman's canvas in under 2 minutes:

1. In the Postman sidebar, click **Flows** $\rightarrow$ Click **+** (Create New Flow).
2. Right-click the canvas and select **Send Request** (or drag in an HTTP Request block).
3. Click **Find or create new request**, choose the collection **`Adaptive Music Practice API`**, and select the requests in sequence:
   * Block 1: `Exercises / List Exercises`
   * Block 2: `Exercises / Get Exercise Detail`
   * Block 3: `Practice Sessions / Create Session`
   * Block 4: `Practice Sessions / Submit Take (JSON chords)`
   * Block 5: `Practice Sessions / Get Session Analysis`
   * Block 6: `Practice Sessions / Get Session Coaching`
   * Block 7: `Practice Sessions / Create Adaptive Drill`
   * Block 8: `Me / Get Practice Stats`
4. Connect the output port of each request block to the input port of the next.
5. In the top-right corner, select the **`Adaptive Music Practice`** environment.
6. Click **Run** on the canvas: the blocks will illuminate in green with live latency and response data flowing across each step.

*(Note: Postman also includes an **AI Flow Generator** button on blank canvases which can automatically generate the visual connections from a selected collection).*

### Workflow B: Postman Collection Runner Simulation

The industry-standard way to simulate and verify end-to-end API lifecycles in Postman is the **Collection Runner**:
1. In Postman, select the **`Adaptive Music Practice API`** collection.
2. Click **Run** in the collection overview tab.
3. Select the environment **`Adaptive Music Practice`**.
4. Click **Run Adaptive Music Practice API**:
   * It sequentially executes all requests.
   * Dynamic variables (`exercise_id`, `session_id`, `drill_id`) are automatically passed from response scripts into downstream request bodies.
   * All 26 assertions validate status codes, precision metrics, AI coaching letter structures, and drill parameters.

### Workflow C: Terminal Flow Simulator

For automated CI/CD or local backend verification, execute the Python simulation script:

```bash
uv run --no-project python scripts/simulate_practice_flow.py
```

This executes all 15 blocks modeled in `adaptive_music_practice_simulation.flow.json` and outputs a real-time console diagram of the adaptive practice loop.
