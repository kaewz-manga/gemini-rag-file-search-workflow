#!/usr/bin/env python3
"""
Sanitize n8n workflow JSON by replacing sensitive data with placeholders
"""

import json
import sys
from typing import Any, Dict

def sanitize_workflow(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """
    Replace sensitive information with environment variable placeholders
    """
    
    # Mapping of sensitive values to placeholders
    replacements = {
        'n8n-no1.missmanga.org': '{{N8N_BASE_URL}}',
        'https://n8n-no1.missmanga.org': 'https://{{N8N_BASE_URL}}',
        '15f8tcNuqNvoyeFqnhYITAPIKHFrBqSEI': '{{GOOGLE_DRIVE_FOLDER_ID}}',
        'tX53xAUrpXUJdsmt': '{{DATA_TABLE_MAIN_ID}}',
        'cdw2NLJpjcpxi5qg': '{{DATA_TABLE_DOCUMENT_ID}}',
        'https://n8n-no1.missmanga.org/mcp/gemini-rag': '{{MCP_ENDPOINT_URL}}',
        'gemini-rag-webhook-001': '{{WEBHOOK_ID}}',
    }
    
    # Convert workflow to JSON string for replacement
    workflow_json = json.dumps(workflow, indent=2)
    
    # Replace all sensitive values
    for old_value, new_value in replacements.items():
        workflow_json = workflow_json.replace(old_value, new_value)
    
    # Convert back to dict
    sanitized = json.loads(workflow_json)
    
    # Remove personal identifiers
    if 'tags' in sanitized:
        sanitized['tags'] = []
    
    # Add note about configuration
    sanitized['meta'] = sanitized.get('meta', {})
    sanitized['meta']['configurationNote'] = (
        'Please replace {{PLACEHOLDER}} values with your actual configuration. '
        'See .env.example for reference.'
    )
    
    return sanitized


def main():
    """Main function"""
    
    if len(sys.argv) < 3:
        print("Usage: python3 sanitize_workflow.py <input.json> <output.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Read original workflow
        with open(input_file, 'r', encoding='utf-8') as f:
            workflow = json.load(f)
        
        # Sanitize
        sanitized = sanitize_workflow(workflow)
        
        # Write sanitized version
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sanitized, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Sanitized workflow saved to: {output_file}")
        print(f"   Replaced sensitive data with placeholders")
        print(f"   Review the file before committing to GitHub")
        
    except FileNotFoundError:
        print(f"❌ Error: File '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in '{input_file}': {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
