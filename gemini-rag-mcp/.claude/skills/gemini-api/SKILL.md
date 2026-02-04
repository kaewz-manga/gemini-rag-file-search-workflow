# Gemini API Skill

> Gemini Semantic Retrieval API patterns.

## Concepts
- **Corpus** — Container for documents
- **Document** — Metadata + content
- **Chunk** — Searchable text segment

## Endpoints
```
POST /v1beta/corpora
POST /v1beta/{corpus}/documents
POST /v1beta/{document}/chunks:batchCreate
POST /v1beta/{corpus}:query
POST /v1beta/models/aqa:generateAnswer
```
