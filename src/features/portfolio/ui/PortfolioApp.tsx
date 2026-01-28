import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchProjects, fetchProjectBySlug, createProject, updateProject, deleteProject, reorderProjects } from '../../../shared/lib/api';
import type { Project } from '../../../shared/lib/api';
import { TuiEditor } from '../../../shared/ui/editor';
import type { EditorData } from '../../../shared/ui/editor';
import { TouchNav, type NavAction } from '../../../shared/ui/tui';

interface PortfolioAppProps {
  onBack: () => void;
  isAdmin?: boolean;
}

/**
 * Portfolio TUI Application
 * Displays projects in a terminal-style list view
 * Admin mode allows creating, editing, deleting, and reordering projects
 * Touch-friendly navigation for mobile users
 */
const PortfolioApp: React.FC<PortfolioAppProps> = ({ onBack, isAdmin = false }) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // View a project (updates URL for shareable links)
  const viewProject = useCallback((project: Project | null) => {
    setViewingProject(project);
    if (project?.slug) {
      navigate(`/portfolio/${project.slug}`, { replace: true });
    } else if (!project) {
      navigate('/portfolio', { replace: true });
    }
  }, [navigate]);

  // Load projects on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const allProjects = await fetchProjects();
      setProjects(allProjects);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Handle slug changes (direct navigation or programmatic)
  useEffect(() => {
    if (!slug) {
      // No slug - clear viewing state if we have one (user pressed back)
      // But don't clear if we're navigating programmatically via viewProject(null)
      return;
    }

    // If we already have this project loaded, just update state
    const existingProject = projects.find(p => p.slug === slug);
    if (existingProject) {
      setViewingProject(existingProject);
      const idx = projects.findIndex(p => p.slug === slug);
      if (idx >= 0) setSelectedIndex(idx);
      return;
    }

    // Direct navigation to slug - fetch the specific project
    if (projects.length > 0) {
      // Projects already loaded but this slug not found - fetch it
      const fetchProject = async () => {
        const project = await fetchProjectBySlug(slug);
        if (project) {
          setViewingProject(project);
        }
      };
      fetchProject();
    } else {
      // Projects not loaded yet - will be handled after projects load
      const fetchProject = async () => {
        const project = await fetchProjectBySlug(slug);
        if (project) {
          setViewingProject(project);
        }
      };
      fetchProject();
    }
  }, [slug, projects]);

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
          viewProject(null);
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
            viewProject(projects[selectedIndex]);
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
        content: data.content || undefined,
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
    if (!editingProject?.id) {
      console.error('Cannot update: editingProject.id is missing', editingProject);
      alert('Error: Project ID is missing. Cannot save.');
      return;
    }
    
    setSaveStatus('saving');
    try {
      const updated = await updateProject(editingProject.id, {
        title: data.title,
        description: data.description,
        content: data.content || undefined,
        technologies: data.technologies ? data.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        github: data.github || undefined,
        link: data.link || undefined,
      });
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
      viewProject(updated);
      setEditingProject(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaveStatus('error');
    }
  }, [editingProject]);

  const handleConfirmDelete = useCallback(async () => {
    if (!viewingProject?.id) return;
    
    try {
      await deleteProject(viewingProject.id);
      setProjects(prev => prev.filter(p => p.id !== viewingProject.id));
      viewProject(null);
      setShowDeleteConfirm(false);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, [viewingProject]);

  // Navigation actions for list view
  const getListActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'n', label: 'New', onClick: () => setIsCreating(true) });
      actions.push({ key: '↑', label: 'Up', onClick: handleMoveUp, disabled: selectedIndex <= 0 });
      actions.push({ key: '↓', label: 'Down', onClick: handleMoveDown, disabled: selectedIndex >= projects.length - 1 });
    }
    actions.push({ key: 'q', label: 'Back', onClick: onBack });
    return actions;
  };

  // Navigation actions for project view
  const getProjectActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'e', label: 'Edit', onClick: () => viewingProject && setEditingProject(viewingProject) });
      actions.push({ key: 'd', label: 'Delete', onClick: () => setShowDeleteConfirm(true), variant: 'danger' });
    }
    actions.push({ key: 'q', label: 'Back', onClick: () => viewProject(null) });
    return actions;
  };

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
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Brief description (shown in grid)...' },
          { name: 'content', label: 'Full Content (Markdown)', type: 'textarea', placeholder: '# Overview\n\nFull project writeup with markdown support...' },
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
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Brief description (shown in grid)...' },
          { name: 'content', label: 'Full Content (Markdown)', type: 'textarea', placeholder: '# Overview\n\nFull project writeup with markdown support...' },
        ]}
        initialData={{
          title: editingProject.title,
          technologies: editingProject.technologies?.join(', ') || '',
          github: editingProject.github || '',
          link: editingProject.link || '',
          description: editingProject.description,
          content: editingProject.content || '',
        }}
        onSave={handleUpdateProject}
        onCancel={() => setEditingProject(null)}
      />
    );
  }

  // Show individual project
  if (viewingProject) {
    return (
      <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--term-border)' }}
        >
          <span style={{ color: 'var(--term-muted)' }}>PROJECT DETAILS</span>
          <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>
            {isAdmin ? '[e] edit | [d] delete | ' : ''}[q] back
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
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
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: 'var(--term-error)',
                    color: 'var(--term-background)',
                  }}
                >
                  [y] Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: 'var(--term-selection)',
                    color: 'var(--term-foreground)',
                    border: '1px solid var(--term-border)',
                  }}
                >
                  [n] Cancel
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
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
                    className="underline hover:no-underline touch-manipulation"
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
                    className="underline hover:no-underline touch-manipulation"
                    style={{ color: 'var(--term-primary)' }}
                  >
                    {viewingProject.link}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Touch Navigation Bar */}
        <div
          className="shrink-0 border-t p-2"
          style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
        >
          <TouchNav actions={getProjectActions()} />
        </div>
      </div>
    );
  }

  // Show project list
  return (
    <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          PORTFOLIO {isAdmin && <span style={{ color: 'var(--term-success)' }}>[ADMIN]</span>}
        </span>
        <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>
          [j/k] nav | [Enter] view
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {saveStatus === 'saved' && (
          <div className="mb-4 px-2 py-1 text-sm" style={{ color: 'var(--term-success)' }}>
            Project saved successfully!
          </div>
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
                  viewProject(project);
                }}
                className="flex items-start gap-3 px-2 py-3 cursor-pointer transition-colors touch-manipulation"
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span
                      className="font-medium"
                      style={{ color: index === selectedIndex ? 'var(--term-primary)' : 'var(--term-foreground)' }}
                    >
                      {project.title}
                    </span>
                    <div className="flex gap-1">
                      {project.github && (
                        <span style={{ color: 'var(--term-muted)' }} className="text-sm">[git]</span>
                      )}
                      {project.link && (
                        <span style={{ color: 'var(--term-muted)' }} className="text-sm">[web]</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm truncate mt-1" style={{ color: 'var(--term-muted)' }}>
                    {project.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Touch Navigation Bar */}
      <div
        className="shrink-0 border-t p-2"
        style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
      >
        <TouchNav actions={getListActions()} />
      </div>
    </div>
  );
};

export default PortfolioApp;
