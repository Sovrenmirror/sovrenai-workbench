/**
 * WorkflowBuilder Component
 * Basic workflow creation interface
 */

import React, { useState } from 'react';
import { AGENTS } from '../../types/agent';
import { getAuthHeader } from '../../services/auth';
import { config } from '../../config/api';

interface WorkflowStep {
  id: string;
  agentId: string;
  taskType: string;
  dependsOn?: string[];
}

export const WorkflowBuilder: React.FC = () => {
  const [workflowName, setWorkflowName] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isAddingStep, setIsAddingStep] = useState(false);

  const agents = Object.values(AGENTS);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      agentId: agents[0].id,
      taskType: 'execute',
      dependsOn: steps.length > 0 ? [steps[steps.length - 1].id] : []
    };
    setSteps([...steps, newStep]);
    setIsAddingStep(false);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const updateStep = (stepId: string, update: Partial<WorkflowStep>) => {
    setSteps(
      steps.map((s) => (s.id === stepId ? { ...s, ...update } : s))
    );
  };

  const handleSave = async () => {
    const workflow = {
      name: workflowName,
      steps: steps.map((step) => ({
        id: step.id,
        agentId: step.agentId,
        taskType: step.taskType,
        dependsOn: step.dependsOn
      }))
    };

    console.log('Saving workflow:', workflow);

    try {
      const authHeader = await getAuthHeader();

      const response = await fetch(config.api.workflows.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(workflow)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Workflow saved:', data.workflow);
      alert(`Workflow "${workflowName}" saved successfully!`);
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(`Failed to save workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExecute = async () => {
    if (!workflowName || steps.length === 0) {
      alert('Please create a workflow first');
      return;
    }

    const workflow = {
      name: workflowName,
      steps: steps.map((step) => ({
        id: step.id,
        agentId: step.agentId,
        taskType: step.taskType,
        dependsOn: step.dependsOn
      }))
    };

    console.log('Executing workflow:', workflow);

    try {
      const authHeader = await getAuthHeader();

      const response = await fetch(config.api.workflows.execute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ workflow })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Workflow execution started:', data);
      alert(`Workflow "${workflowName}" started! Check the Activity tab for progress.`);
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert(`Failed to execute workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Workflow Builder
          </h1>
          <p className="text-gray-400">
            Create multi-step workflows with agent collaboration
          </p>
        </div>

        {/* Workflow Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Workflow Name
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="e.g., Research & Summarize"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Steps</h2>
            <button
              onClick={() => setIsAddingStep(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-gray-400">
                No steps yet. Click "Add Step" to start building your workflow.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => {
                const agent = agents.find((a) => a.id === step.agentId);
                return (
                  <div
                    key={step.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Agent Selection */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Agent
                            </label>
                            <select
                              value={step.agentId}
                              onChange={(e) =>
                                updateStep(step.id, { agentId: e.target.value })
                              }
                              className="w-full bg-gray-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                  {agent.icon} {agent.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Task Type */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Task Type
                            </label>
                            <input
                              type="text"
                              value={step.taskType}
                              onChange={(e) =>
                                updateStep(step.id, { taskType: e.target.value })
                              }
                              className="w-full bg-gray-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        {agent && (
                          <p className="text-xs text-gray-500">
                            {agent.description}
                          </p>
                        )}

                        {/* Dependencies */}
                        {step.dependsOn && step.dependsOn.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            Depends on: Step {steps.findIndex((s) => s.id === step.dependsOn![0]) + 1}
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeStep(step.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!workflowName || steps.length === 0}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Save Workflow
          </button>
          <button
            onClick={handleExecute}
            disabled={!workflowName || steps.length === 0}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Execute Now
          </button>
          <button
            onClick={() => {
              setWorkflowName('');
              setSteps([]);
            }}
            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Templates */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setWorkflowName('Research & Summarize');
                setSteps([
                  { id: 'step-1', agentId: 'researcher', taskType: 'research' },
                  { id: 'step-2', agentId: 'analyst', taskType: 'analyze', dependsOn: ['step-1'] },
                  { id: 'step-3', agentId: 'writer', taskType: 'write', dependsOn: ['step-2'] }
                ]);
              }}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
            >
              <div className="font-semibold text-white mb-1">
                📚 Research & Summarize
              </div>
              <div className="text-xs text-gray-400">
                Research → Analyze → Write Summary
              </div>
            </button>

            <button
              onClick={() => {
                setWorkflowName('Complete Analysis');
                setSteps([
                  { id: 'step-1', agentId: 'researcher', taskType: 'research' },
                  { id: 'step-2', agentId: 'analyst', taskType: 'analyze', dependsOn: ['step-1'] },
                  { id: 'step-3', agentId: 'designer', taskType: 'diagram', dependsOn: ['step-2'] },
                  { id: 'step-4', agentId: 'reviewer', taskType: 'review', dependsOn: ['step-3'] }
                ]);
              }}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
            >
              <div className="font-semibold text-white mb-1">
                📊 Complete Analysis
              </div>
              <div className="text-xs text-gray-400">
                Research → Analyze → Visualize → Review
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Add Step Modal (Simple) */}
      {isAddingStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add Step</h3>
            <p className="text-gray-400 mb-4">
              A new step will be added after the last step
            </p>
            <div className="flex gap-3">
              <button
                onClick={addStep}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingStep(false)}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
