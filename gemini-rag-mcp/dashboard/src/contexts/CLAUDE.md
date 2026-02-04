# Contexts Guide

> React Context providers for gemini-rag-mcp dashboard.

**Pattern**: Same as n8n-management-mcp

---

## Available Contexts

| Context | Purpose | Key Values |
|---------|---------|------------|
| **AuthContext** | User authentication | user, login, logout |
| **SudoContext** | TOTP verification | withSudo |
| **FileStoreContext** | Selected file store | selectedFileStore |

---

## AuthContext

```tsx
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

---

## SudoContext

```tsx
interface SudoContextValue {
  withSudo: <T>(action: () => Promise<T>) => Promise<T>;
  isSudoActive: boolean;
}
```

---

## FileStoreContext

```tsx
interface FileStoreContextValue {
  fileStores: FileStore[];
  selectedFileStore: FileStore | null;
  setSelectedFileStore: (store: FileStore | null) => void;
  refreshFileStores: () => Promise<void>;
}
```

### Usage

```tsx
const { selectedFileStore } = useFileStore();

if (!selectedFileStore) {
  return <SelectFileStorePrompt />;
}
```
