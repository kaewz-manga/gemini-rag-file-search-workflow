# Dashboard Guide

> React SaaS Dashboard for gemini-rag-mcp.

**Pattern**: Same as n8n-management-mcp dashboard

---

## Tech Stack

- **React 19** with TypeScript
- **Vite** for bundling
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling

---

## Theme Colors (Purple Accent)

```typescript
colors: {
  'rag-bg': '#0a0a0f',
  'rag-surface': '#12121a',
  'rag-elevated': '#1a1a24',
  'rag-border': '#2a2a3a',
  'rag-text': '#f0f0f5',
  'rag-text-secondary': '#a0a0b0',
  'rag-accent': '#8b5cf6',        // Purple
  'rag-accent-hover': '#7c3aed',
}
```

---

## Route Structure

| Route | Auth | Component |
|-------|------|-----------|
| `/` | Public | Landing |
| `/login` | Public | Login |
| `/dashboard` | JWT | Dashboard |
| `/filestores` | JWT | FileStoreList |
| `/files` | JWT | FileList |
| `/search` | JWT | SearchPage |
| `/ask` | JWT | AskPage |
| `/api-keys` | JWT | ApiKeyList |

---

## Context Providers

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <SudoProvider>
      <FileStoreProvider>
        <RouterProvider router={router} />
      </FileStoreProvider>
    </SudoProvider>
  </AuthProvider>
</QueryClientProvider>
```
