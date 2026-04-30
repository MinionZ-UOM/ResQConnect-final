import { describe, expect, it } from 'vitest'

import { mapDisaster } from '@/lib/utils/mapDisaster'
import { mapRequest } from '@/lib/utils/mapRequest'
import { mapWorkflowOutput } from '@/lib/utils/mapWorkflowOutput'

describe('mapDisaster', () => {
  it('applies safe defaults for invalid severity, status, and missing location', () => {
    const result = mapDisaster({
      id: 'dis-1',
      name: 'Flood in Colombo',
      description: 'Major flooding',
      severity: 'Critical',
      status: 'Unknown',
      type: null,
      location: undefined,
      created_at: null,
      image_urls: [],
    } as any)

    expect(result.severity).toBe('Medium')
    expect(result.status).toBe('Registered')
    expect(result.type).toBe('Unknown')
    expect(result.location).toEqual({ latitude: 0, longitude: 0, address: undefined })
    expect(result.imageUrl).toBeUndefined()
    expect(typeof result.createdAt).toBe('string')
  })

  it('preserves valid severity/status and mapped image URL', () => {
    const result = mapDisaster({
      id: 'dis-2',
      name: 'Landslide',
      description: 'Slope collapse',
      severity: 'High',
      status: 'Pending',
      type: 'Landslide',
      created_at: '2026-01-01T00:00:00Z',
      location: { lat: 7.1, lng: 80.2, address: 'Hill area' },
      image_urls: ['https://img.example/disaster.png'],
    } as any)

    expect(result.severity).toBe('High')
    expect(result.status).toBe('Pending')
    expect(result.imageUrl).toBe('https://img.example/disaster.png')
    expect(result.location.address).toBe('Hill area')
  })
})

describe('mapRequest', () => {
  it('normalizes nullable fields to undefined and maps media defaults', () => {
    const result = mapRequest({
      id: 'req-1',
      title: 'Need food',
      disaster_id: 'dis-1',
      type_of_need: 'food',
      description: null,
      media: [{ url: 'u1', name: null, size: null }],
      location: null,
      auto_extract: null,
      status: null,
      assigned_task_id: null,
      created_by: 'u-1',
      created_at: null,
      updated_at: null,
    })

    expect(result.description).toBeUndefined()
    expect(result.location).toBeUndefined()
    expect(result.autoExtract).toBeUndefined()
    expect(result.status).toBeUndefined()
    expect(result.assignedTaskId).toBeUndefined()
    expect(result.media).toEqual([{ url: 'u1', name: undefined, size: undefined, type: undefined }])
  })

  it('maps populated request data including location and custom media type', () => {
    const result = mapRequest({
      id: 'req-2',
      title: 'Need medicine',
      disaster_id: 'dis-2',
      type_of_need: 'medical',
      description: 'Urgent support',
      media: [{ url: 'u2', name: 'photo.jpg', size: 42, type: 'image/jpeg' }],
      location: { lat: 6.9, lng: 79.8, address: 'Street 1' },
      auto_extract: { risk: 'high' },
      status: 'open',
      assigned_task_id: 'task-1',
      created_by: 'u-2',
      created_at: '2026-01-01T12:00:00Z',
      updated_at: '2026-01-01T12:10:00Z',
    })

    expect(result.disasterId).toBe('dis-2')
    expect(result.typeOfNeed).toBe('medical')
    expect(result.location?.address).toBe('Street 1')
    expect(result.media[0].type).toBe('image/jpeg')
    expect(result.autoExtract).toEqual({ risk: 'high' })
  })
})

describe('mapWorkflowOutput', () => {
  it('maps tasks, resources, manpower, and fallback resource id', () => {
    const result = mapWorkflowOutput({
      workflow_run_id: 'wf-1',
      request_id: 'req-1',
      tasks: [
        {
          id: 'Task1',
          step: 'Deliver water',
          priority: 'high',
          approval_status: 'pending',
          created_at: '2026-01-01T12:00:00Z',
        },
      ],
      resource_suggestions: [
        {
          resource_id: 'res-1',
          type: 'water',
          total_quantity: 5,
          breakdown: [{ task_id: 'Task1', quantity: 3 }],
          substitution_for: null,
          quantity: 'bottles',
          approval_status: 'approved',
        },
      ],
      manpower: {
        total_volunteers: 2,
        breakdown: [{ task_id: 'Task1', volunteers: 2 }],
        notes: 'Need trained responders',
      },
      created_at: '2026-01-01T12:00:00Z',
      updated_at: '2026-01-01T12:05:00Z',
    })

    expect(result.workflowId).toBe('wf-1')
    expect(result.tasks[0].approvalStatus).toBe('pending')
    expect(result.resourceSuggestions[0].id).toBe('res-1')
    expect(result.resourceSuggestions[0].breakdown[0]).toEqual({ taskId: 'Task1', quantity: 3 })
    expect(result.manpower?.breakdown[0]).toEqual({ taskId: 'Task1', volunteers: 2 })
  })

  it('handles nullable nested arrays by returning empty collections', () => {
    const result = mapWorkflowOutput({
      workflow_run_id: 'wf-2',
      request_id: 'req-2',
      tasks: null,
      resource_suggestions: null,
      manpower: null,
    } as any)

    expect(result.tasks).toEqual([])
    expect(result.resourceSuggestions).toEqual([])
    expect(result.manpower).toBeUndefined()
  })
})
