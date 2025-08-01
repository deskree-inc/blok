export const inputSchema = {
  type: "object",
  properties: {
    workflow_path: {
      type: "string",
      description: "Path to the workflow JSON file to visualize"
    },
    title: {
      type: "string",
      description: "Title of the visualization page"
    },
    scripts: {
      type: "string",
      description: "Additional scripts to include in the HTML"
    },
    metas: {
      type: "string",
      description: "Additional meta tags to include in the HTML"
    },
    index_html: {
      type: "string",
      description: "Path to the HTML template file"
    },
    styles: {
      type: "string",
      description: "Additional styles to include in the HTML"
    },
    root_element: {
      type: "string",
      description: "ID of the root element to render the React app into"
    }
  }
};