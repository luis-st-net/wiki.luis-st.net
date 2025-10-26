# Task: Build a File-Based Wiki System for GitHub Projects Documentation



## Objective



Create a documentation wiki website for a Next.js 15 project that allows documenting GitHub projects through a hierarchical page structure. The system must support both direct file editing and browser-based content management without requiring a database. Note that this is purely for creating documentation content about GitHub projects and does not require any GitHub API integration or automated data pulling.



## Technical Stack



Build the application using Next.js 15 with App Router and TypeScript. Use shadcn/ui components for the UI foundation and Tailwind CSS for styling. Store all content as MDX files in the project directory to enable version control and file-based management.



## Core Features to Implement



**Content Management**: Implement a dual-editing system where users can either edit MDX files directly in their code editor or use a browser-based admin panel. The admin interface must provide CRUD operations for wiki pages, including a markdown editor with live preview functionality. All changes through the admin panel should write directly to the MDX files in the project structure.



**Hierarchical Organization**: Design a folder-based hierarchy system that automatically generates navigation from the content directory structure. Support unlimited nesting levels to allow grouping of related projects and breaking down larger projects into overview pages with detailed sub-pages. Extract page metadata from MDX frontmatter including title, description, and optional ordering.



**Navigation System**: Build a sidebar that displays the complete page hierarchy with collapsible sections for nested content. Generate a table of contents from page headings and integrate it into the sidebar for quick section navigation. Implement breadcrumb navigation at the top of each page showing the current location in the hierarchy with clickable parent links.



**Search Functionality**: Create a global search feature that indexes all page titles, headings, and content. Display search results with highlighted matching text and show the hierarchical path for each result. Implement the search with instant filtering as the user types.



**Theming and Styling**: Implement a complete dark and light theme system with a toggle switcher accessible from the UI. Create custom WikiComponents that wrap shadcn/ui primitives with consistent documentation-appropriate styling. Ensure all components maintain visual consistency across both themes using Tailwind CSS.



**Content Rendering**: Integrate MDX processing to render markdown content with support for React component embedding. Implement syntax highlighting for code blocks supporting multiple programming languages. Ensure proper rendering of all standard markdown elements including tables, lists, images, and links.



## Component Architecture



Create a modular component structure with WikiComponents serving as styled wrappers around shadcn/ui primitives. Build reusable components for the sidebar navigation, page renderer, table of contents, breadcrumbs, search interface, and admin panel. Ensure all components follow the same styling patterns and are responsive across device sizes.



## File System Requirements



Organize content in a dedicated directory with a clear structure where folders represent hierarchy levels and MDX files represent individual pages. Implement automatic scanning of the content directory to build the navigation tree. Support frontmatter metadata in each MDX file for page configuration.



## Admin Panel Specifications



Create an admin route that provides a file browser interface showing the current content structure. Implement a markdown editor with split-view or tabbed preview functionality. Add buttons for creating new pages, editing existing ones, deleting pages, and managing the folder structure. Ensure all operations safely read and write to the file system without data loss.



**Admin Panel Routing**: Group all admin-related functionality under a single project route (for example `/admin` or `/wiki-admin`). This unified routing structure will enable IP address restrictions to be applied to the entire admin section in production environments through reverse proxy or Next.js middleware configuration. Ensure all admin pages, API routes, and related functionality are nested under this single route prefix.



## Initial Content and Documentation



Create example documentation for the wiki project itself to serve as both a demonstration of the system's capabilities and as a getting-started guide for users. This self-documenting approach should showcase the hierarchical structure, markdown features, code highlighting, and component embedding capabilities. Include documentation covering installation, configuration, content creation workflow, and customization options. Structure this example content to demonstrate best practices for organizing project documentation.



## Deliverables



Provide a fully functional Next.js application with all dependencies updated to their latest stable versions. Include the complete component library with WikiComponents properly styled and documented. Deliver a working admin panel integrated into the application under a unified route prefix. Ensure the sidebar navigation, search, theming, and content rendering all function correctly out of the box. Include example documentation content that demonstrates the wiki's features and serves as a user guide.