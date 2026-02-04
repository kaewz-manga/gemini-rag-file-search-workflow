# Pages Guide

> Page component patterns for gemini-rag-mcp dashboard.

**Pattern**: Same as n8n-management-mcp

---

## RAG Pages

### Files Page (`/files`)

```tsx
export default function FilesPage() {
  const { selectedFileStore } = useFileStore();

  if (!selectedFileStore) {
    return <SelectFileStorePrompt />;
  }

  return (
    <DashboardLayout>
      <UploadDropzone onUpload={handleUpload} />
      <FileList files={files} />
    </DashboardLayout>
  );
}
```

### Search Page (`/search`)

```tsx
export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  return (
    <DashboardLayout>
      <SearchInput value={query} onChange={setQuery} onSearch={handleSearch} />
      <SearchResults results={results} />
    </DashboardLayout>
  );
}
```

### Ask Page (`/ask`)

```tsx
export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<RAGResponse | null>(null);

  return (
    <DashboardLayout>
      <QuestionInput value={question} onSubmit={handleAsk} />
      {answer && (
        <>
          <AnswerCard answer={answer.answer} />
          <CitationList citations={answer.citations} />
        </>
      )}
    </DashboardLayout>
  );
}
```
