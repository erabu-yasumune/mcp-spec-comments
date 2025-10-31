#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  passToAIForRequirements,
  PassToAIForRequirementsInput,
  passToAIForDesign,
  PassToAIForDesignInput,
  passToAIForComments,
  PassToAIForCommentsInput,
  verifySpecComments,
  VerifySpecCommentsInput,
  passToAIForImplementation,
  PassToAIForImplementationInput,
} from './tools.js';

// Create MCP server
const server = new Server(
  {
    name: 'mcp-spec-comments',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'pass_to_ai_for_requirements',
        description:
          'ユーザー要件をAIに渡して要件定義書を作成させる（ワークフローの最初のステップ）。出力先は .spec-comments/{feature_name}/requirements.md となる。',
        inputSchema: {
          type: 'object',
          properties: {
            user_input: {
              type: 'string',
              description: 'ユーザーが作りたいものの説明や要件',
            },
            feature_name: {
              type: 'string',
              description:
                '機能名（例: user-authentication, payment-system）。この名前でディレクトリが作成される。',
            },
            output_path: {
              type: 'string',
              description:
                '出力先のファイルパス（省略可能）。指定しない場合は .spec-comments/{feature_name}/requirements.md が使用される。',
            },
          },
          required: ['user_input', 'feature_name'],
        },
      },
      {
        name: 'pass_to_ai_for_design',
        description:
          '要件定義書を元にAIに設計書を作成させる（ワークフローの2番目のステップ）。出力先は .spec-comments/{feature_name}/design.md となる。',
        inputSchema: {
          type: 'object',
          properties: {
            requirements_path: {
              type: 'string',
              description: '要件定義書のファイルパス',
            },
            feature_name: {
              type: 'string',
              description:
                '機能名（例: user-authentication）。要件定義書作成時に使用したものと同じ名前を指定。',
            },
            output_path: {
              type: 'string',
              description:
                '出力先のファイルパス（省略可能）。指定しない場合は .spec-comments/{feature_name}/design.md が使用される。',
            },
          },
          required: ['requirements_path', 'feature_name'],
        },
      },
      {
        name: 'pass_to_ai_for_comments',
        description:
          '設計書を元にAIにコメント(@spec-implマーカー)を書かせる（ワークフローの3番目のステップ）。既存ファイルにコメントを追加したり、新規ファイルを作成できる。',
        inputSchema: {
          type: 'object',
          properties: {
            design_path: {
              type: 'string',
              description: '設計書のファイルパス',
            },
            target_files: {
              type: 'array',
              items: {
                type: 'string',
              },
              description:
                '対象ファイルのパス配列（省略時は設計書から判断）',
            },
          },
          required: ['design_path'],
        },
      },
      {
        name: 'verify_spec_comments',
        description:
          'ファイルに@spec-implマーカーが配置されているかを検証する。pass_to_ai_for_commentsの実行後に使用して、すべてのファイルにマーカーが正しく追加されているか確認する。',
        inputSchema: {
          type: 'object',
          properties: {
            target_files: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '検証対象のファイルパス配列',
            },
          },
          required: ['target_files'],
        },
      },
      {
        name: 'pass_to_ai_for_implementation',
        description:
          'コメント付きファイルをAIに渡して実装させる（ワークフローの最後のステップ）。@spec-implマーカーに従って実装し、完了後はDONE状態に更新する。',
        inputSchema: {
          type: 'object',
          properties: {
            target_files: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '実装対象のファイルパス配列',
            },
            implementation_order: {
              type: 'number',
              description: '実装順序（省略可能）',
            },
          },
          required: ['target_files'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'pass_to_ai_for_requirements': {
        const input = args as unknown as PassToAIForRequirementsInput;
        const result = await passToAIForRequirements(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'pass_to_ai_for_design': {
        const input = args as unknown as PassToAIForDesignInput;
        const result = await passToAIForDesign(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'pass_to_ai_for_comments': {
        const input = args as unknown as PassToAIForCommentsInput;
        const result = await passToAIForComments(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'verify_spec_comments': {
        const input = args as unknown as VerifySpecCommentsInput;
        const result = await verifySpecComments(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'pass_to_ai_for_implementation': {
        const input = args as unknown as PassToAIForImplementationInput;
        const result = await passToAIForImplementation(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Spec Comments server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
