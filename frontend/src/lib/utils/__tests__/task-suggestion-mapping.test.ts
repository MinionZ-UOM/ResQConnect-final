import { describe, expect, it } from 'vitest'

import {
  buildTaskSuggestions,
  mapApprovalStatusToTaskStatus,
  mapPriorityToTaskPriority,
  mapTaskPriorityToApi,
  mapTaskStatusToApprovalStatus,
  mapWorkflowTaskToTask,
} from '@/lib/utils/taskSuggestionMapping'

describe('status and priority mapping', () => {
  it('maps approval status to task status', () => {
    expect(mapApprovalStatusToTaskStatus('pending')).toBe('Pending')
    expect(mapApprovalStatusToTaskStatus('approved')).toBe('Approved')
    expect(mapApprovalStatusToTaskStatus('rejected')).toBe('Rejected')
  })

  it('maps task status back to approval status when applicable', () => {
    expect(mapTaskStatusToApprovalStatus('Pending')).toBe('pending')
    expect(mapTaskStatusToApprovalStatus('Approved')).toBe('approved')
    expect(mapTaskStatusToApprovalStatus('Rejected')).toBe('rejected')
    expect(mapTaskStatusToApprovalStatus('Assigned')).toBeUndefined()
  })

  it('maps priority values with case-insensitive and fallback behavior', () => {
    expect(mapPriorityToTaskPriority('HIGH')).toBe('High')
    expect(mapPriorityToTaskPriority('medium')).toBe('Medium')
    expect(mapPriorityToTaskPriority('unknown-priority')).toBe('Medium')
    expect(mapTaskPriorityToApi('Low')).toBe('low')
  })
})

describe('mapWorkflowTaskToTask', () => {
  const workflowOutput = {
    workflowId: 'wf-1',
    requestId: 'req-1',
    tasks: [
      {
        id: 'Task1',
        step: 'Deliver water packs',
        priority: 'high',
        approvalStatus: 'approved',
        createdAt: '2026-01-01T12:00:00Z',
      },
    ],
    resourceSuggestions: [
      {
        id: 'res-water',
        type: 'water',
        totalQuantity: 10,
        breakdown: [{ taskId: 'Task1', quantity: 4 }],
        quantity: 'bottles',
        approvalStatus: 'approved',
      },
      {
        id: 'res-food',
        type: 'food',
        totalQuantity: 5,
        breakdown: [{ taskId: 'TaskX', quantity: 1 }],
        approvalStatus: 'approved',
      },
    ],
    manpower: {
      totalVolunteers: 4,
      breakdown: [{ taskId: 'Task1', volunteers: 2 }],
      notes: 'Need PPE',
    },
  } as any

  it('builds task with mapped status, location, and requirements', () => {
    const request = {
      id: 'req-1',
      title: 'Need supplies',
      disasterId: 'dis-1',
      typeOfNeed: 'food',
      media: [],
      createdBy: 'u-1',
      location: { lat: 6.9, lng: 79.8, address: 'Main Road' },
    } as any

    const result = mapWorkflowTaskToTask(workflowOutput.tasks[0], workflowOutput, request)

    expect(result.priority).toBe('High')
    expect(result.status).toBe('Approved')
    expect(result.location).toEqual({ lat: 6.9, lng: 79.8, address: 'Main Road' })
    expect(result.requirements?.manpower?.total_volunteers).toBe(2)
    expect(result.requirements?.resources).toEqual([
      {
        resourceId: 'res-water',
        type: 'water',
        quantity: 4,
        unit: 'bottles',
      },
    ])
  })

  it('returns undefined requirements when no matching manpower or resources', () => {
    const outputWithoutMatches = {
      ...workflowOutput,
      manpower: { totalVolunteers: 4, breakdown: [{ taskId: 'Other', volunteers: 2 }] },
      resourceSuggestions: [
        {
          id: 'res-1',
          type: 'water',
          totalQuantity: 1,
          breakdown: [{ taskId: 'Other', quantity: 1 }],
          approvalStatus: 'pending',
        },
      ],
    } as any

    const result = mapWorkflowTaskToTask(workflowOutput.tasks[0], outputWithoutMatches, undefined)

    expect(result.location).toBeUndefined()
    expect(result.requirements).toBeUndefined()
  })
})

describe('buildTaskSuggestions', () => {
  it('creates flattened tasks across outputs and uses request map lookups', () => {
    const outputs = [
      {
        workflowId: 'wf-1',
        requestId: 'req-1',
        tasks: [{ id: 't1', step: 'A', priority: 'low', approvalStatus: 'pending' }],
        resourceSuggestions: [],
      },
      {
        workflowId: 'wf-2',
        requestId: 'req-2',
        tasks: [{ id: 't2', step: 'B', priority: 'medium', approvalStatus: 'approved' }],
        resourceSuggestions: [],
      },
    ] as any

    const requests = new Map([
      ['req-1', { id: 'req-1', disasterId: 'dis-1', media: [], createdBy: 'u-1', title: 'one', typeOfNeed: 'food' }],
      ['req-2', { id: 'req-2', disasterId: 'dis-2', media: [], createdBy: 'u-2', title: 'two', typeOfNeed: 'medical' }],
    ]) as any

    const tasks = buildTaskSuggestions(outputs, requests)

    expect(tasks).toHaveLength(2)
    expect(tasks[0].requestId).toBe('req-1')
    expect(tasks[1].disasterId).toBe('dis-2')
  })
})
