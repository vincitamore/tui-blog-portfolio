import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchProjects, createProject, updateProject, deleteProject, reorderProjects } from '../../../shared/lib/api';
import type { Project } from '../../../shared/lib/api';
import { TuiEditor } from '../../../shared/ui/editor';
import type { EditorData } from '../../../shared/ui/editor';

interface PortfolioAppProps {
  onBack: () => void;
  isAdmin?: boolean;
}

/**
 * Portfolio TUI Application
 * Displays projects in a terminal-style list view
 * Admin mode allows creating, editing, deleting, and reordering projects
 */
const PortfolioApp: React.FC<PortfolioAppProps> = ({ onBack, isAdmin = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchProjects()
      .then(setProjects)
      .finally(() => setIsLoading(false));
  }, []);

  // Move project up in the list
  const handleMoveUp = useCallback(async () => {
    if (selectedIndex <= 0 || projects.length < 2) return;
    
    const newProjects = [...projects];
    const temp = newProjects[selectedIndex - 1];
    newProjects[selectedIndex - 1] = newProjects[selectedIndex];
    newProjects[selectedIndex] = temp;
    
    setProjects(newProjects);
    setSelectedIndex(selectedIndex - 1);
    
    // Persist the new order
    try {
      const ids = newProjects.map(p => p.id).filter((id): id is string => !!id);
      await reorderProjects(ids);
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }, [projects, selectedIndex]);

  // Move project down in the list
  const handleMoveDown = useCallback(async () => {
    if (selectedIndex >= projects.length - 1 || projects.length < 2) return;
    
    const newProjects = [...projects];
    const temp = newProjects[selectedIndex + 1];
    newProjects[selectedIndex + 1] = newProjects[selectedIndex];
    newProjects[selectedIndex] = temp;
    
    setProjects(newProjects);
    setSelectedIndex(selectedIndex + 1);
    
    // Persist the new order
    try {
      const ids = newProjects.map(p => p.id).filter((id): id is string => !!id);
      await reorderProjects(ids);
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }, [projects, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isCreating || editingProject) return;

      if (showDeleteConfirm) {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleConfirmDelete();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
          e.preventDefault();
          setShowDeleteConfirm(false);
        }
        return;
      }

      if (viewingProject) {
        if (e.key === 'Escape' || e.key === 'q') {
          e.preventDefault();
          setViewingProject(null);
        }
        if (isAdmin && e.key === 'e') {
          e.preventDefault();
          setEditingProject(viewingProject);
        }
        if (isAdmin && e.key === 'd') {
          e.preventDefault();
          setShowDeleteConfirm(true);
        }
        return;
      }

      // Admin reorder with Shift+J/K or Shift+Arrow
      if (isAdmin && e.shiftKey) {
        if (e.key === 'K' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleMoveUp();
          return;
        }
        if (e.key === 'J' || e.key === 'ArrowDown') {
          e.preventDefault();
          handleMoveDown();
          return;
        }
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(projects.length - 1, i + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (projects[selectedIndex]) {
            setViewingProject(projects[selectedIndex]);
          }
          break;
        case 'n':
          if (isAdmin) {
            e.preventDefault();
            setIsCreating(true);
          }
          break;
        case 'Escape':
        case 'q':
          e.preventDefault();
          onBack();
          break;
      }
    },
    [projects, selectedIndex, viewingProject, onBack, isAdmin, isCreating, editingProject, showDeleteConfirm, handleMoveUp, handleMoveDown],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSaveProject = useCallback(async (data: EditorData) => {
    setSaveStatus('saving');
    try {
      const newProject = await createProject({
        title: data.title,
        description: data.description,
        technologies: data.technologies ? data.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        github: data.github || undefined,
        link: data.link || undefined,
      });
      setProjects(prev => [newProject, ...prev]);
      setIsCreating(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save project:', err);
      setSaveStatus('error');
    }
  }, []);

  const handleUpdateProject = useCallback(async (data: EditorData) => {
    if (!editingProject?.id) return;
    
    setSaveStatus('saving');
    try {
      const updated = await updateProject(editingProject.id, {
        title: data.title,
        description: data.description,
        technologies: data.technologies ? data.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        github: data.github || undefined,
        link: data.link || undefined,
      });
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
      setViewingProject(updated);
      setEditingProject(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to update project:', err);
      setSaveStatus('error');
    }
  }, [editingProject]);

  const handleConfirmDelete = useCallback(async () => {
    if (!viewingProject?.id) return;
    
    try {
      await deleteProject(viewingProject.id);
      setProjects(prev => prev.filter(p => p.id !== viewingProject.id));
      setViewingProject(null);
      setShowDeleteConfirm(false);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, [viewingProject]);

  // Show editor for new project
  if (isCreating) {
    return (
      <TuiEditor
        title="New Project"
        fields={[
          { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'My Awesome Project' },
          { name: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'React, TypeScript, Node.js' },
          { name: 'github', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/user/repo' },
          { name: 'link', label: 'Live URL', type: 'text', placeholder: 'https://myproject.com' },
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your project...' },
        ]}
        onSave={handleSaveProject}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  // Show editor for editing existing project
  if (editingProject) {
    return (
      <TuiEditor
        title={`Edit: ${editingProject.title}`}
        fields={[
          { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'My Awesome Project' },
          { name: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'React, TypeScript, Node.js' },
          { name: 'github', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/user/repo' },
          { name: 'link', label: 'Live URL', type: 'text', placeholder: 'https://myproject.com' },
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your project...' },
        ]}
        initialData={{
          title: editingProject.title,
          technologies: editingProject.technologies?.join(', ') || '',
          github: editingProject.github || '',
          link: editingProject.link || '',
          description: editingProject.description,
        }}
        onSave={handleUpdateProject}
        onCancel={() => setEditingProject(null)}
      />
    );
  }

  // Show individual project
  if (viewingProject) {
    return (
      <div className="h-full overflow-auto p-4" style={{ color: 'var(--term-foreground)' }}>
        <div
          className="flex items-center justify-between px-2 py-1 mb-4 border-b"
          style={{ borderColor: 'var(--term-border)' }}
        >
          <span style={{ color: 'var(--term-muted)' }}>PROJECT DETAILS</span>
          <span style={{ color: 'var(--term-muted)' }}>
            {isAdmin ? '[e] edit | [d] delete | ' : ''}[q] back
          </span>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 border"
            style={{ 
              borderColor: 'var(--term-error)', 
              backgroundColor: 'var(--term-selection)' 
            }}
          >
            <p style={{ color: 'var(--term-error)' }}>
              Delete "{viewingProject.title}"?
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--term-muted)' }}>
              Press [y] to confirm, [n] to cancel
            </p>
          </motion.div>
        )}

        {/* Admin action buttons */}
        {isAdmin && !showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-2 flex gap-2"
          >
            <button
              onClick={() => setEditingProject(viewingProject)}
              className="px-3 py-1 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--term-selection)',
                color: 'var(--term-primary)',
                border: '1px solid var(--term-primary)',
              }}
            >
              Edit [e]
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--term-selection)',
                color: 'var(--term-error)',
                border: '1px solid var(--term-error)',
              }}
            >
              Delete [d]
            </button>
          </motion.div>
        )}

        <div className="space-y-4 px-2">
          <h1 className="text-xl font-bold" style={{ color: 'var(--term-primary)' }}>
            {viewingProject.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {viewingProject.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 text-sm"
                style={{ backgroundColor: 'var(--term-selection)', color: 'var(--term-secondary)' }}
              >
                {tech}
              </span>
            ))}
          </div>

          <p style={{ color: 'var(--term-foreground)' }}>{viewingProject.description}</p>

          <div className="pt-4 space-y-2" style={{ color: 'var(--term-muted)' }}>
            {viewingProject.github && (
              <div>
                <span style={{ color: 'var(--term-info)' }}>GitHub:</span>{' '}
                <a
                  href={viewingProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  style={{ color: 'var(--term-primary)' }}
                >
                  {viewingProject.github}
                </a>
              </div>
            )}
            {viewingProject.link && (
              <div>
                <span style={{ color: 'var(--term-info)' }}>Live:</span>{' '}
                <a
                  href={viewingProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  style={{ color: 'var(--term-primary)' }}
                >
                  {viewingProject.link}
                </a>
              </div>
            )}
          </div>

          <footer
            className="pt-4 border-t text-sm"
            style={{ borderColor: 'var(--term-border)', color: 'var(--term-muted)' }}
          >
            Press [q] or [Esc] to return to project list
          </footer>
        </div>
      </div>
    );
  }

  // Show project list
  return (
    <div className="h-full overflow-auto p-4" style={{ color: 'var(--term-foreground)' }}>
      <div
        className="flex items-center justify-between px-2 py-1 mb-4 border-b"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          PORTFOLIO {isAdmin && <span style={{ color: 'var(--term-success)' }}>[ADMIN]</span>}
        </span>
        <span style={{ color: 'var(--term-muted)' }}>
          {projects.length} projects | [j/k] nav | {isAdmin && '[Shift+j/k] reorder | '}[Enter] view | {isAdmin && '[n] new | '}[q] quit
        </span>
      </div>

      {saveStatus === 'saved' && (
        <div className="mb-4 px-2 py-1 text-sm" style={{ color: 'var(--term-success)' }}>
          Project saved successfully!
        </div>
      )}

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-2 flex gap-2 flex-wrap"
        >
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--term-selection)',
              color: 'var(--term-primary)',
              border: '1px solid var(--term-primary)',
            }}
          >
            + New Project [n]
          </button>
          <button
            onClick={handleMoveUp}
            disabled={selectedIndex <= 0}
            className="px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--term-selection)',
              color: 'var(--term-info)',
              border: '1px solid var(--term-border)',
            }}
          >
            Move Up [Shift+K]
          </button>
          <button
            onClick={handleMoveDown}
            disabled={selectedIndex >= projects.length - 1}
            className="px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--term-selection)',
              color: 'var(--term-info)',
              border: '1px solid var(--term-border)',
            }}
          >
            Move Down [Shift+J]
          </button>
        </motion.div>
      )}

      {isLoading ? (
        <div className="px-2" style={{ color: 'var(--term-muted)' }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="px-2" style={{ color: 'var(--term-muted)' }}>No projects yet.</div>
      ) : (
        <div className="space-y-1">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                setSelectedIndex(index);
                setViewingProject(project);
              }}
              className="flex items-start gap-3 px-2 py-2 cursor-pointer transition-colors"
              style={{
                backgroundColor: index === selectedIndex ? 'var(--term-selection)' : 'transparent',
                borderLeft: index === selectedIndex ? '2px solid var(--term-primary)' : '2px solid transparent',
              }}
            >
              <span style={{ color: 'var(--term-muted)' }}>
                {isAdmin && (
                  <span className="mr-2 text-xs" style={{ color: 'var(--term-muted)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                {index === selectedIndex ? '>' : ' '}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: index === selectedIndex ? 'var(--term-primary)' : 'var(--term-foreground)' }}
                  >
                    {project.title}
                  </span>
                  {project.github && (
                    <span style={{ color: 'var(--term-muted)' }} className="text-sm">[git]</span>
                  )}
                  {project.link && (
                    <span style={{ color: 'var(--term-muted)' }} className="text-sm">[web]</span>
                  )}
                </div>
                <div className="text-sm truncate" style={{ color: 'var(--term-muted)' }}>
                  {project.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioApp;
