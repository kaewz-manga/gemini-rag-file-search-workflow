# React Patterns Guide

> Component and state patterns for gemini-rag-mcp dashboard.

**Pattern**: Same as n8n-management-mcp

---

## Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Third-party
import { useQuery, useMutation } from '@tanstack/react-query';

// 3. Local components
import { Button, Input, Card } from '@/components/ui';

// 4. Hooks & contexts
import { useAuth, useSudo, useFileStore } from '@/contexts';

// 5. Types
import type { FileStore, GeminiFile } from '@/types';
```

---

## State Management

### TanStack Query for Server State

```typescript
const { data: fileStores } = useQuery({
  queryKey: ['fileStores'],
  queryFn: () => api.get('/filestores'),
});
```

### useState for Local State

```typescript
const [query, setQuery] = useState('');
const [results, setResults] = useState<SearchResult[]>([]);
```

---

## Protected Actions (Sudo Mode)

```typescript
const { withSudo } = useSudo();

const handleDelete = async () => {
  await withSudo(async () => {
    await api.delete(`/filestores/${id}`);
  });
};
```
