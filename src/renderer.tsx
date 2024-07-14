import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
        <title>Email Domain Checker</title>
      </head>
      <body>{children}</body>
    </html>
  );
});
