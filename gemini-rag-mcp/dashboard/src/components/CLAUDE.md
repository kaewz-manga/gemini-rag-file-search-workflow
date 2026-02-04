# Components Guide

> Reusable UI components for gemini-rag-mcp dashboard.

**Pattern**: Same as n8n-management-mcp

---

## RAG-Specific Components

### FileCard

```tsx
export function FileCard({ file, onDelete }: FileCardProps) {
  const statusColors = {
    PROCESSING: 'bg-yellow-500/20 text-yellow-400',
    ACTIVE: 'bg-green-500/20 text-green-400',
    FAILED: 'bg-red-500/20 text-red-400',
  };

  return (
    <Card className="bg-rag-surface border-rag-border">
      <FileIcon className="h-8 w-8 text-rag-accent" />
      <span className={statusColors[file.state]}>{file.state}</span>
    </Card>
  );
}
```

### SearchInput

```tsx
export function SearchInput({ value, onChange, onSearch }: SearchInputProps) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-rag-elevated border-rag-border"
        placeholder="Search your documents..."
      />
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
}
```

### CitationCard

```tsx
export function CitationCard({ citation, index }: CitationCardProps) {
  return (
    <div className="bg-rag-elevated border-l-4 border-rag-accent p-4">
      <span className="bg-rag-accent text-white text-xs px-2 py-1 rounded">
        [{index + 1}]
      </span>
      <p className="text-rag-text">{citation.text}</p>
      <span className="text-rag-text-secondary">{citation.source}</span>
    </div>
  );
}
```

### UploadDropzone

```tsx
export function UploadDropzone({ onUpload }: { onUpload: (file: File) => void }) {
  return (
    <div className="border-2 border-dashed border-rag-border hover:border-rag-accent/50 p-8 text-center">
      <Upload className="h-12 w-12 text-rag-text-muted mx-auto" />
      <p>Drop files here or click to upload</p>
    </div>
  );
}
```

---

## Theme Classes (Purple Accent)

```tsx
className="bg-rag-accent"           // #8b5cf6
className="text-rag-accent"
className="border-rag-accent"
```
