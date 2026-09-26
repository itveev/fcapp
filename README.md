# Flow Chart

A Vue 3 workflow editor for a conversation flow. The canvas shows the supplied workflow, and each accessible step can be created, edited, or deleted. Details open in a side drawer whose URL contains the node id.

The app has no backend. A small in-memory API stands in for the assessment payload. A full page reload loads the bundled seed again.

## Getting Started

- Node.js 22
- npm

```bash
npm ci
npm run dev
```

The dev server prints a local URL. Other scripts:

```bash
npm run test
npm run build
npm run preview
```

`npm run preview` serves the production build from `npm run build`.

## Features

- Workflow visualization with Vue Flow
- Draggable accessible workflow nodes
- Standalone node creation
- Editing through a URL-addressable drawer
- Deletion, with the semantics described below
- Send Message text editing, plus image attachment preview, replacement, and removal
- Add Comment editing
- Business Hours editing
- Success and Failure connector nodes
- Keyboard interaction on top of Vue Flow
- Field validation
- A deterministic initial layout
- Viewport-aware placement for newly created nodes

## Architecture

```text
fake API
  -> TanStack Query
  -> normalization
  -> Pinia domain store
  -> Vue Flow adapter
  -> UI

UI action
  -> Pinia domain state
  -> serialization
  -> TanStack Query mutation
  -> fake API
```

The fake API keeps the latest payload in memory for the browser session.

### TanStack Query and Pinia

TanStack Query fetches the workflow and runs save mutations. Pinia holds the normalized domain graph: nodes, parent/child relationships, and client-side positions.

These are not two copies of the same state. After the first successful load, the query result is normalized and used to populate the Pinia store. In this project, that initial population is called hydration. It is not server-side rendering hydration. Later saves write back through the mutation and update the query cache. They do not rebuild the Pinia store from scratch.

### Normalization and serialization

Normalization turns the API payload into the internal domain model. Serialization turns that model back into the API payload.

The UI does not read or write the API shape directly. Client-only fields, including canvas positions, stay out of the payload. Changes to either representation stay on this boundary.

### Vue Flow adapter

Domain nodes are not Vue Flow nodes. An adapter builds the nodes, edges, and capabilities Vue Flow renders from the domain graph and the position map. That keeps most of the app independent of Vue Flow's element shape. Replacing Vue Flow would still require a new canvas integration.

## Workflow relationships

`parentId` is the source of truth for parent and child links. Vue Flow edges are derived from those links. They are not a second relationship store.

`rootIds` lists nodes whose `parentId` is null. The graph can be a forest. A new node is created as a root, and deleting a parent promotes its direct children to roots.

## Positions and layout

The API payload has no canvas coordinates.

Initial positions come from a deterministic tree layout. Positions changed by dragging are stored only in Pinia and are not sent to the API. Creating a node does not rearrange nodes that already have positions. A new standalone node is placed near the center of the current viewport, with a small repeating offset so consecutive creates do not stack on the same point.

Dynamic collision avoidance and a full automatic re-layout after edits are out of scope. Creating several standalone Business Hours branches can make the canvas crowded, because each branch adds its own Success and Failure nodes and those connectors are not draggable.

## Routing

Both routes render the same view, so the canvas stays mounted when the drawer opens or closes.

- `/` is the canvas.
- `/nodes/:nodeId` is the same canvas with the details drawer open.

The route parameter selects the open node. A direct link to `/nodes/:nodeId` opens that drawer after load. An unknown id shows a not-found state. A Success or Failure id is not editable and returns to `/`.

## Assumptions and design decisions

The assessment leaves a few behaviors unspecified. The choices below match the current implementation.

### Node creation

A new user node is a standalone root: `parentId` is null. The app does not connect it to an existing node, because the assessment does not define a connect or parent-selection flow.

The create form includes a description. Seed nodes have no description, so the domain model starts them with an empty one. When the description is empty, the card preview falls back to type-specific content, such as the first message text or the comment.

### Business Hours

Creating a Business Hours node also creates its Success and Failure connector nodes.

Those connectors are display-only. They do not open a drawer, they are not draggable, and they are omitted from keyboard focus and selection. They exist to show the two branches.

### Delete semantics

A normal node deletes only itself. Its direct children become roots. Deeper descendants stay attached to their own parents.

Deleting Business Hours also deletes its direct Success and Failure connectors. User nodes that were under those connectors become roots. Their descendants stay linked.

Trigger and the Success/Failure connectors are system nodes and cannot be deleted.

### Trigger

Trigger is a system node. It can be opened in the drawer, and that drawer is read-only. The assessment does not define an editor for it.

## Business Hours time inputs

The assessment asks for a date-time picker. The supplied payload is a recurring weekly schedule: a weekday, a start `HH:mm`, an end `HH:mm`, and a timezone. The provided data model represents recurring weekly time ranges rather than calendar dates, so native time inputs are used for each weekday.

An empty start and end means that day is closed. If one side is set, both are required. The end time must be after the start time. Overnight ranges are not supported. The timezone is stored on its own. An existing non-empty timezone remains valid even when it is not in the short list shown in the select.

## Attachments

The assessment does not provide an upload endpoint. A newly chosen image is previewed with a browser object URL for the current session. That URL is not a permanent uploaded file and is not guaranteed after a full page reload. A production app would upload the file first and store a permanent URL.

Existing remote attachment URLs are shown directly. Replacing an attachment keeps its position in the message payload.

## Accessibility and interactions

Accessible nodes can receive keyboard focus. Enter or Space opens the same drawer route as a click. Arrow keys keep Vue Flow's built-in nudge behavior. Success and Failure are excluded from focus and selection.

Form controls have labels. Invalid fields use `aria-invalid` and `aria-describedby`, and error text is exposed as an alert. The create dialog is a modal dialog. Escape closes the create dialog when it is open, and otherwise closes the drawer. This is not a claim of WCAG compliance.

## Rendering

Vue Flow handles pan, zoom, and drag. Relationships are not stored again as editable edge state. Opening the drawer does not remount the canvas. Drawer edits stay in a local draft until Save. Save validates the draft, updates the domain node, serializes the graph, and runs the save mutation.

## Testing

`npm run test` runs Vitest in happy-dom. The tests cover normalization and serialization, tree relationships, validation, initial layout, viewport placement, the Vue Flow adapter, the domain store, create/update/delete persistence, drawer routing, and the small helpers around attachments and visibility. They do not test Vue Flow, the router, or TanStack Query internals.

## Scope

The core editor is implemented. The following are outside that scope:

- Interactive edge creation and reconnection
- Dynamic collision avoidance or a full automatic re-layout after edits
- Permanent backend file upload
- Undo/redo is intentionally left as a nice-to-have. A robust implementation would require defining user-level transaction boundaries (for example, drag completion or form save), atomically capturing all affected domain state for compound operations such as Business Hours creation/deletion, and defining how history interacts with persistence. I would model this as a transaction/history layer around domain actions rather than recording individual Pinia mutations or Vue Flow events.

## Tech stack

- JavaScript ES6
- Vue 3
- Vite
- Pinia
- Vue Router
- Vue Flow
- TanStack Vue Query
- Vitest, Vue Test Utils, and happy-dom
