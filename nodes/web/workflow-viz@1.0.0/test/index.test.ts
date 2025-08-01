import path from 'path';
import fs from 'fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import WorkflowViz from '../index';
import { Context } from '@nanoservice-ts/shared';

describe('WorkflowViz', () => {
  let workflowViz: WorkflowViz;
  let mockContext: Context;

  beforeEach(() => {
    workflowViz = new WorkflowViz();
    mockContext = {
      config: {},
      request: {
        body: {},
        headers: {},
        url: '',
        originalUrl: '',
        query: {},
        params: {},
        cookies: {}
      },
      response: {
        data: {}
      }
    } as unknown as Context;
  });

  it('should initialize with correct properties', () => {
    expect(workflowViz.inputSchema).toBeDefined();
    expect(workflowViz.contentType).toBe('text/html');
  });

  it('should handle request with workflow path', async () => {
    // Create a temporary workflow file for testing
    const tempWorkflowPath = path.join(__dirname, 'temp-workflow.json');
    const workflowData = {
      name: 'Test Workflow',
      nodes: {
        node1: { type: 'test-type', name: 'Test Node' }
      },
      edges: []
    };
    
    fs.writeFileSync(tempWorkflowPath, JSON.stringify(workflowData));

    const response = await workflowViz.handle(mockContext, {
      workflow_path: tempWorkflowPath,
      title: 'Test Visualization'
    });

    expect(response.success).toBe(true);
    expect(response.data).toContain('Test Visualization');
    expect(response.data).toContain('<!DOCTYPE html>');

    // Clean up
    fs.unlinkSync(tempWorkflowPath);
  });

  it('should handle request without workflow path', async () => {
    const response = await workflowViz.handle(mockContext, {
      title: 'Test Without Workflow'
    });

    expect(response.success).toBe(true);
    expect(response.data).toContain('Test Without Workflow');
    expect(response.data).toContain('<!DOCTYPE html>');
  });

  it('should handle errors gracefully', async () => {
    // Mock fs.readFileSync to throw an error
    vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    const response = await workflowViz.handle(mockContext, {});

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.message).toBe('Test error');
    expect(response.error?.code).toBe(500);
  });
});